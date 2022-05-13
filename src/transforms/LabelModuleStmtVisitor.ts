import b from "@babel/core";
import t from "@babel/types"
import { Transform } from "../App";

export class LabelModuleStmtVisitor  {
  ExportDefaultDeclaration(path: b.NodePath<t.ExportDefaultDeclaration>) {
    const defaultExport = path.getOfType("declaration", t.isIdentifier).node
      ?.name;
    if (!defaultExport) return;
    const bindings = path.scope.bindings[defaultExport];
    if (!bindings) return;
    const statements = bindings.referencePaths
      .map((x) => x.getStatementParent()!)
      .filter((x) => !x.isExportDefaultDeclaration());
    if (statements.length > 0) {
      const lstatement = t.labeledStatement(
        t.identifier("module"),
        t.blockStatement(statements.map((x) => x.node))
      );
      for (const st of statements) st.remove();
      path.replaceWithMultiple([lstatement, path.node]);
    }
  }
}
