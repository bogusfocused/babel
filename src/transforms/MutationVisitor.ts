import b from "../App/babel";
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
