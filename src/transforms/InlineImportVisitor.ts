import { TransformContext } from "../App";
import b, { t } from "../App/babel";
import { Transform, TransformState, Visitor } from "./Transform";

export class InlineImportVisitor extends Transform implements Partial<Visitor> {
  private readonly files: Record<
    string,
    { context: TransformContext; sideEffects: boolean }
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
      const sideEffects = context.inspect(
        {
          Program(path, state) {
            state.sideEffects = path
              .get("body")
              .every((x) => x.isDeclaration());
          },
        },
        { sideEffects: false }
      ).sideEffects;
      this.files[file] = { context, sideEffects };
    }
  }

  ImportDeclaration(
    path: b.NodePath<t.ImportDeclaration>,
    state: TransformState
  ) {
    const modulePath = state.state.absolutePath(path.node.source.value);
    const filepath = this._paths.find((x) => x.startsWith(modulePath));
    if (!filepath) return;
    let file = this.files[filepath];
    let bstm = [] as t.Statement[];
    for (const stmt of file.context.ast.program.body) {
      if (t.isExportNamedDeclaration(stmt)) {
        bstm.push(stmt.declaration!);
      } else bstm.push(stmt);
    }
    path.replaceWithMultiple(bstm);
  }
}
