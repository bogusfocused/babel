import { TransformContext } from "../App";
import b from "@babel/core";
import t from "@babel/types";
import App, { Transform } from "../App";

interface InlineImportFile {
  noSideEffects: boolean;
  statements: Array<[t.Statement, string[]]>;
}

export class InlineImportVisitor implements Transform {
  private readonly files: Record<string, InlineImportFile & { context: TransformContext }> = {};
  private readonly _paths: string[] = [];
  constructor(files: string[]) {
    this._paths = files;
  }

  async setup(app: App): Promise<void> {
    for (const file of this._paths) {
      const context = await app.createTransformContext({ file });
      this.files[file] = {
        context,
        ...context.inspect<InlineImportFile>(
          {
            Program(path, state) {
              path.get("body").forEach(s => {
                state.noSideEffects &&= s.isDeclaration();
                if (s.isExportNamedDeclaration()) {
                  state.statements.push([s.node.declaration!, []]);
                } else {
                  const names = Object.keys(path.scope.bindings).filter(name => {
                    const binding = path.scope.bindings[name];
                    return binding.path.isDescendant(s) || binding.referencePaths.some(p => p.isDescendant(s));
                  });
                  state.statements.push([s.node, names]);
                }
              });
            },
          },
          { noSideEffects: true, statements: [] }
        ),
      };
    }
  }

  ImportDeclaration(path: b.NodePath<t.ImportDeclaration>, state: Transform.State) {
    const modulePath = state.context.absolutePath(path.node.source.value);
    const filepath = this._paths.find(x => x.startsWith(modulePath));
    if (!filepath) return;
    const file = this.files[filepath];
    let bstm = [] as t.Statement[];
    for (const [stmt, names] of file.statements) {
      if (names.every(x => path.scope.getBinding(x) === undefined)) {
        if (t.isExportNamedDeclaration(stmt)) {
          bstm.push(stmt.declaration!);
        } else bstm.push(stmt);
      }
    }
    path.scope.crawl();
    path.scope.removeBinding("useNormalizedInputProps");
    path.replaceWithMultiple(bstm);
  }
}
