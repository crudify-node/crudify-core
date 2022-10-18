export interface field {
  name: string;
}
export class Enum {
  name: string;
  fields: Array<string>;
  constructor(name: string, fields: Array<string>) {
    this.name = name;
    this.fields = fields;
  }
  prismaModel = "";
  generatePrismaModel() {
    this.prismaModel = `enum ${this.name} {
        ${this.fields.map((field) => {
          return `${field}\n`;
        }).join("")}
      }`;
  }
}
