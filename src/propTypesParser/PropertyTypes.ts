interface PatchedType {
  kind:
    | "primitive"
    | "oneOf"
    | "custom"
    | "objectOf"
    | "oneOfType"
    | "arrayOf"
    | "ignored"
    | "instanceOf"
    | "control";
  value: any;
  extra: any;
}
interface PrimitiveType extends PatchedType {
  kind: "primitive";
  value:
    | "any"
    | "array"
    | "bool"
    | "func"
    | "number"
    | "bigint"
    | "object"
    | "string"
    | "node"
    | "element"
    | "symbol"
    | "elementType";
}
interface EnumType extends PatchedType {
  kind: "oneOf";
  value: string[];
}
interface CustomType extends PatchedType {
  kind: "custom";
  value: string;
}
interface ControlType extends PatchedType {
  kind: "control";
  value: string;
}

interface ObjectOfType extends PatchedType {
  kind: "objectOf";
  value: CustomType;
}
interface OneOfType extends PatchedType {
  kind: "oneOfType";
  value: (PrimitiveType | EnumType | CustomType)[];
}
interface ArrayOfType extends PatchedType {
  kind: "arrayOf";
  value: PrimitiveType | EnumType | CustomType;
}
interface IgnoredType extends PatchedType {
  kind: "ignored" | "instanceOf";
  value: any;
}

export type PropertyType =
  | PrimitiveType
  | OneOfType
  | ArrayOfType
  | CustomType
  | ControlType
  | ObjectOfType
  | IgnoredType
  | EnumType;
export class PatchedProperty implements PatchedType {
  kind: PropertyType["kind"];
  value: any;
  extra: any;
  constructor(kind: PatchedType["kind"], value: any, extra?: any) {
    this.kind = kind;
    this.value = value;
    this.extra = extra;
  }
  extend(extra: any) {
    this.extra = { ...this.extra, ...extra };
    return this;
  }
  clone(extra: any) {
    return new PatchedProperty(this.kind, this.value, this.extra).extend(extra);
  }
  static get(x: any): PatchedProperty {
    if (x === undefined || x === null) return primitive.any();
    if (x.constructor?.name === "PatchedProperty") return x;
    if (typeof x === "object" && "render" in x && "displayName" in x)
      return new PatchedProperty("control", x.displayName);
    try {
      return x();
    } catch (err) {
      return new PatchedProperty("custom", x.name);
    }
  }
}

const primitive: Record<string, () => PatchedProperty> = {
  any: () => new PatchedProperty("primitive", "any"),
  array: () => new PatchedProperty("primitive", "array"),
  bool: () => new PatchedProperty("primitive", "bool"),
  func: () => new PatchedProperty("primitive", "func"),
  number: () => new PatchedProperty("primitive", "number"),
  bigint: () => new PatchedProperty("primitive", "bigint"),
  object: () => new PatchedProperty("primitive", "object"),
  string: () => new PatchedProperty("primitive", "string"),
  node: () => new PatchedProperty("primitive", "node"),
  element: () => new PatchedProperty("primitive", "element"),
  symbol: () => new PatchedProperty("primitive", "symbol"),
  ignored: (...args: any[]) => new PatchedProperty("ignored", args),
};
const others: Record<
  string,
  (...args: any[]) => PatchedProperty | Record<string, PatchedProperty>
> = {
  any: Object.assign(primitive.any, {
    isRequired: () => primitive.any().extend({ required: true }),
  }),
  array: Object.assign(primitive.array, {
    isRequired: () => primitive.array().extend({ required: true }),
  }),
  bool: Object.assign(primitive.bool, {
    isRequired: () => primitive.bool().extend({ required: true }),
  }),
  func: Object.assign(primitive.func, {
    isRequired: () => primitive.bool().extend({ required: true }),
  }),
  number: Object.assign(primitive.number, {
    isRequired: () => primitive.number().extend({ required: true }),
  }),
  bigint: Object.assign(primitive.bigint, {
    isRequired: () => primitive.bigint().extend({ required: true }),
  }),
  object: Object.assign(primitive.object, {
    isRequired: () => primitive.object().extend({ required: true }),
  }),
  string: Object.assign(primitive.string, {
    isRequired: () => primitive.string().extend({ required: true }),
  }),
  node: Object.assign(primitive.node, {
    isRequired: () => primitive.node().extend({ required: true }),
  }),
  element: Object.assign(primitive.element, {
    isRequired: () => primitive.element().extend({ required: true }),
  }),
  symbol: Object.assign(primitive.symbol, {
    isRequired: () => primitive.symbol().extend({ required: true }),
  }),
  instanceOf: function instanceOf(_expectedClass: any) {
    return new PatchedProperty("instanceOf", _expectedClass);
  },
  oneOf: function oneOf(types: string[]) {
    return new PatchedProperty("oneOf", types);
  },
  oneOfType: function oneOfType(types: any[]) {
    return new PatchedProperty(
      "oneOfType",
      types.map((x) => PatchedProperty.get(x))
    );
  },
  arrayOf: function arrayOf(type: any) {
    return new PatchedProperty("arrayOf", PatchedProperty.get(type));
  },
  objectOf: function objectOf(type: any) {
    return PatchedProperty.get(type);
  },
  exact: primitive.ignored,
  shape: primitive.ignored,
  deprecate: function deprecate(type: any, message: string) {
    return PatchedProperty.get(type).extend({ deprecate: message });
  },
  requiredIfGivenPropIsTruthy: function cprop(name: string, type: any) {
    return PatchedProperty.get(type).extend({
      requiredIfGivenPropIsTruthy: name,
    });
  },

  isRequiredOneOf: function (types: { [k: string]: any }) {
    return Object.entries(types).reduce((result, [name, type]) => {
      result[name] = PatchedProperty.get(type).extend({
        isRequiredOneOf: Object.keys(types),
      });
      return result;
    }, {} as { [k: string]: PatchedProperty });
  },
};
export type ComponentType = [string, string, Iterable<[string, PropertyType]>]

export default { default: others };
