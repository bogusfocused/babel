import b from "@babel/core";
import t from "@babel/types";
import { Transform } from "../App";

export class RemoveUnusedCode extends Transform {
  Program(path: b.NodePath<t.Program>) {
    path.setScope();
    path.scope.crawl()
    const bs = path.scope.getBinding("textInputProps")?.references
  }
}
