import b, { t } from "../App/babel";

const hasJSXVisitor: b.Visitor<{ hasJSX: boolean }> = {
  JSXElement(path, state) {
    state.hasJSX = true;
    path.stop();
  },
};
export default function hasJSX<T = t.Node>(path: b.NodePath<T>): boolean {
  if (path.isJSXElement()) return true;
  let state = { hasJSX: false };
  path.traverse(hasJSXVisitor, state);
  return state.hasJSX;
}
export { hasJSX, hasJSXVisitor };
