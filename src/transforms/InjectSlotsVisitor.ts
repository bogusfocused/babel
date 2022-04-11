import b, { t } from "../App/babel";
import { NodePath } from "@babel/core";
import { Bundle } from "../propTypesParser";
import { Transform, TransformState } from "./Transform";
import { createElement } from "./utils";

export class InjectSlotsVisitor extends Transform {
  private readonly bundle: Bundle;
  constructor(bundle: Bundle) {
    super();
    this.bundle = bundle;
  }
  JSXExpressionContainer(
    path: NodePath<t.JSXExpressionContainer>,
    state: TransformState
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
    else if (this.bundle.controls[state.state.file]?.slots?.includes(exp.name))
      path.replaceWith(createElement("slot", { name: exp.name }, [exp]));
  }
}
