import b from "@babel/core";
import t from "@babel/types";
import { Transform } from "../App";
import { hasJSX } from "./visitor-hasJSX";
// Inline all JSX Elements

export class InlineJsxVisitor  {
  reducer<T, S extends t.Node>(
    maping: (value: T) => b.NodePath<t.Node>,
    predicate: (node: object) => node is S
  ) {
    return (
      previousValue: [T, b.NodePath<S>][],
      currentValue: T,
      currentIndex: number,
      array: T[]
    ): [T, b.NodePath<S>][] => {
      const path = maping(currentValue);
      if (predicate(path.node)) {
        previousValue.push([currentValue, path as unknown as b.NodePath<S>]);
      }
      return previousValue;
    };
  }
  Scopable(path: b.NodePath<t.Scopable>) {
    if (!path.scope.parent) return;
    Object.values(path.scope.bindings)
      .filter(x => x.kind !== "module")
      .reduce(
        this.reducer(x => x.path, t.isVariableDeclarator),
        []
      )
      .filter(([x, path]) => hasJSX(path.get("init")))
      .forEach(([x, path]) => {
        const init = path.node.init;
        if (init) {
          for (let refer of x.referencePaths) {
            refer.replaceWith(t.parenthesizedExpression(init));
            refer.scope.crawl();
          }
        }
        x.path.remove();
        x.path.scope.crawl();
      });
  }
}
