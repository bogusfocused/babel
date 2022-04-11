import t from "@babel/types";

export function createElement(
  tagName: string,
  attributes?: Record<
    string,
    | string
    | t.StringLiteral
    | t.JSXElement
    | t.JSXFragment
    | t.Expression
    | t.JSXExpressionContainer
    | null
    | undefined
  >,
  children?: (
    | string
    | t.Expression
    | t.JSXText
    | t.JSXExpressionContainer
    | t.JSXSpreadChild
    | t.JSXElement
    | t.JSXFragment
  )[]
) {
  const tag = t.jsxIdentifier(tagName);
  const nodes = children?.map((x) =>
    typeof x === "string"
      ? t.jsxText(x)
      : t.isExpression(x)
      ? t.jsxExpressionContainer(x)
      : x
  );
  const attrs = attributes
    ? Object.entries(attributes).map(([name, value]) =>
        t.jsxAttribute(
          t.jsxIdentifier(name),
          typeof value === "string"
            ? t.stringLiteral(value)
            : t.isExpression(value)
            ? t.jsxExpressionContainer(value)
            : value
        )
      )
    : [];

  return t.jsxElement(
    t.jsxOpeningElement(tag, attrs, !nodes),
    t.jsxClosingElement(tag),
    nodes ?? []
  );
}
