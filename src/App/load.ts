import Path from "path";
export interface VirtualFileSystem {
  readFile(path: string, options: BufferEncoding): Promise<string>;
}
export interface LoadOptions {}
export interface LoadArgs {
  file: string;
  sourceRoot?: string;
}
interface LoadResult {
  code?: string;
}
export type Load = (args: LoadArgs) => Promise<LoadResult> | LoadResult;

export class Loader {
  loads: Array<readonly [LoadOptions, Load]> = [];
  readonly fs: VirtualFileSystem | undefined;
  readonly encoding: string;
  constructor(fs?: VirtualFileSystem, encoding?: BufferEncoding) {
    this.fs = fs;
    this.encoding = encoding ?? "utf8";
  }
  onLoad(options: LoadOptions, load: Load) {
    this.loads.push([options, load] as const);
  }
  async load(args: LoadArgs): Promise<LoadResult> {
    const code = args.sourceRoot ? await this.fs?.readFile(Path.join(args.sourceRoot, args.file), "utf8") : undefined;

    return { code };
  }
}
