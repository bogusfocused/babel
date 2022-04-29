import { TransformContext } from "../App";
import b from "@babel/core";
import t from "@babel/types";
import { Transform, TransformState, Visitor } from "./Transform";

interface InlineImportFile {
  noSideEffects: boolean;
  statements: Array<[t.Statement, string[]]>;
}

export class InlineImportVisitor extends Transform implements Partial<Visitor> {
  private readonly files: Record<
    string,
    InlineImportFile & { context: TransformContext }
  > = {};
  private readonly _paths: string[] = [];
  constructor(files: string[]) {
    super();
    this._paths = files;
    this.onPluginRequest = this.onInit;
  }

  async onInit(ctx: TransformContext): Promise<void> {
    for (const file of this._paths) {
      const context = await ctx.app.createTransformContext(file);
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
                  const names = Object.keys(path.scope.bindings).filter(
                    name => {
                      const binding = path.scope.bindings[name];
                      return (
                        binding.path.isDescendant(s) ||
                        binding.referencePaths.some(p => p.isDescendant(s))
                      );
                    }
                  );
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

  ImportDeclaration(
    path: b.NodePath<t.ImportDeclaration>,
    state: TransformState
  ) {
    const modulePath = state.state.absolutePath(path.node.source.value);
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
    path.scope.removeBinding("useNormalizedInputProps")
    path.replaceWithMultiple(bstm);
  }
}
