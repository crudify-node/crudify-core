import * as fse from "fs-extra";
import * as path from "path";
import { validateInput } from "./utils/validateInput";
import { Model, RelationalField, StaticField, type } from "./utils/ModelClass";
import { getRelationalFields, getStaticFields } from "./utils/getFields";
import { formatSchema } from "@prisma/sdk";
import { indexString } from "./assets/staticStrings/index";
export default async function crudify(
  schemaInpPath: string
) {
  const data = await import(schemaInpPath);

  validateInput(data);

  const dataModels = data.Models;
  const models: Array<Model> = [];

  for (const dataModel of dataModels) {
    const model: Model = new Model(dataModel.name);

    const staticFields: Array<StaticField> = getStaticFields(dataModel);
    const relationalFields: Array<RelationalField> =
      getRelationalFields(dataModel);

    model.attributes = {
      relationalField: relationalFields,
      staticField: staticFields,
    };

    models.push(model);
  }

  for (const model of models) {
    model.restructure(models);
    model.generateRoutes();
  }

  // console.log(JSON.stringify(models));

  let initStringSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

  for (const model of models) {
    model.generateSchema();
    initStringSchema += model.initString;
  }

  // Create starter backend template
  const sourceFolderName = path.join(__dirname, "../src/assets/starter");
  const destFolderName = path.join(__dirname, "./app");

  fse.copySync(sourceFolderName, destFolderName);

  const schemaPath = path.join(__dirname, "./app/prisma/schema.prisma");

  formatSchema({
    schema: initStringSchema,
  }).then((formattedInitStringSchema: string) => {
    fse.outputFileSync(schemaPath, formattedInitStringSchema);
  });

  for (const model of models) {
    const schemaPath = path.join(__dirname, `./app/src/routes/${model.name}/`);
    const indexPath = schemaPath + "index.ts";
    const controllerPath = schemaPath + "controller.ts";
    fse.outputFileSync(controllerPath, model.controllerString);
    fse.outputFileSync(indexPath, indexString);
  }

  const routerIndexString = `
import { Request, Response, Router } from 'express'
${models
  .map((model) => {
    return `import ${model.name}Router from './${model.name}'\n`;
  })
  .join("")}

const router = Router()

${models
  .map((model) => {
    return `router.use('/${model.name}', ${model.name}Router)\n`;
  })
  .join("")}

router.get('/', (req: Request, res: Response) => {
  res.send('hello world')
})

export default router
`;

  const routerIndexPath = path.join(__dirname, `./app/src/routes/index.ts`);
  fse.outputFileSync(routerIndexPath, routerIndexString);
}
