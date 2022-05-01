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
  controllerString!: string;
  constructor(name: string) {
    this.name = name as string;
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
  generateRoutes() {
    this.controllerString = `
    import { Prisma } from ".prisma/client";
    import { Request, Response } from "express";
    import prisma from "~/lib/prisma";
    
    export const handleCreateEntity = async (req: Request, res: Response) => {
        const { ${[
          ...this.staticFieldNames(),
          ...this.relationalFieldNames(),
        ].join(",")} } = req.body;
        ${this.relationalFieldNames().map((relationalField) => {
          return `const entityToBeConnected = await prisma.${relationalField}.findUnique({
            where: { id: ${relationalField} },
          });
      
          if (!entityToBeConnected)
            return res.status(400).json({ data: "Entity not found" });
      `;
        })}
        
        const newEntityObject = {
          ${this.staticFieldNames().join(",")},
          ${this.relationalFieldNames().map((relationalField) => {
            return `${relationalField}: { connect: { id: ${relationalField} } },`;
          })}
         
        };
        const entity = await prisma.${this.name}.create({
          data: newEntityObject,
        });
        return res.json({ data: entity });
    };
    
    export const handleDeleteEntity = async (
      req: Request<{ id: string }>,
      res: Response
    ) => {
      const entityId = Number(req.params.id);
      if (!entityId) return res.status(400).json({ data: "Invalid ID" });
    
      const entity = await prisma.entity.findUnique({
        where: { id: entityId },
      });
    
      if (!entity) return res.status(404).json({ data: "Entity Not Found" });
    
      await prisma.entity.delete({
        where: {
          id: entityId,
        },
      });
    
      return res.status(200).json({ data: "Successfully Deleted!" });
    };
    
    export const handleGetAllEntities = async (req: Request, res: Response) => {
      const skip = Number(req.query.skip) || 0;
      const take = Number(req.query.take) || 10;
    
      const entitys = await prisma.entity.findMany({
        skip: skip,
        take: take,
      });
    
      return res.json({ data: entitys });
    };
    
    export const handleGetEntityById = async (
      req: Request<{ id: string }>,
      res: Response
    ) => {
      const entityId = Number(req.params.id);
      const entity = await prisma.entity.findUnique({
        where: { id: entityId },
      });
      return res.json({ data: entity });
    };
    
    export const handle = async (
      req: Request<{ id: string }>,
      res: Response
    ) => {
      const entityId = Number(req.params.id);
      const allowedUpdateFields: Array<keyof Prisma.EntityUpdateInput> = [
        "title",
        "token",
      ];
    
      const updates = Object.keys(req.body);
    
      const updateObject: Prisma.EntityUpdateInput = {};
    
      for (const update of updates) {
        if (!allowedUpdateFields.includes(update as keyof Prisma.EntityUpdateInput))
          return res.status(400).json({ data: "Invalid Arguments" });
        else updateObject[update] = req.body[update];
      }
    
      const entityToBeUpdated = await prisma.entity.findUnique({
        where: { id: entityId },
      });
      if (!entityToBeUpdated)
        return res.status(404).json({ data: "Entity Not Found" });
      const entity = await prisma.entity.update({
        where: {
          id: entityId,
        },
        data: updateObject,
      });
    
      return res.json({ data: entity });
    };
    `;
  }
}

// CONVERT STRING TO ARRAYS OF STRINGS AND FINALLY USE THIS ARRAY
