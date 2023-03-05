import * as fse from "fs-extra";
import * as path from "path";
import { validateInput } from "./utils/validateInput";
import { Model, RelationalField, StaticField } from "./utils/ModelClass";
import { Authentication } from "./utils/AuthClass";
import { SeedDataGeneration } from "./utils/SeedClass";
import { getRelationalFields, getStaticFields } from "./utils/getFields";
import { formatSchema } from "@prisma/sdk";
import { Enum } from "./utils/EnumClass";
import chalk from "chalk";

export default async function crudify(data: any) {
  // Loading the user schema
  console.log("Parsing your ER diagram");

  const { error } = validateInput(data);
  if (error) return error;
  // Proccessing database models
  const dataModels = data.Models;
  const dataEnums = data.Enums;

  const enums: Array<Enum> = [];

  for (const dataEnum of dataEnums) {
    const _enum: Enum = new Enum(dataEnum.name, dataEnum.fields);
    enums.push(_enum);
  }
  for (const _enum of enums) {
    _enum.generatePrismaModel();
  }

  const models: Array<Model> = [];
  const softDeletionExcludedModels: Array<string> = [];

  for (const dataModel of dataModels) {
    const model: Model = new Model(dataModel.name, dataModel.softDelete);
    if (!model.softDelete) softDeletionExcludedModels.push(model.name);
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
    model.generateDocString();
  }

  let prismaSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
`;

  let swaggerDocPaths = "",
    swaggerDocDefinitions = "";
  for (const _enum of enums) {
    prismaSchema += _enum.prismaModel;
  }
  for (const model of models) {
    model.generateSchema();
    prismaSchema += model.prismaModel;
    swaggerDocPaths += model.apiDocPathString;
    swaggerDocDefinitions += model.apiDocDefinitionString;
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

  const routerIndexPath = path.join(process.cwd(), `/app/src/routes/index.ts`);
  fse.outputFileSync(routerIndexPath, routerIndexString);

  // Creating the primary router ./src/app.ts
  const appRouterString = `import Express from "express";
  import cors from "cors";
  import config from "./config";
  import apiRouter from "./routes";
  import * as path from "path";
  import swaggerUi from "swagger-ui-express";
  import fs from 'fs'
  ${data.Authentication ? 'import authRouter from "./routes/auth";' : ""}
  
  export const app = Express();
  const swaggerDocument = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'swagger.json'), 'utf-8'))
  swaggerDocument.host=process.env.HOST
  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );
  
  app.use(Express.json());
  
  app.use("/api", apiRouter);
  ${data.Authentication ? 'app.use("/auth", authRouter);' : ""}
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  
  app.get("/", (req, res) => {
    res.send(
      'hello there, see the documentation here: <a href="" target="__blank">Link</a>'
    );
  });
  export default app;
  `;

  const appRouterPath = path.join(process.cwd(), `/app/src/app.ts`);
  fse.outputFileSync(appRouterPath, appRouterString);

  const swaggerDocString = `{
    "swagger": "2.0",
    "info": {
        "description": "Change this description yourself in swagger.json",
        "version": "1.0.0",
        "title": "Example Title",
        "contact": {
            "email": "crudify@gmail.com"
        },
        "license": {
            "name": "Apache 2.0",
            "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
        }
    },
    "schemes": ["http"],
    "host": "localhost:5000",
    "basePath": "/api",
    "paths" : {
      ${swaggerDocPaths}
    }, 
    "definitions": {
        ${swaggerDocDefinitions}
        "DeleteResponse":{
            "type": "object",
            "properties": {
                "data": {
                    "type": "string"
                }
            }
        },
        "InvalidResponse": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "string"
                }
            }

        }
    }
}`;

  console.log(chalk.white("Preparing APIs and getting the API docs ready"));
  const swaggerJsonPath = path.join(process.cwd(), `/app/swagger.json`);
  fse.outputFileSync(swaggerJsonPath, swaggerDocString);

  // Authentication
  if (data.Authentication) {
    const { model, userFieldName, passwordFieldName } = data.Authentication;
    new Authentication(model, userFieldName, passwordFieldName);
  }

  const constantsFileContent = `export const softDeletionExcludedModels: Array<string> = [${softDeletionExcludedModels.map(
    (model) => {
      return `"${model}"`;
    }
  )}]; `;
  const constantsPath = path.join(process.cwd(), `/app/src/lib/constants.ts`);
  fse.outputFileSync(constantsPath, constantsFileContent);

  // Seed File Generation
  console.log(chalk.white("Laying the groundwork for seeding your database"));
  new SeedDataGeneration(models, enums);
}
