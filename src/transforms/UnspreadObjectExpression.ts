import b from "@babel/core";
import t from "@babel/types"
import { Transform } from "../App";

export class UnspreadObjectExpression extends Transform {
  JSXSpreadAttribute(path: b.NodePath<b.types.JSXSpreadAttribute>) {
    let argument = path.get("argument");
    while (argument.isParenthesizedExpression())
      argument = argument.get("expression");
    if (argument.isIdentifier()) {
      const name = argument.node.name;
      const binding = path.scope.getBinding(name);
      if (binding?.constant && binding.path.isVariableDeclarator()) {
        const init = binding.path.get("init");
        if (init.isObjectExpression()) {
          const nodes = init.get("properties").reduce((nodes, x) => {
            if (x.isObjectProperty()) {
              const key = x.get("key");
              const value = x.get("value");
              if (key.isIdentifier() && value.isExpression())
                nodes.push(
                  t.jsxAttribute(
                    t.jsxIdentifier(key.node.name),
                    t.jsxExpressionContainer(value.node)
                  )
                );
            } else if (x.isSpreadElement()) {
              nodes.push(t.jsxSpreadAttribute(x.node.argument));
            }
            return nodes;
          }, [] as t.Node[]);
          path.replaceWithMultiple(nodes.filter((x) => x));
        }
      }
    } else if (argument.isObjectExpression()) {
      const nodes = argument.get("properties").reduce((nodes, x) => {
        if (x.isSpreadElement())
          nodes.push(t.jsxSpreadAttribute(x.node.argument));
        else if (x.isObjectProperty())
          nodes.push(t.jsxExpressionContainer(x.node.key));
        return nodes;
      }, [] as t.Node[]);
      path.replaceWithMultiple(nodes);
    }
  }
}
