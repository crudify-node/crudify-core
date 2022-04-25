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
  private staticFieldConversion(): string {
    let staticFieldConversionString = "";

    for (const staticField of this.attributes.staticField) {
      staticFieldConversionString += `${staticField.name} ${staticField.type} ${
        staticField.isUnique ? "@unique" : ""
      } \n`;
    }

    return staticFieldConversionString;
  }
  private relationalFieldConversion(models: Array<Model>): string {
    let relationalFieldConversionString = "";

    for (const relationalField of this.attributes.relationalField) {
      relationalFieldConversionString += `${relationalField.connection}Id Int `;
      relationalFieldConversionString += `\n ${relationalField.connection} ${relationalField.connection} @relation(fields: [${relationalField.connection}Id], references: [id])`;

      const connectedModel: Model | undefined = models.find(
        (model) => model.name === relationalField.connection
      );

      if (connectedModel) {
        if (connectedModel.magicString) {
          console.log({connectedModel})
          connectedModel.magicString.slice(0,-2);
          console.log({connectedModel})
          connectedModel.magicString += `${this.name} ${this.name} ${
            relationalField.type === ("ONETOONE" as unknown as type) ? "" : "[]"
          }`;
        }
      }
    }
    return relationalFieldConversionString;
  }
  restructure(models: Array<Model>) {
    const staticFieldConversionString: string = this.staticFieldConversion();
    const relationalFieldConversionString: string =
      this.relationalFieldConversion(models);

    this.magicString = `model ${this.name} {
      id Int @id @default(autoincrement())\n
      ${staticFieldConversionString}\n
      ${relationalFieldConversionString}\n
    }`;
  }
}
