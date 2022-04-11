import babel from '@babel/core';
import * as fs from "node:fs/promises"
import * as t from "@babel/types"

import { Parser } from "acorn"
import acorn_jsx from "acorn-jsx"
const JSXParser = Parser.extend(acorn_jsx());
const code = await fs.readFile("data/testdata.jsx", "utf8")
const parser = new JSXParser({ ecmaVersion: "latest", sourceType: "module" }, code)
const ast = parser.parse() as unknown;
export { code, ast };