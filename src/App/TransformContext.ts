import b, { types as t } from "@babel/core";
import "./babel";
import { ParsedPath, posix } from "path";
import { App } from "./App";

export interface TransformContext {
  readonly app: App;
  readonly ast: b.types.File;
  generate(): Promise<string>;
  readonly file: string;
  readonly filepath: ParsedPath;
  transform(plugin: b.PluginItem): Promise<void>;
  inspect<S>(visitor: b.Visitor<S>, state: S): S;
  relativePath(filepath: string): string;
  absolutePath(filepath: string): string;
}
export async function createContextFromCode(app: App, file: string, code: string): Promise<TransformContext> {
  const ctx = new _TransformContext({
    app,
    file,
    code,
  });
  await ctx.parse();
  return ctx;
}
export class _TransformContext implements TransformContext {
  readonly app: App;
  private readonly _file: string;
  readonly filepath: ParsedPath;
  private readonly options: b.TransformOptions;
  private _ast?: b.types.File | null | undefined;
  private _code: string;
  get ast(): b.types.File {
    return this._ast!;
  }
  async parse() {
    const result = await b.parseAsync(this._code, this.options);
    this._ast = result;
  }
  async generate(): Promise<string> {
    const result = await b.transformFromAstAsync(this._ast!, undefined, {
      ...this.options,
      code: true,
    });
    return result?.code!;
  }
  async transform(plugin: b.PluginItem): Promise<void> {
    const result = await b.transformFromAstAsync(this._ast!, undefined, {
      code: true,
      overrides: [this.options],
      plugins: [plugin],
    });
    this._ast = result?.ast!;
  }

  inspect<S>(visitor: b.Visitor<S>, state: S): S {
    b.traverse(this.ast, visitor, undefined, state);
    return state;
  }

  get file() {
    return this._file;
  }

  relativePath(filepath: string): string {
    if (filepath.startsWith(".")) return posix.relative(this.filepath.dir, filepath);
    return filepath;
  }

  absolutePath(filepath: string) {
    if (!filepath.startsWith(".")) return filepath;
    else {
      return posix.normalize(posix.join(this.filepath.dir, filepath));
    }
  }
  constructor({ app, file, code }: { app: App; file: string; code: string }) {
    this._code = code;
    this._file = file;
    this.filepath = posix.parse(file);
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
        plugins: ["jsx", "flow", ...(app.options.transformOptions?.parserOpts?.plugins ?? [])],
        sourceType: "module",
      },
      plugins: ["@babel/plugin-syntax-export-default-from", ...(app.options.transformOptions?.plugins ?? [])],
    };
  }
}
