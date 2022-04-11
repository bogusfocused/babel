export class EventDef {
  readonly name: string;
  constructor(name: string) {
    this.name = name.substring(2, 3).toLowerCase() + name.substring(3);
  }
}
