import b from "@babel/core";
import t from "@babel/types"
import { ImportedValueVisitor } from "./ImportedValueVisitor";

export class MutationVisitor extends ImportedValueVisitor {
  readonly mutation;
  constructor(
    modulename: string,
    imported: string,
    mutation: (path: b.NodePath) => void
  ) {
    super(modulename, imported);
    this.mutation = mutation;
  }
  event(
    modulename: string,
    imported: string,
    path: b.NodePath<b.types.Node>
  ): boolean {
    this.mutation(path);
    return false;
  }
}
