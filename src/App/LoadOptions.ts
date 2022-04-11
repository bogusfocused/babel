import b from "@babel/core";

export interface LoadOptions { }
export interface LoadArgs {
  file: string;
  sourceRoot?: string;
}
interface LoadResult {
  code?: string;
  options?: b.TransformOptions;
}
export type Load = (args: LoadArgs) => Promise<LoadResult> | LoadResult;
export type DefaultLoad = (
  args: LoadArgs
) => Promise<{ code: string; options: b.TransformOptions; }>;
export class Loader {
  loads: Array<readonly [LoadOptions, Load]> = [];
  private readonly _defaultLoad: DefaultLoad;
  constructor(defaultLoad: DefaultLoad) {
    this._defaultLoad = defaultLoad;
  }
  onLoad(options: LoadOptions, load: Load) {
    this.loads.push([options, load] as const);
  }
  async load(args: LoadArgs) {
    return await Promise.resolve(this._defaultLoad(args));
  }
}
