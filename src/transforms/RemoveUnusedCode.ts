import b from "@babel/core";
import t from "@babel/types";
import { Transform } from "./Transform";

export class RemoveUnusedCode extends Transform {
  Scopable(path: b.NodePath<t.Scopable>) {
    const bs = path.scope.bindings
  }
}
