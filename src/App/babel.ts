import { NodePath } from "@babel/traverse";
import t, { Program } from "@babel/types";

declare module "@babel/traverse" {
  interface NodePath<T = Node> {
    getOfType<
      K extends keyof T,
      N extends T[K] extends Array<Node | null | undefined>
        ? T[K][number]
        : T[K]
    >(
      key: K,
      predicate: (
        value: T[K] extends Array<Node | null | undefined> ? T[K][number] : T[K]
      ) => value is N
    ): T[K] extends Array<Node | null | undefined>
      ? Array<NodePath<N | null | undefined>>
      : T[K] extends Node | null | undefined
      ? NodePath<N | null | undefined>
      : never;

    as<N extends T>(
      predicate: (obj: T | null | undefined) => obj is N
    ): NodePath<N> | null | undefined;

    findParentOfType<N extends Node>(
      predicate: (obj: Node | null | undefined) => obj is N
    ): NodePath<N> | null;
  }
}
NodePath.prototype.getOfType = function (key, predicate) {
  const value = this.get(key);
  if (Array.isArray(value)) return value.filter((x) => predicate(x));
  else return predicate(value) ? value : new NodePath(value.hub, value.parent);
};
NodePath.prototype.as = function (predicate) {
  return predicate(this.node) ? this : null;
};

NodePath.prototype.findParentOfType = function (predicate) {
  return this.findParent((x) => predicate(x.node)) as any;
};
