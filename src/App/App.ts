import b from "@babel/core";
import { compose, Middleware } from "./compose";
import { TransformContext, createContextFromCode } from "./TransformContext";

import { Loader, VirtualFileSystem, LoadOptions, Load } from "./load";
import { Transform, createBabelPlugin } from "./babelPlugin";

export interface AppOptions {
  encoding?: BufferEncoding;
  sourceRoot?: string;
  transformOptions?: {
    parserOpts?: {
      plugins?: b.ParserOptions["plugins"];
    };
    plugins?: b.TransformOptions["plugins"];
  };
  fs?: VirtualFileSystem;
}
export class App {
  private readonly _loader: Loader;
  private readonly transformers: Array<Middleware<TransformContext>> = [];
  private composed: Middleware | null = null;

  private _options: AppOptions;
  get options(): Readonly<AppOptions> {
    return this._options;
  }
  constructor(options: AppOptions) {
    this._options = options;
    encoding: this._options.encoding ?? "utf8",
      (this._loader = new Loader(this._options.fs, this._options.encoding));
  }
  use1(fn: (transform: TransformContext) => Promise<void>) {
    this.transformers.push(fn);
    this.composed = null;
  }
  use(plugin: string): void;
  use(transform:  Transform): void;
  use(plugin: string |  Transform) {
    this._usePlugin(
      typeof plugin === "string"
        ? _ctx => plugin
        : ctx => createBabelPlugin(plugin, ctx)
    );
  }
  private _usePlugin(
    plugin: (ctx: TransformContext) => Promise<b.PluginItem> | b.PluginItem
  ) {
    this.transformers.push(async function (ctx, next) {
      await ctx.transform(plugin);
      if (next) await next();
    });
    this.composed = null;
  }
  protected async processMessage(context: any) {
    let composed = this.composed;
    if (!composed) {
      composed = this.composed = compose(this.transformers);
    }
    await composed(context);
    return context;
  }
  onLoad(options: LoadOptions, load: Load) {
    this._loader.onLoad(options, load);
  }
  async createTransformContext(arg: {
    file: string;
    code?: string;
  }): Promise<TransformContext> {
    const { code } =
      "code" in arg
        ? { code: arg.code }
        : await Promise.resolve(
            this._loader.load({
              sourceRoot: this._options.sourceRoot,
              file: arg.file,
            })
          );
    const ctx = await createContextFromCode(this, arg.file, code!);
    return ctx;
  }
  async transform(arg: {
    file: string;
    code?: string;
  }): Promise<string | null | undefined>;
  async transform(file: string): Promise<string | null | undefined>;
  async transform(file: any): Promise<string | null | undefined> {
    const ctx = await this.createTransformContext({ file });
    await this.processMessage(ctx);
    return await ctx.generate();
  }
}
