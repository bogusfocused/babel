import { createRequire } from "node:module";
import { Bundle } from "./Bundle";
import PropertyTypes, { ComponentType, PatchedProperty } from "./PropertyTypes";


export default function parse() {
  const require = createRequire(import.meta.url);
  const FeatureFlags = require("@carbon/feature-flags");
  FeatureFlags.enable("enable-v11-release");
  var requiredIfGivenPropIsTruthy = require("@carbon/react/lib/prop-types/requiredIfGivenPropIsTruthy");
  var deprecate = require("@carbon/react/lib/prop-types/deprecate");
  var isRequiredOneOf = require("@carbon/react/lib/prop-types/isRequiredOneOf");
  const PropTypes = require("prop-types");
  PropTypes.default = PropertyTypes.default;
  deprecate.default = PropertyTypes.default.deprecate;
  requiredIfGivenPropIsTruthy.default =
    PropertyTypes.default.requiredIfGivenPropIsTruthy;
  isRequiredOneOf.default = PropertyTypes.default.isRequiredOneOf;
  const creact: { [k: string]: any } = require("@carbon/react");
  const getProperties = function* (props: object) {
    for (const [pname, prop] of Object.entries(props))
      yield [pname, PatchedProperty.get(prop)];
  }
  const controls = function* (library: object) {
    for (const [cname, cvalue] of Object.entries(library)) {
      if ("propTypes" in cvalue)
        yield [cname, cvalue.displayName, getProperties(cvalue.propTypes)] as ComponentType
    }
  }
  const pkg = controls(creact);
  const pkginfo = require("@carbon/react/package.json");
  return new Bundle(pkginfo, pkg);
}
//await fs.writeFile("proptypes.json", JSON.stringify(result), "utf8");
// await fs.mkdir("generated", { recursive: true });
// function _q(value) {
//     return '"' + value + '"';
// }
// function translateType(desc) {
//     if (desc.oneOf) {
//         return desc.oneOf.map((x) => _q(x)).join(" | ");
//     }
//     if (desc.oneOfType) {
//         return desc.oneOfType.map((x) => translateType(x)).join(" | ");
//     }
//     if (desc.arrayOf) {
//         return translateType(desc.arrayOf) + "[]";
//     }
//     switch (desc.type) {
//         case "array":
//             return "any[]";
//         case "bool":
//             return "boolean";
//         case undefined:
//             return "any";
//         case "node":
//             return "string";
//         case "func":
//             return "Function";
//         default:
//             return desc.type;
//     }
// }
// function _script(value) {
//     return '<script lang="ts">' + "\n".concat(...value) + "\n</script>";
// }
// function _exports(ctrl) {
//     return Object.entries(ctrl)
//         .filter(
//             ([name, desc]) => !name.startsWith("on") && !["children"].includes(name)
//         )
//         .map(([name, desc]) => {
//             return (name === "as" ? "//" : "").concat(
//                 "export let ",
//                 name.replaceAll("-", "_"),
//                 ": ",
//                 translateType(desc),
//                 name === "id" ? '= "ccs-" + Math.random().toString(36)' : "",
//                 ";\n"
//             );
//         });
// }
// function _slots(ctrl) {
//     let slots = Object.entries(ctrl)
//         .filter(([name, desc]) => desc.type === "node")
//         .map(([name, desc]) =>
//             "".concat(name === "children" ? "default" : name, ": {}\n")
//         );
//     if (slots) return ["interface $$Slots {\n", ...slots, "}\n"];
//     else return [];
// }
// function _events(ctrl) {
//     let events = Object.entries(ctrl)
//         .filter(([name, desc]) => name.startsWith("on"))
//         .map(([name, desc]) => "".concat(name.substring(2), ": {}\n"));
//     if (events)
//         return [
//             'import { createEventDispatcher } from "svelte";\n',
//             "const dispatch = createEventDispatcher<{",
//             ...events,
//             "}>()\n",
//         ];
//     else return [];
// }
// for (let ctrl_name in result) {
//     let ctrl = result[ctrl_name];
//     const str = _script([..._slots(ctrl), ..._exports(ctrl), ..._events(ctrl)]);
//     await fs.writeFile(`generated/${ctrl_name}.g.svelte`, str, "utf8");
// }

console.timeStamp();
