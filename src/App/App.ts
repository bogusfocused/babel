import b from "@babel/core";
import t from "@babel/types";
import * as tr from "@babel/traverse";

import { compose, Middleware, Next } from "./compose";
import { TransformContext, createContextFromCode } from "./TransformContext";

import { Loader, VirtualFileSystem, LoadOptions, Load } from "./load";
import Transform, { TransformType } from "./Transform";

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
    encoding: this._options.encoding ?? "utf8", (this._loader = new Loader(this._options.fs, this._options.encoding));
  }

  use(middleware: Middleware<TransformContext>): void {
    this.transformers.push(middleware);
    this.composed = null;
  }
  useTransform(
    ...factory: Transform.FactoryArgs<Transform & { start?(context: TransformContext): Promise<void> }, any[]>
  ): void {
    this.transformers.push(Transform.createMiddleware(factory));
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
  async createTransformContext(arg: { file: string; code?: string }): Promise<TransformContext> {
    const { code } = arg.code
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
  async transform(arg: { file: string; code?: string }): Promise<string | null | undefined>;
  async transform(file: string): Promise<string | null | undefined>;
  async transform(arg: any): Promise<string | null | undefined> {
    const ctx = await this.createTransformContext(typeof arg === "string" ? { file: arg } : arg);
    await this.processMessage(ctx);
    return await ctx.generate();
  }
}
