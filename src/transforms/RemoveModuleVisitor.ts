import b from "@babel/core";
import t from "@babel/types";
import { ImportedValueVisitor } from "./ImportedValueVisitor";
export class RemoveModuleVisitor extends ImportedValueVisitor {
  constructor(modulename: string, imported?: string) {
    super(modulename, imported);
  }
  event(_modulename: string, imported: string, path: b.NodePath): boolean | undefined {
    let _path: b.NodePath | null = path;
    while (_path && !_path.inList) _path = _path.parentPath;
    if (_path && !_path.removed) {
      _path.remove();
      return true;
    }
  }
}
