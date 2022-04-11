import { EventDef } from "./EventDef";
import { PropertyDef } from "./PropertyDef";
import { PropertyType } from "./PropertyTypes";

export class Control {
  readonly name: string;
  readonly displayName?: string;
  readonly _properties: Record<string, PropertyDef> = {};
  readonly _events: Record<string, EventDef> = {};
  readonly slots: string[] = [];
  get properties(): Readonly<Record<string, PropertyDef>> {
    return this._properties;
  }
  get id() {
    return this._properties["id"];
  }
  constructor(
    name: string,
    displayName: string,
    props: Iterable<[string, PropertyType]>
  ) {
    this.name = name;
    this.displayName = displayName;
    for (const [pname, type] of props) {
      this.process(pname, type);
    }
  }
  private process(name: string, type: PropertyType) {
    if (name === "children") {
      this.slots.push("default");
      return;
    }
    if (type.kind === "primitive") {
      if (type.value === "func" && name.startsWith("on")) {
        this._events[name] = new EventDef(name);
        return;
      }
      if (type.value === "element") {
        this.slots.push(name);
        return;
      }
      if (type.value === "node") {
        this.slots.push(name);
      }
    }

    this._properties[name] = new PropertyDef(name, type);
  }
  toJSON() {
    return {
      properties: this._properties,
      events: this._events,
      slots: this.slots,
      displayName: this.displayName,
    };
  }
}
