import b, { types as t } from "@babel/core";
import "./babel";
import { posix } from "path";
import { App } from "./App";
export interface TransformContext {
  readonly app: App;
  readonly ast: b.types.File;
  generate(): Promise<string>;
  readonly file: string;
  transform(plugin: string): Promise<void>;
  transform(
    plugin: (ctx: TransformContext) => b.PluginItem | Promise<b.PluginItem>
  ): Promise<void>;
  inspect<S>(visitor: b.Visitor<S>, state: S): S;
  relativePath(filepath: string): string;
  absolutePath(filepath: string): string;
}
export class _TransformContext implements TransformContext {
  readonly app: App;
  private readonly _file: string;
  private readonly options: b.TransformOptions;
  private _ast?: b.types.File | null | undefined;
  private _code: string;
  get ast(): b.types.File {
    return this._ast!;
  }
  async parse() {
    const result = await b.transformAsync(this._code, this.options);
    this._ast = result?.ast;
  }
  async generate(): Promise<string> {
    const result = await b.transformFromAstAsync(this.ast, undefined, {
      ...this.options,
      code: true,
    });
    return result?.code!;
  }
  async transform(
    plugin:
      | string
      | ((ctx: TransformContext) => b.PluginItem | Promise<b.PluginItem>)
  ): Promise<void> {
    const _plugin =
      typeof plugin === "string" ? plugin : await Promise.resolve(plugin(this));
    const result = await b.transformFromAstAsync(this.ast, undefined, {
      overrides: [this.options],
      plugins: [_plugin],
    });
    this._ast = result?.ast!;
  }

  inspect<S>(visitor: b.Visitor<S>, state: S): S {
    b.traverse(this.ast, visitor, undefined, state);
    return state;
  }

  get filename() {
    return posix.basename(this._file, ".js");
  }
  get file() {
    return this._file;
  }

  get directory() {
    return posix.dirname(this._file);
  }
  relativePath(filepath: string): string {
    if (filepath.startsWith("."))
      return posix.relative(this.directory, filepath);
    return filepath;
  }

  absolutePath(filepath: string) {
    if (!filepath.startsWith(".")) return filepath;
    else {
      return posix.normalize(posix.join(this.directory, filepath));
    }
  }
  constructor({ app, file, code }: { app: App; file: string; code: string }) {
    this._code = code;
    this._file = file;
    this.app = app;
    this.options = {
      ast: true,
      configFile: false,
      babelrc: false,
      browserslistConfigFile: false,
      sourceType: "module",
      cloneInputAst: false,
      filename: file,
      filenameRelative: file,
      sourceFileName: file,
      parserOpts: {
        sourceFilename: file,
        createParenthesizedExpressions: true,
        plugins: [
          "jsx",
          "flow",
          ...(app.options.transformOptions?.parserOpts?.plugins ?? []),
        ],
        sourceType: "module",
      },
      plugins: [
        "@babel/plugin-syntax-export-default-from",
        ...(app.options.transformOptions?.plugins ?? []),
      ],
    };
  }

  static async fromCode(
    app: App,
    file: string,
    code: string
  ): Promise<TransformContext> {
    const ctx = new _TransformContext({
      app,
      file,
      code,
    });
    await ctx.parse();
    return ctx;
  }
}
