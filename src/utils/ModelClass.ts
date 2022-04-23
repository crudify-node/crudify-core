export enum type {
  ONETOONE,
  ONETOMANY,
}
export interface StaticField {
  name: string;
  type: string;
  isUnique?: boolean;
}
export interface RelationalField {
  connection: string;
  foreignKey: string;
  type: type;
}
export class Model {
  name!: string;
  magicString!: string;
  attributes!: {
    staticField: Array<StaticField>;
    relationalField: Array<RelationalField>;
  };
  constructor(name: string) {
    this.name = name as string;
    // this.restructure();
  }
  restructure() {
    let staticFieldConversionString = "";
    for (const staticField of this.attributes.staticField) {
      staticFieldConversionString += `${staticField.name} ${staticField.type} ${
        staticField.isUnique ? "@unique" : ""
      } \n`;
    }
    let relationalFieldConversionString ="";
    for(const relationalField of this.attributes.relationalField){
      relationalFieldConversionString+=`{relationalField.connection} {relationalField.connection}`;
    }
    this.magicString = `Model ${this.name} {
      ${staticFieldConversionString}\n
      ${relationalFieldConversionString}
    } `;

  }
}
