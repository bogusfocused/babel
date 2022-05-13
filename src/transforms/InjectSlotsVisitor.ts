import b from "@babel/core";
import t from "@babel/types"
import { Bundle } from "../propTypesParser";
import { Transform } from "../App";
import { createElement } from "./utils";

export class InjectSlotsVisitor {
  private readonly bundle: Bundle;
  constructor(bundle: Bundle) {
    this.bundle = bundle;
  }
  JSXExpressionContainer(
    path: b.NodePath<t.JSXExpressionContainer>,
    state: Transform.State
  ) {
    const element = path.parentPath.as(t.isJSXElement);
    if (
      !element ||
      element
        .get("openingElement")
        .get("name")
        .isJSXIdentifier({ name: "slot" })
    ) {
      path.skip();
      return;
    }

    const exp = path.getOfType("expression", t.isIdentifier).node;
    if (!exp) return;
    if (exp.name === "children") path.replaceWith(createElement("slot"));
    else if (this.bundle.controls[state.context.file]?.slots?.includes(exp.name))
      path.replaceWith(createElement("slot", { name: exp.name }, [exp]));
  }
}
