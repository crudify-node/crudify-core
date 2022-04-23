import * as data from "./schema.json";
import * as fse from "fs-extra";
import * as path from "path";
import { validateInput } from "./utils/validateInput";
import { Model, RelationalField, StaticField, type } from "./utils/ModelClass";

validateInput(data);
const dataModels = data.Models;
const models: Array<Model> = [];
for (const dataModel of dataModels) {
  const model: Model = new Model(dataModel.name);
  const staticFields: Array<StaticField> = [];
  for (const staticField of dataModel.attributes.StaticFields) {
    const newStaticField: StaticField = {
      name: staticField.name,
      type: staticField.type,
    };
    staticFields.push(newStaticField);
  }
  const relationalFields: Array<RelationalField> = [];
  for (const relationalField of dataModel.attributes.RelationalFields) {
    const newRelationalField: RelationalField = {
      connection: relationalField.connection,
      foreignKey: relationalField.foriegnKeyName,
      type: relationalField.type as unknown as type,
    };
    relationalFields.push(newRelationalField);
  }
  model.attributes = {
    relationalField: relationalFields,
    staticField: staticFields,
  };
}

// Create starter backend template
const sourceFolderName = path.join(__dirname, "../src/assets/starter");
const destFolderName = path.join(__dirname, "../app");

fse.copySync(sourceFolderName, destFolderName);
