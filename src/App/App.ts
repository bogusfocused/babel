import b from "@babel/core";
import { compose, Middleware } from "./compose";
import deepmerge from "deepmerge";
import { TransformContext, _TransformContext } from "./TransformContext";
import { AppOptions } from "./index";
import { Loader, DefaultLoad, LoadOptions, Load } from "./LoadOptions";

export class App {
  private readonly _loader: Loader;
  private readonly transformers: Array<Middleware<TransformContext>> = [];
  private composed: Middleware | null = null;
  private static _defaultOptions: b.TransformOptions = {
    ast: true,
    configFile: false,
    babelrc: false,
    browserslistConfigFile: false,
    sourceType: "module",
    cloneInputAst: false,
    parserOpts: {
      createParenthesizedExpressions: true,
      plugins: ["jsx", "flow"],
      sourceType: "module",
    },
    plugins: ["@babel/plugin-syntax-export-default-from"],
  };
  static defaultLoad: DefaultLoad;
  private _options: AppOptions;

  constructor(options: AppOptions) {
    this._loader = new Loader(App.defaultLoad);
    this._options = deepmerge.all([options, { options: App._defaultOptions }]);
  }
  use1(fn: (transform: TransformContext) => Promise<void>) {
    this.transformers.push(fn);
    this.composed = null;
  }
  use(plugin: b.PluginItem): void;
  use<S extends Partial<TransformContext>>(plugin: {
    babelPlugin: (s: S) => b.PluginItem;
  }): void;
  use(
    plugin:
      | b.PluginItem
      | {
          babelPlugin: (
            s: Partial<TransformContext>
          ) => Promise<b.PluginItem> | b.PluginItem;
        }
  ) {
    this._usePlugin(
      typeof plugin === "object" && "babelPlugin" in plugin
        ? (ctx) => plugin.babelPlugin(ctx)
        : (_ctx) => plugin
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
  async createTransformContext(file: string): Promise<TransformContext> {
    const { code, options: file_options } = await Promise.resolve(
      this._loader.load({ file, ...this._options })
    );
    const options = deepmerge.all<b.TransformOptions>([
      file_options,
      this._options.options!,
      { plugins: [] },
    ]);
    const ctx = await _TransformContext.fromCode(this, file, options, code);
    return ctx;
  }
  async transform(file: string): Promise<string | null | undefined> {
    const ctx = await this.createTransformContext(file);
    await this.processMessage(ctx);
    return await ctx.code;
  }
}
