import b from "@babel/core";
import { posix } from "path";
import { t } from "./babel";
import { App } from "./App";
export interface TransformContext {
  readonly app: App;
  readonly ast: b.types.File;
  readonly code: Promise<string>;
  transform(plugin: string): Promise<void>;
  transform(
    plugin: (ctx: TransformContext) => b.PluginItem | Promise<b.PluginItem>
  ): Promise<void>;
  inspect<S>(visitor: b.Visitor<S>, state: S): S;
}
export class _TransformContext implements TransformContext {
  readonly app: App;
  private readonly _file: string;
  private readonly options: b.TransformOptions;
  private _ast: b.types.File;
  get ast(): b.types.File {
    return this._ast;
  }
  private set ast(value: t.File) {
    this._ast = value;
  }
  get code(): Promise<string> {
    return b
      .transformFromAstAsync(this.ast, undefined, {
        ...this.options,
        code: true,
      })
      .then((value) => value?.code!);
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
    this.ast = result?.ast!;
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
  constructor({
    app,
    file,
    ast,
    options,
  }: {
    app: App;
    file: string;
    ast: t.File;
    options: b.TransformOptions;
  }) {
    this._ast = ast;
    this._file = file;
    this.app = app;
    this.options = options;
  }
  static async fromCode(
    app: App,
    file: string,
    options: b.TransformOptions,
    code: string
  ): Promise<TransformContext> {
    const result = await b.transformAsync(code, options);
    const ctx = new _TransformContext({
      app,
      file,
      options,
      ast: result?.ast!,
    });
    return ctx;
  }
}
