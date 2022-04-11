import b from "@babel/core";
const t = b.types;
export default function (): b.PluginObj<b.PluginPass> {
  const v = function (
    source: b.types.StringLiteral,
    local: string,
    imported?: b.types.Identifier
  ): b.Visitor<{ nodes: b.types.ExportNamedDeclaration[] }> {
    return {
      ExportSpecifier(path, state) {
        if (
          path.node.local.name === local &&
          path.parentPath.isExportNamedDeclaration({ source: null }) &&
          t.isIdentifier(path.node.exported)
        ) {
          const exported = path.node.exported;
          const specs = imported
            ? t.exportSpecifier(imported, exported)
            : t.exportDefaultSpecifier(exported);
          state.nodes.push(t.exportNamedDeclaration(null, [specs], source));
          if (path.parentPath.node.specifiers.length === 1)
            path.parentPath.remove();
          else
            path.parentPath.replaceWith(
              t.exportNamedDeclaration(
                null,
                path.parentPath.node.specifiers.slice(1),
                null
              )
            );
        }
      },
      ExportDefaultDeclaration(path, state) {
        if (t.isIdentifier(path.node.declaration, { name: local })) {
          const specs = t.exportDefaultSpecifier(t.identifier("default"));
          state.nodes.push(t.exportNamedDeclaration(null, [specs], source));
          path.remove();
        }
      },
    };
  };
  return {
    name: "ast-transform", // not required
    visitor: {
      ImportDefaultSpecifier(path) {
        if (path.parentPath.isImportDeclaration()) {
          const local = path.node.local.name;
          const nodes = [] as b.types.ExportNamedDeclaration[];
          path.scope.path.traverse(v(path.parentPath.node.source, local), {
            nodes,
          });
          path.parentPath.replaceWithMultiple(nodes);
        }
      },
      ImportSpecifier(path) {
        if (
          path.parentPath.isImportDeclaration() &&
          t.isIdentifier(path.node.imported)
        ) {
          const local = path.node.local.name;
          const imported = path.node.imported;
          const nodes = [] as b.types.ExportNamedDeclaration[];

          path.scope.path.traverse(
            v(path.parentPath.node.source, local, imported),
            { nodes }
          );
          path.parentPath.replaceWithMultiple(nodes);
        }
      },
    },
  };
}
