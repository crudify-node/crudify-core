import { convertToUpperCamelCase } from "./common";
import { joiMapping } from "./schema";

export enum type {
  ONETOONE,
  ONETOMANY,
}

export interface StaticField {
  name: string;
  type: string;
  isUnique?: boolean;
  toBeHashed?: boolean;
  defaultValue?: string;
  faker?: {
    module: string;
    method: string;
  };
}

export interface RelationalField {
  connection: string;
  foreignKey: string;
  type: type;
}

export interface Attributes {
  staticField: Array<StaticField>;
  relationalField: Array<RelationalField>;
}
export interface MapPrismaToSwagger{
  [key:string]:string
}
export class Model {
  name: string;
  attributes: Attributes = { staticField: [], relationalField: [] };
  prismaModelArray: Array<string> = [];
  prismaModel = "";
  routerString = "";
  controllerString = "";
  validationString = "";
  apiDocPathString = "";
  apiDocDefinitionString = "";
  private mapPrismaToSwagger:MapPrismaToSwagger = { String: "string", Int: "integer" };

  constructor(name: string) {
    this.name = name;
  }

  staticFieldNames() {
    const staticFieldNamesArray: Array<string> = [];
    for (const staticField of this.attributes.staticField) {
      staticFieldNamesArray.push(staticField.name);
    }
    return staticFieldNamesArray;
  }

  relationalFieldNames() {
    const relationalFieldNamesArray: Array<string> = [];
    for (const relationalField of this.attributes.relationalField) {
      relationalFieldNamesArray.push(relationalField.connection);
    }
    return relationalFieldNamesArray;
  }

  private staticFieldConversion() {
    for (const staticField of this.attributes.staticField) {
      const defaultValue = `@default(${staticField.defaultValue})`;
      if (defaultValue && staticField.isUnique) {
        console.log(
          "WARNING: You have given a default value to a unique field. It may give you error in future!"
        );
      }
      this.prismaModelArray.push(
        `${staticField.name} ${staticField.type} ${
          staticField.isUnique ? "@unique" : ""
        } ${staticField.defaultValue ? defaultValue : ""} \n`
      );
    }
    this.prismaModelArray.push("deleted Boolean @default(false)\n");
  }

  private relationalFieldConversion(models: Array<Model>) {
    for (const relationalField of this.attributes.relationalField) {
      this.prismaModelArray.push(
        `${relationalField.connection.toLowerCase()}Id Int `
      );
      this.prismaModelArray.push(
        `\n ${relationalField.connection.toLowerCase()} ${
          relationalField.connection
        } @relation(fields: [${relationalField.connection.toLowerCase()}Id], references: [id], onDelete: Cascade)\n`
      );
      const connectedModel: Model | undefined = models.find(
        (model) => model.name === relationalField.connection
      );

      if (connectedModel) {
        connectedModel.prismaModelArray.push(
          `${this.name} ${this.name} ${
            relationalField.type === ("ONETOONE" as unknown as type)
              ? "?\n"
              : "[]\n"
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
    this.prismaModel = `model ${this.name} {
      id Int @id @default(autoincrement())\n
    `;
    for (const schemaString of this.prismaModelArray) {
      this.prismaModel += schemaString;
    }
    this.prismaModel += "createdAt DateTime @default(now())\n";
    this.prismaModel += "updatedAt DateTime @default(now())";
    this.prismaModel += "\n}\n";
  }

  generateRouter() {
    const modelName = convertToUpperCamelCase(this.name);
    this.routerString = `
      import { Router } from "express";
      import { ce } from "~/lib/captureError";
      import {
        handleCreate${modelName},
        handleDelete${modelName},
        handleGetAll${modelName}s,
        handleGet${modelName}ById,
        handleUpdate${modelName}ById,
      } from "./controller";

      export const router = Router();

      //CRUD routes
      router.get("/", ce(handleGetAll${modelName}s));
      router.get("/:id", ce(handleGet${modelName}ById));
      router.post("/", ce(handleCreate${modelName}));
      router.patch("/:id", ce(handleUpdate${modelName}ById));
      router.delete("/:id", ce(handleDelete${modelName}));

      export default router;
    `;
  }

  generateRoutes() {
    const modelName = convertToUpperCamelCase(this.name);

    this.controllerString = `
    import { Prisma } from ".prisma/client";
    import { Request, Response } from "express";
    import prisma from "~/lib/prisma";
    import { schema } from "./schema";
    import * as bcrypt from "bcrypt";
    
    export const handleCreate${modelName} = async (req: Request, res: Response) => {
      const { error } = schema.validate(req.body);
      if (!error) {

        const { ${[
          ...this.staticFieldNames(),
          ...this.relationalFieldNames(),
        ].join(",")} } = req.body;

        ${this.relationalFieldNames()
          .map((relationalField) => {
            return `const ${relationalField}ToBeConnected = await prisma.${relationalField}.findUnique({
            where: { id: ${relationalField} },
          });
      
          if (!${relationalField}ToBeConnected)
            return res.status(400).json({ data: "${convertToUpperCamelCase(
              relationalField
            )} not found" });
      `;
          })
          .join("")}
        
        const new${modelName}Object = {
          ${this.attributes.staticField
            .map((field) => {
              if (field.toBeHashed === true)
                return `${field.name}: await bcrypt.hash(${field.name}, 10)`;

              return field.name;
            })
            .join(",")},
          ${this.relationalFieldNames()
            .map((relationalField) => {
              return `${relationalField}: { connect: { id: ${relationalField} } },`;
            })
            .join("")}
         
        };
        const ${this.name} = await prisma.${this.name}.create({
          data: new${modelName}Object,
        });
        return res.json({ data: ${this.name} });
      }
      return res.status(500).json({ data: error.details[0].message });
    };
    
    export const handleDelete${modelName} = async (
      req: Request<{ id: string }>,
      res: Response
    ) => {
      const ${this.name}Id = Number(req.params.id);
      if (!${this.name}Id) return res.status(400).json({ data: "Invalid ID" });
    
      const ${this.name} = await prisma.${this.name}.findUnique({
        where: { id: ${this.name}Id },
      });
    
      if (!${
        this.name
      }) return res.status(404).json({ data: "${modelName} Not Found" });
    
      await prisma.${this.name}.delete({
        where: {
          id: ${this.name}Id,
        },
      });
    
      return res.status(200).json({ data: "Successfully Deleted!" });
    };
    
    export const handleGetAll${convertToUpperCamelCase(
      modelName
    )}s = async (req: Request, res: Response) => {
      const skip = Number(req.query.skip) || 0;
      const take = Number(req.query.take) || 10;
    
      const ${this.name}s = await prisma.${this.name}.findMany({
        skip: skip,
        take: take,
      });
    
      return res.json({ data: ${this.name}s });
    };
    
    export const handleGet${modelName}ById = async (
      req: Request<{ id: string }>,
      res: Response
    ) => {
      const ${this.name}Id = Number(req.params.id);
      if (isNaN(${this.name}Id))
        return res.status(400).json({ data: "Invalid Id" });

      const ${this.name} = await prisma.${this.name}.findUnique({
        where: { id: ${this.name}Id },
      });
      if (!${this.name})
        return res.status(404).json({ data: "${modelName} not found" });
      return res.json({ data: ${this.name} });
    };
    
    export const handleUpdate${modelName}ById = async (
      req: Request<{ id: string }>,
      res: Response
    ) => {
      const ${this.name}Id = Number(req.params.id);
      const allowedUpdateFields: Array<keyof Prisma.${this.name}UpdateInput> = [
        "${[...this.staticFieldNames(), ...this.relationalFieldNames()].join(
          `","`
        )}"
      ];
    
      const updates = Object.keys(req.body);
    
      const updateObject: Prisma.${this.name}UpdateInput = {};
    
      for (const update of updates) {
        if (!allowedUpdateFields.includes(update as keyof Prisma.${
          this.name
        }UpdateInput))
          return res.status(400).json({ data: "Invalid Arguments" });
        
        if (["${this.relationalFieldNames().join(`","`)}"].includes(update)) {
          const entityConnection = {
            connect: { id: req.body[update] },
          };
          const elem = await prisma[update].findUnique({
            where: { id: req.body[update] },
          });
          if (!elem) return res.status(400).json({ data: \`\${update} not found\` });
          updateObject[update] = entityConnection;
        } else updateObject[update] = req.body[update];
      }
    
      const ${this.name}ToBeUpdated = await prisma.${this.name}.findUnique({
        where: { id: ${this.name}Id },
      });
      if (!${this.name}ToBeUpdated)
        return res.status(404).json({ data: "${modelName} Not Found" });

      updateObject.updatedAt = new Date();
      const ${this.name} = await prisma.${this.name}.update({
        where: {
          id: ${this.name}Id,
        },
        data: updateObject,
      });
    
      return res.json({ data: ${this.name} });
    };
    `;
  }

  generateUserInputValidator() {
    this.validationString = `
    import Joi from 'joi'
    export const schema = Joi.object().keys({
      ${[
        ...this.attributes.staticField.map((field) => {
          return { name: field.name, type: field.type };
        }),
        ...this.attributes.relationalField.map((field) => {
          return { name: field.connection, type: "Int" };
        }),
      ]
        .map((fieldData) => `${fieldData.name}: ${joiMapping[fieldData.type]},`)
        .join("\n")}
    })
    `;
  }
  generateDocString() {
    this.apiDocPathString = `"/${this.name}" : {
      "get" : {
          "summary" : "Get all the ${this.name}s",
          "description": "Get all the ${this.name}s",
          "produces": ["application/json"],
          "parameters": [],
          "tags":["${this.name}"],
          "responses": {
              "200": {
                  "description": "successful operation",
                  "schema": {
                      "type": "array",
                      "items": {
                          "$ref": "#/definitions/${this.name}Response"
                      }
                  }
              }
          }
      },
      "post" : {
          "summary" : "Save the ${this.name}",
          "description": "Save the ${this.name}",
          "produces": ["application/json"],
          "consumes": ["application/json"],
          "tags":["${this.name}"],
          "parameters": [
              {
                  "in": "body",
                  "name": "body",
                  "description": "${this.name} object",
                  "required": true,
                  "schema": {
                      "type": "object",
                      "$ref": "#/definitions/${this.name}"                             
                  }
              }
          ],
          "responses": {
              "200": {
                  "description": "successful operation",
                  "schema": {
                      "type": "object",
                      "properties": {
                          "data":{
                              "type":"object",
                              "$ref": "#/definitions/${this.name}Response"
                          }
                      }
                  }
              },
              "400": {
                  "description": "Invalid request body",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              }
          }
      }
  },
  "/${this.name}/{id}" : {
      "get" : {
          "summary" : "Get ${this.name} by id",
          "description": "Get ${this.name} by id",
          "produces": ["application/json"],
          "parameters": [],
          "tags":["${this.name}"],
          "responses": {
              "200": {
                  "description": "successful operation",
                  "schema": {
                      "type": "object",
                      "properties": {
                          "data":{
                              "type":"object",
                              "$ref": "#/definitions/${this.name}Response"
                          }
                      }
                  }
              },
              "400": {
                  "description": "Invalid status value",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              },
              "404":{
                  "description": "Couldn't Find",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              }
          }
      },
      "patch" : {
          "summary" : "Update the ${this.name}",
          "description": "Update the ${this.name}",
          "produces": ["application/json"],
          "tags":["${this.name}"],
          "parameters": [
              {
                  "name": "id",
                  "in": "path",
                  "description": "${this.name} id that needs to be deleted",
                  "required": true,
                  "type": "string"
              },
              {
                  "in": "body",
                  "name": "body",
                  "description": "${this.name} object",
                  "required": true,
                  "schema": {
                      "type": "object",
                      "$ref": "#/definitions/${this.name}"                             
                  }
              }
          ],
          "responses": {
              "200": {
                  "description": "successful operation",
                  "schema": {
                      "type": "object",
                      "properties": {
                          "data":{
                              "type":"object",
                              "$ref": "#/definitions/${this.name}Response"
                          }
                      }
                  }
              },
              "400": {
                  "description": "Invalid status value",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              },
              "404":{
                  "description": "Couldn't Find",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              }
          }
      },
      "delete" : {
          "summary" : "Delete the ${this.name}",
          "description": "Delete the ${this.name}",
          "produces": ["application/json"],
          "tags":["${this.name}"],
          "parameters": [
              {
                  "name": "id",
                  "in": "path",
                  "description": "${this.name} id that needs to be deleted",
                  "required": true,
                  "type": "string"
              }
          ],
          "responses": {
              "200": {
                  "description": "successful operation",
                  "schema": {
                      "type": "obj",
                      "$ref": "#/definitions/DeleteResponse"
                  }
              },
              "400": {
                  "description": "Invalid id",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              },
              "404":{
                  "description": "Couldn't Find",
                  "schema": {
                      "$ref": "#/definitions/InvalidResponse"
                  }
              }
          }
      }
  },\n`;
    //TODO: relational fields in api doc definitions
    this.apiDocDefinitionString = `"${this.name}Response": {
      "type": "object",
      "properties": {
          "id": {
               "type": "integer"
          },
          ${this.attributes.staticField.map((staticField) => {
            return `"${staticField.name}":{\n "type":"${
              this.mapPrismaToSwagger[
                staticField.type
              ]
            }"\n} \n`;
          })},
          ${this.attributes.relationalField.map((relationalField) => {
            return `"${relationalField.connection}":{\n "type":"integer"\n} \n`;
          })}
      }
  },
  "${this.name}": {
      "type": "object",
      "properties": {
        ${this.attributes.staticField.map((staticField) => {
          return `"${staticField.name}":{\n "type":"${
            this.mapPrismaToSwagger[
              staticField.type
            ]
          }"\n} \n`;
        })},
        ${this.attributes.relationalField.map((relationalField) => {
          return `"${relationalField.connection}":{\n "type":"integer"\n} \n`;
        })}
      }
  },`;
  }
}

// CONVERT STRING TO ARRAYS OF STRINGS AND FINALLY USE THIS ARRAY
