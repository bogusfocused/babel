import b from "@babel/core";
import t from "@babel/types";
import { Transform } from "../App";
export class JSXAttributeTranslateVisitor  {
  private translationTable;
  constructor(translationTable: Record<string, string>) {
    this.translationTable = translationTable;
  }
  JSXAttribute(path: b.NodePath<t.JSXAttribute>) {
    let name = path.node.name.name;
    name = typeof name === "string" ? name : name.name;
    const attr = this.translationTable[name];
    if (attr) path.node.name = t.jsxIdentifier(attr);
  }
}
