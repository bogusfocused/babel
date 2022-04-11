import b from "@babel/core";
import Path from "path";
import fs from "node:fs/promises";
import { App } from "./App";
import { LoadArgs } from "./LoadOptions";
import { Middleware } from "./compose";
export interface AppOptions {
  sourceRoot?: string;
  options?: b.TransformOptions;
}
App.defaultLoad = async function (args: LoadArgs) {
  async function getCode(file: string, sourceRoot: string): Promise<string> {
    return await fs.readFile(Path.join(sourceRoot, file), "utf8");
  }
  function getOptions(file: string) {
    return {
      filename: file.substring(0, -3),
      filenameRelative: file,
      sourceFileName: file,
      parserOpts: {
        sourceFilename: file,
      },
    };
  }
  if (!args.sourceRoot) throw TypeError("");
  return {
    code: await getCode(args.file, args.sourceRoot),
    options: getOptions(args.file),
  };
};
export default App;
export { type Middleware };
export {_TransformContext as TransformContext } from "./TransformContext"
