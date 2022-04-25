import * as data from "./schema.json";
import * as fse from "fs-extra";
import * as path from "path";
import { validateInput } from "./utils/validateInput";
import { Model, RelationalField, StaticField, type } from "./utils/ModelClass";
import { getRelationalFields, getStaticFields } from "./utils/getFields";

validateInput(data);

const dataModels = data.Models;
const models: Array<Model> = [];

for (const dataModel of dataModels) {
  const model: Model = new Model(dataModel.name);

  const staticFields: Array<StaticField> = getStaticFields(dataModel);
  const relationalFields: Array<RelationalField> = getRelationalFields(dataModel);
  
  model.attributes = {
    relationalField: relationalFields,
    staticField: staticFields,
  };

  models.push(model);
}

for(const model of models){
  model.restructure(models);
}

let initStringSchema=`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

for(const model of models){
  initStringSchema+=model.magicString;
}



// Create starter backend template
const sourceFolderName = path.join(__dirname, "../src/assets/starter");
const destFolderName = path.join(__dirname, "../app");

fse.copySync(sourceFolderName, destFolderName);

const schemaPath=path.join(__dirname, "../app/prisma/schema.prisma")

fse.outputFileSync(schemaPath,initStringSchema);