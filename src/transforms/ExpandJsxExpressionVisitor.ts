import b from "@babel/core";
import t from "@babel/types";
import { createElement } from "./utils";
import { Transform } from "../App";
export class ExpandJsxExpressionVisitor extends Transform {
  expandJsxExpression(
    x: b.NodePath<b.types.Expression> | undefined
  ): b.types.JSXElement | b.types.JSXExpressionContainer | null {
    if (x === undefined) return null;
    while (x.isParenthesizedExpression()) x = x.get("expression");
    return x.isJSXElement()
      ? x.node
      : x.isNullLiteral()
      ? null
      : x.isLogicalExpression()
      ? this.tagIfElse(x.node.left, x.get("right"))
      : x.isConditionalExpression()
      ? this.tagIfElse(x.node.test, x.get("consequent"), x.get("alternate"))
      : t.jsxExpressionContainer(x.node);
  }
  tagIfElse(
    test: b.types.Expression,
    body: b.NodePath<b.types.Expression>,
    elsebody?: b.NodePath<b.types.Expression>
  ) {
    const s_ebody = this.expandJsxExpression(elsebody);
    const s_body =
      this.expandJsxExpression(body) ??
      b.types.jsxExpressionContainer(b.types.jsxEmptyExpression());
    return createElement(
      "if",
      { test },
      s_ebody ? [s_body, createElement("else", {}, [s_ebody])] : [s_body]
    );
  }

  JSXElement(path: b.NodePath<t.JSXElement>) {
    for (let child of path.get("children")) {
      if (child.isJSXExpressionContainer()) {
        const exp = child.get("expression");
        if (exp.isExpression()) {
          const ss = this.expandJsxExpression(exp);
          if (!ss) child.remove();
          else child.replaceWith(ss);
        }
      }
    }
    path.scope.crawl();
  }
}
