import b from "@babel/core";
import t, { assertImportDeclaration } from "@babel/types";
import { Transform, TransformState, Visitor } from "./Transform";

//
type State = { relativePath: (file: string) => string };
export abstract class ImportedValueVisitor
  extends Transform
  implements Partial<Visitor>
{
  readonly importedModule: string;
  readonly importedValue?;
  constructor(importedModule: string, importedValue?: string) {
    super();
    this.importedModule = importedModule;
    this.importedValue = importedValue;
  }
  abstract event(
    modulename: string,
    imported: string,
    path: b.NodePath
  ): boolean | undefined;

  private raiseEvent({
    modulename,
    imported,
    path,
    state,
  }: {
    modulename: string;
    imported: string;
    path: b.NodePath;
    state: State;
  }): boolean {
    const importedModule = state.relativePath(this.importedModule);
    if (!modulename || modulename === importedModule) {
      if (!this.importedValue || imported === this.importedValue) {
        return this.event(modulename, imported, path) ?? false;
      }
    }
    return false;
  }
  private deleteDeclarationIfEmpty(path: b.NodePath): void {
    const parent = path.parentPath;
    assertImportDeclaration(parent?.node);
    if (parent.node.specifiers.length === 0) parent.remove();
  }
  private getImportSource(path: b.NodePath): string {
    const parent = path.parentPath;
    assertImportDeclaration(parent?.node);
    return parent.node.source.value;
  }
  ImportSpecifier(
    path: b.NodePath<t.ImportSpecifier>,
    state: TransformState
  ): void {
    const binding = path.scope.bindings[path.node.local.name];
    const imported = path.node.imported;
    const remove = binding.referencePaths
      .map((refer) =>
        this.raiseEvent({
          modulename: this.getImportSource(path),
          imported: "value" in imported ? imported.value : imported.name,
          path: refer,
          state: state.state,
        })
      )
      .every((x) => x);
    if (remove) path.remove();
    this.deleteDeclarationIfEmpty(path);
  }
  ImportDefaultSpecifier(
    path: b.NodePath<t.ImportDefaultSpecifier>,
    state: TransformState
  ) {
    const localname = path.node.local.name;
    const binding = path.scope.bindings[localname];
    const remove = binding.referencePaths
      .map((refer) => {
        const parent = refer.parentPath!;
        if (parent.isMemberExpression() && t.isIdentifier(parent.node.property))
          return this.raiseEvent({
            modulename: this.getImportSource(path),
            imported: parent.node.property.name,
            path: refer,
            state: state.state,
          });
        else return false;
      })
      .every((x) => x);
    if (remove) path.remove();
    this.deleteDeclarationIfEmpty(path);
  }
}
