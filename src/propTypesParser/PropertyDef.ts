import { PropertyType } from "./PropertyTypes";

export class PropertyDef {
  readonly name: string;
  private _prop: PropertyType;
  constructor(name: string, prop: PropertyType) {
    this.name = name;
    this._prop = prop;
  }

  toJSON() {
    return {
      kind: this._prop.kind,
      value: this._prop.value,
      ...this._prop.extra,
    };
  }
}
