import { Control } from "./Control";
import { ComponentType } from "./PropertyTypes";

export class Bundle {
  readonly info;
  private readonly _controls: Record<string, Control> = {};
  get controls(): Readonly<Record<string, Control>> {
    return this._controls;
  }
  constructor(pkginfo: any, data: Iterable<ComponentType>) {
    this.info=pkginfo;
    for (const [name, displayName, props] of data) {
      this._controls[name] = new Control(name, displayName, props);
    }
  }
}
