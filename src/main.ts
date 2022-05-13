import FastGlob from "fast-glob";
import b from "@babel/core";
import t from "@babel/types";
import Path from "node:path";
import App, { Transform } from "./App";
import fs from "node:fs/promises";
import { parse } from "./propTypesParser";
import { RemoveUnusedCode } from "./transforms/RemoveUnusedCode";
import {
  ExpandJsxExpressionVisitor,
  InjectSlotsVisitor,
  InlineImportVisitor,
  InlineJsxVisitor,
  JSXAttributeTranslateVisitor,
  LabelModuleStmtVisitor,
  MutationVisitor,
  RemoveModuleVisitor,
  SimplyJsxExpressionTransform,
  UnspreadObjectExpression,
} from "./transforms";
const g = parse();
const VERSION = "11.0.3";
const sourceRoot = "data/carbon-" + VERSION + "/packages/react/src";

async function dump(root: string, file: string, code: string) {
  const generatedFilePath = Path.posix.join(root, file);
  await fs.mkdir(Path.dirname(generatedFilePath), {
    recursive: true,
  });
  await fs.writeFile(generatedFilePath, code, "utf8");
}

function forwardRef(path: b.NodePath) {
  const called = path.findParent(t.isCallExpression);
  if (called?.isCallExpression()) {
    const a = called.get("arguments")[0];
    if (a.isFunctionExpression()) {
      called.replaceWith(
        t.functionExpression(a.node.id, [a.node.params[0]], a.node.body, a.node.generator, a.node.async)
      );
    }
  }
}
const files2 = await FastGlob("components/*/*.js", {
  cwd: Path.join(process.cwd(), sourceRoot),
  ignore: ["**/*-story.js", "**/*test*.js"],
});
const app = new App({ sourceRoot, fs: fs });
app.useTransform(RemoveModuleVisitor, "prop-types");
app.useTransform(RemoveModuleVisitor, "./prop-types/deprecate");
app.useTransform(InlineImportVisitor, ["components/TextInput/util.js", "internal/useNormalizedInputProps.js"]);
app.useTransform(RemoveUnusedCode);
app.useTransform(InjectSlotsVisitor, g);
app.useTransform(MutationVisitor, "react", "forwardRef", forwardRef);
app.useTransform(InlineJsxVisitor);
app.useTransform(ExpandJsxExpressionVisitor);

app.useTransform(JSXAttributeTranslateVisitor, {
  className: "class",
});
app.useTransform(LabelModuleStmtVisitor);

// app.use(wrap("@babel/plugin-transform-arrow-functions"));
// app.use(wrap("@babel/plugin-transform-function-name"));
// app.use(wrap("@babel/plugin-transform-parameters"));
// app.use(wrap("@babel/plugin-transform-spread"));
// app.use(wrap("@babel/plugin-transform-destructuring"));
app.useTransform(SimplyJsxExpressionTransform);
app.useTransform(UnspreadObjectExpression);
app.useTransform(RemoveUnusedCode);

try {
  const code = await app.transform("components/TextInput/TextInput.js");
  await dump("data/generated", "components/TextInput/TextInput.js", code!);
} catch (err) {
  console.log(err);
}

// for (const filepath of files) {
//   try {
//     const code = await app.transform(filepath);
//     await dump("data/generated", filepath, code!);
//   } catch (err) {
//     console.log(err);
//   }
// }
