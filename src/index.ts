import * as fse from "fs-extra";
import * as path from "path";
import { validateInput } from "./utils/validateInput";
import { Model, RelationalField, StaticField } from "./utils/ModelClass";
import { getRelationalFields, getStaticFields } from "./utils/getFields";
import { formatSchema } from "@prisma/sdk";

export default async function crudify(schemaFileName: string) {
  schemaFileName = path.join(process.cwd(), schemaFileName);
  const data = await import(schemaFileName);

  console.log("Parsing your ER diagram...");
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
    model.generateUserInputValidator();
    model.generateRouter();
  }

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
    initStringSchema += model.prismaModel;
  }
  console.log("Brace yourself, brewing your backend...");
  // Create starter backend template
  const sourceFolderName = path.join(__dirname, "../src/assets/starter");
  const destFolderName = path.join(process.cwd(), "/app");

  fse.copySync(sourceFolderName, destFolderName);

  const schemaPath = path.join(process.cwd(), "/app/prisma/schema.prisma");

  formatSchema({
    schema: initStringSchema,
  }).then((formattedInitStringSchema: string) => {
    fse.outputFileSync(schemaPath, formattedInitStringSchema);
  });

  for (const model of models) {
    const schemaPath = path.join(
      process.cwd(),
      `/app/src/routes/${model.name}/`
    );
    const indexPath = schemaPath + "index.ts";
    const controllerPath = schemaPath + "controller.ts";
    const inputValidatorPath = schemaPath + "schema.ts";
    fse.outputFileSync(controllerPath, model.controllerString);
    fse.outputFileSync(indexPath, model.routerString);
    fse.outputFileSync(inputValidatorPath, model.validationString);
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
  console.log("Your app can be found at app/ folder");
  const routerIndexPath = path.join(process.cwd(), `/app/src/routes/index.ts`);
  fse.outputFileSync(routerIndexPath, routerIndexString);
}
