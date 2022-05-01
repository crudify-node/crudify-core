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
  schemaArray: Array<string> = [];
  initString!: string;
  attributes!: {
    staticField: Array<StaticField>;
    relationalField: Array<RelationalField>;
  };
  constructor(name: string) {
    this.name = name as string;
  }
  private staticFieldConversion() {
    for (const staticField of this.attributes.staticField) {
      this.schemaArray.push(
        `${staticField.name} ${staticField.type} ${
          staticField.isUnique ? "@unique" : ""
        } \n`
      );
    }
  }
  private relationalFieldConversion(models: Array<Model>) {
    for (const relationalField of this.attributes.relationalField) {
      this.schemaArray.push(
        `${relationalField.connection.toLowerCase()}Id Int `
      );
      this.schemaArray.push(
        `\n ${relationalField.connection.toLowerCase()} ${
          relationalField.connection
        } @relation(fields: [${relationalField.connection.toLowerCase()}Id], references: [id])`
      );
      const connectedModel: Model | undefined = models.find(
        (model) => model.name === relationalField.connection
      );

      if (connectedModel) {
        connectedModel.schemaArray.push(
          `${this.name} ${this.name} ${
            relationalField.type === ("ONETOONE" as unknown as type)
              ? "?"
              : "[]"
          }`
        );
      }
    }
  }
  restructure(models: Array<Model>) {
    this.staticFieldConversion();

    this.relationalFieldConversion(models);
  }
  generateSchema() {
    this.initString = `model ${this.name} {
      id Int @id @default(autoincrement())\n
    `;
    console.log(this.schemaArray);
    for (const schemaString of this.schemaArray) {
      this.initString += schemaString;
    }
    this.initString += "\n}\n";
  }
}

// CONVERT STRING TO ARRAYS OF STRINGS AND FINALLY USE THIS ARRAY
