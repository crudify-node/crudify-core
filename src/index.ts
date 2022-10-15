import * as fse from "fs-extra";
import * as path from "path";
import { validateInput } from "./utils/validateInput";
import { Model, RelationalField, StaticField } from "./utils/ModelClass";
import { Authentication } from "./utils/AuthClass";
import { getRelationalFields, getStaticFields } from "./utils/getFields";
import { formatSchema } from "@prisma/sdk";
import { Enum } from "./utils/EnumClass";

export default async function crudify(schemaFileName: string) {
  // Loading the user schema
  schemaFileName = path.join(process.cwd(), schemaFileName);
  const data = await import(schemaFileName);

  console.log("Parsing your ER diagram...");
  const { error } = validateInput(data);
  if (error) return error;
  // Proccessing database models
  const dataModels = data.Models;
  const dataEnums = data.Enums;

  const enums: Array<Enum> = [];
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

  for (const dataEnum of dataEnums) {
    const _enum: Enum = new Enum(dataEnum.name, dataEnum.fields);
    enums.push(_enum);
  }

  for (const model of models) {
    model.restructure(models);
    model.generateRoutes();
    model.generateUserInputValidator();
    model.generateRouter();
  }

  for (const _enum of enums) {
    _enum.generatePrismaModel();
  }

  let prismaSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

  for (const model of models) {
    model.generateSchema();
    prismaSchema += model.prismaModel;
  }
  for (const _enum of enums) {
    prismaSchema += _enum.prismaModel;
  }
  console.log("Brace yourself, brewing your backend...");

  // Duplicating the starter backend template
  const sourceFolderName = path.join(__dirname, "../src/assets/starter");
  const destFolderName = path.join(process.cwd(), "/app");

  fse.copySync(sourceFolderName, destFolderName);

  // Writing prisma schema in the output
  const schemaPath = path.join(process.cwd(), "/app/prisma/schema.prisma");
  formatSchema({
    schema: prismaSchema,
  }).then((formattedPrismaSchema: string) => {
    fse.outputFileSync(schemaPath, formattedPrismaSchema);
  });

  // Writing each model's CRUD api endpoints to the output
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

  // Creating the model router ./src/routes/index.ts
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

  // Creating the primary router ./src/app.ts
  const appRouterString = `import Express from "express";
  import cors from "cors";
  import config from "./config";
  import apiRouter from "./routes";
  ${data.Authentication ? 'import authRouter from "./routes/auth";' : ""}
  
  export const app = Express();
  
  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );
  
  app.use(Express.json());
  
  app.use("/api", apiRouter);
  ${data.Authentication ? 'app.use("/auth", authRouter);' : ""}
  
  app.get("/", (req, res) => {
    res.send(
      'hello there, see the documentation here: <a href="" target="__blank">Link</a>'
    );
  });
  export default app;
  `;

  const appRouterPath = path.join(process.cwd(), `/app/src/app.ts`);
  fse.outputFileSync(appRouterPath, appRouterString);

  // Authentication
  if (data.Authentication) {
    const { model, userFieldName, passwordFieldName } = data.Authentication;
    new Authentication(model, userFieldName, passwordFieldName);
  }
}
