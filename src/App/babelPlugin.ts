import b from "@babel/core";
import t from "@babel/types";
import * as tr from "@babel/traverse";
import { TransformContext } from "./TransformContext";
export type Tracker = {
  [key in t.Node["type"] as `isIn${key}`]: () => boolean | undefined;
};
export interface TransformState extends b.PluginPass {
  state: TransformContext;
  tracker: Tracker;
}
export type VisitNodeObject = {
  enter: (path: b.NodePath, state: TransformState) => void;
  exit: (path: b.NodePath, state: TransformState) => void;
};

type NodeFunction<Key = t.Node["type"]> = {
  (
    path: b.NodePath<Extract<t.Node, { type: Key }>>,
    state: b.PluginPass & {
      state: TransformContext;
    }
  ): void;
};
type VisitNodeFunction<Key = t.Node["type"]> =
  | {
      enter: NodeFunction<Key>;
      exit: NodeFunction<Key>;
    }
  | NodeFunction<Key>;
export type Visitor = {
  [Key in t.Node["type"]]: VisitNodeFunction<Key>;
};
function generateBabelVisitor(
  transform: any
): b.Visitor<TransformState & { tracker: any }> {
  let nodevisitor = {} as Record<
    string,
    tr.VisitNodeObject<TransformState, t.Node>
  >;
  let klass = transform as any;
  const self = transform;
  Object.getOwnPropertyNames(klass).forEach(name => {
    if (!/^[A-Z]/.test(name)) return;
    const value = klass[name] as {
      enter: (path: b.NodePath, state: TransformState) => void;
      exit: (path: b.NodePath, state: TransformState) => void;
    };
    nodevisitor[name] = {
      enter(path: b.NodePath, state: TransformState) {
        value.enter?.call(self, path, state);
      },
      exit(path: b.NodePath, state: TransformState) {
        value.exit ? value.exit.call(self, path, state) : undefined;
      },
    };
  });
  while (true) {
    klass = Object.getPrototypeOf(klass);
    if (klass.constructor === Object) break;
    Object.getOwnPropertyNames(klass).forEach(name => {
      if (!/^[A-Z]/.test(name)) return;
      if (typeof klass[name] === "function") {
        const value = klass[name] as <P extends t.Node>(
          path: b.NodePath<P>,
          state: TransformState
        ) => void;
        nodevisitor[name] = {
          enter(path: b.NodePath, state: TransformState) {
            value.call(self, path, state);
          },
        };
      }
    });
  }
  if (nodevisitor.Program === undefined) {
    nodevisitor.Program = {
      exit(path: b.NodePath, state: TransformState) {
        path.scope.crawl();
      },
    };
  }
  return nodevisitor;
}

export class Transform {
  onPluginRequest?: (state: TransformContext) => Promise<void>;
}
class _Tracker {
  trackers: { [key in t.Node["type"]]?: number } = {};
  track(nodeType: t.Node["type"]): void {
    this.trackers[nodeType] = 0;
  }
}
interface _Tracker extends Tracker {}
let buildTrackerClass: (() => void) | undefined = function () {
  for (const type of t.TYPES as t.Node["type"][]) {
    _Tracker.prototype[`isIn${type}`] = function () {
      return this.trackers[type] === undefined
        ? undefined
        : this.trackers[type] !== 0;
    };
  }
  buildTrackerClass = undefined;
  return;
};

export async function createBabelPlugin(
  transform: Transform,
  state: TransformContext
): Promise<b.PluginObj<TransformState>> {
  buildTrackerClass?.();
  if (transform.onPluginRequest) await transform.onPluginRequest(state);

  return {
    pre(file) {
      this.state = state;
      this.tracker = new _Tracker();
    },
    visitor: generateBabelVisitor(transform),
  };
}
