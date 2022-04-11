import { PluginPass } from "@babel/core";
import b, { t, tr } from "../App/babel";
import { TransformContext } from "../App";
export type TransformState = b.PluginPass & { state: TransformContext };
export type Visitor = Partial<
  {
    [K in t.Node["type"]]:
      | ((
          path: b.NodePath<Extract<t.Node, { type: K }>>,
          state: TransformState
        ) => void)
      | ((path: b.NodePath<Extract<t.Node, { type: K }>>) => void);
  } & { babelVisitor(): b.Visitor<TransformState> }
>;

export abstract class Transform {
  private _visitor?: b.Visitor<TransformState>;
  babelVisitor(): b.Visitor<TransformState> {
    let visitor = this._visitor;
    if (visitor) return visitor;
    let nodevisitor = {} as Record<
      string,
      tr.VisitNodeFunction<TransformState, t.Node>
    >;
    let klass = this as any;
    const self = this;
    while (true) {
      klass = Object.getPrototypeOf(klass);
      if (klass.constructor === Transform) break;
      Object.getOwnPropertyNames(klass).forEach((name) => {
        if (!/^[A-Z]/.test(name)) return;
        const value = klass[name] as <P extends t.Node>(
          path: b.NodePath<P>,
          state: TransformState
        ) => void;
        if (typeof value === "function") {
          nodevisitor[name] = function (
            path: b.NodePath,
            state: TransformState
          ) {
            value.call(self, path, state);
          };
        }
      });
    }
    visitor = nodevisitor;
    this._visitor = visitor;
    return visitor;
  }
  protected onPluginRequest?: (ctx: TransformContext) => Promise<void>;
  async babelPlugin(
    state: TransformContext
  ): Promise<b.PluginObj<TransformState>> {
    if (this.onPluginRequest) await this.onPluginRequest(state);
    const self = this;
    return {
      pre(file) {
        this.state = state;
      },
      visitor: self.babelVisitor(),
    };
  }
}
