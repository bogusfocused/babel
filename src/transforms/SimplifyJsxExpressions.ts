import b from "@babel/core";
import t from "@babel/types";
import { Scope } from "@babel/traverse";
import { Transform } from "../App";

export class SimplyJsxExpressionTransform implements Transform {
  CallExpression?: Transform.NodeFunction<t.CallExpression>;
  replaceParamWithArg(param: b.NodePath, arg: b.NodePath, scope: Scope) {
    if (param.isObjectPattern() && arg.isObjectExpression()) {
      const argp = {} as Record<string, b.NodePath<t.ObjectProperty>>;

      arg.get("properties").forEach(x => {
        if (x.isObjectProperty()) {
          const key = x.get("key");
          if (key.isIdentifier()) argp[key.node.name] = x;
        }
      });

      param.get("properties").forEach(x => {
        if (x.isObjectProperty()) {
          const key = x.get("key");
          if (key.isIdentifier()) {
            const ap = argp[key.node.name];
            const binding = scope.getBinding(key.node.name);
            binding?.referencePaths.forEach(x => x.replaceWith(ap.node.value));
          }
        }
      });
    }
  }
  ReturnStatement(path: b.NodePath<t.ReturnStatement>) {
    const self = this;
    this.CallExpression = _path => {
      const callee = _path.get("callee");
      if (!callee.isIdentifier()) return;
      const decl = _path.scope.getBinding(callee.node.name);
      if (!decl?.path.isVariableDeclarator()) return;
      if (callee.node.name !== "textInputProps") return;
      const init = decl?.path?.get("init");
      if (!init?.isArrowFunctionExpression()) return;
      const body = init.get("body");
      if (!body.isExpression()) return;
      const args = _path.get("arguments");
      init.get("params").forEach((param, i) => {
        self.replaceParamWithArg(param, args[i], body.scope);
      });
      _path.replaceWith(body.node);
    };
  }
}
