import * as data from "./schema.json";
import * as fs from "fs";
import * as path from "path";
import { validateInput } from "./utils/validateInput"
import { Model, RelationalField, StaticField, type } from "./utils/ModelClass";

validateInput(data);
const dataModels = data.Models
const models: Array<Model> = [];
for (const dataModel of dataModels) {
  const model: Model = new Model(dataModel.name);
  const staticFields: Array<StaticField> = [];
  for (const staticField of dataModel.attributes.StaticFields) {
    const newStaticField: StaticField = {
      name: staticField.name,
      type: staticField.type
    }
    staticFields.push(newStaticField);
  }
  const relationalFields: Array<RelationalField> = [];
  for (const relationalField of dataModel.attributes.RelationalFields) {
    const newRelationalField: RelationalField = {
      connection: relationalField.connection,
      foreignKey: relationalField.foriegnKeyName,
      type: relationalField.type as unknown as type
    }
    relationalFields.push(newRelationalField);
  }
  model.attributes = { relationalField: relationalFields, staticField: staticFields }
}



const appFolderName = path.join(__dirname, "../app");
console.log(appFolderName);

// Check if the folder exists else create it
try {
  if (!fs.existsSync(appFolderName)) {
    fs.mkdirSync(appFolderName);
  }
} catch (err) {
  console.log(err);
}

// Check if demo file exists else create a demo file
const content = `datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

generator client {
    provider = "prisma-client-js"
}`;

fs.writeFile(path.join(appFolderName, "/schema.prisma"), content, (err) => {
  if (err) {
    console.log(err);
    return;
  }
});
