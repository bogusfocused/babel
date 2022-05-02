import FastGlob from "fast-glob";
import b from "@babel/core";
import t from "@babel/types";
import Path from "node:path";
import App from "./App";
import fs from "node:fs/promises";
import { parse } from "./propTypesParser";
import {
  RemoveModuleVisitor,
  InjectSlotsVisitor,
  ExpandJsxExpressionVisitor,
  MutationVisitor,
  InlineJsxVisitor,
  LabelModuleStmtVisitor,
  InlineImportVisitor,
  JSXAttributeTranslateVisitor,
  SimplyJsxExpressionTransform,
  UnspreadObjectExpression,
} from "./transforms";
import { RemoveUnusedCode } from "./transforms/RemoveUnusedCode";
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
        t.functionExpression(
          a.node.id,
          [a.node.params[0]],
          a.node.body,
          a.node.generator,
          a.node.async
        )
      );
    }
  }
}
const files2 = await FastGlob("components/*/*.js", {
  cwd: Path.join(process.cwd(), sourceRoot),
  ignore: ["**/*-story.js", "**/*test*.js"],
});
const app = new App({ sourceRoot, fs: fs });
app.use(new RemoveModuleVisitor("prop-types"));
app.use(new RemoveModuleVisitor("./prop-types/deprecate"));
app.use(
  new InlineImportVisitor([
    "components/TextInput/util.js",
    "internal/useNormalizedInputProps.js",
  ])
);
app.use(new RemoveUnusedCode());
app.use(new InjectSlotsVisitor(g));
app.use(new MutationVisitor("react", "forwardRef", forwardRef));
app.use(new InlineJsxVisitor());
app.use(new ExpandJsxExpressionVisitor());

app.use(
  new JSXAttributeTranslateVisitor({
    className: "class",
  })
);
app.use(new LabelModuleStmtVisitor());

// app.use(wrap("@babel/plugin-transform-arrow-functions"));
// app.use(wrap("@babel/plugin-transform-function-name"));
// app.use(wrap("@babel/plugin-transform-parameters"));
// app.use(wrap("@babel/plugin-transform-spread"));
// app.use(wrap("@babel/plugin-transform-destructuring"));
app.use(new SimplyJsxExpressionTransform());
app.use(new UnspreadObjectExpression());
app.use(new RemoveUnusedCode());

try {
  const code = await app.transform("components/TextInput/TextInput.js");
  if (code) {
    const ctx = await app.transform({
      file: "components/TextInput/TextInput.js",
      code,
    });
  }
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
