import { Model } from "./ModelClass";
import { Enum } from "./EnumClass";
import { convertToUpperCamelCase } from "./common";
import * as fse from "fs-extra";
import path from "path";

export type adjListType = {
  [key: string]: Array<string>;
};

export class SeedDataGeneration {
  models: Array<Model>;
  enums: Array<Enum>;
  adjacencyList: adjListType = {};
  visitedModels: Set<string>;
  topologicallySortedModels: Array<Model> = [];
  seedFilePath = path.join(process.cwd(), "/app/prisma/seed.ts");
  seedFileString = "";

  constructor(models: Array<Model>, enums: Array<Enum>) {
    this.models = models;
    this.enums = enums;

    // Creating adjacency list
    for (const independentModel of this.models) {
      for (const dependentModel of independentModel.attributes
        .relationalField) {
        if (dependentModel.connection in this.adjacencyList) {
          this.adjacencyList[dependentModel.connection].push(
            independentModel.name
          );
        } else {
          this.adjacencyList[dependentModel.connection] = [
            independentModel.name,
          ];
        }
      }
    }

    this.visitedModels = new Set<string>();
    this.topologicalSort();
    this.generateSeedFileString();
  }

  topologicalSort() {
    for (const model of this.models) {
      if (!this.visitedModels.has(model.name)) {
        this.topologicalSortDFS(model.name);
      }
    }
    this.topologicallySortedModels.reverse();
  }

  topologicalSortDFS(modelName: string) {
    this.visitedModels.add(modelName);

    if (this.adjacencyList[modelName] !== undefined) {
      for (const nbr of this.adjacencyList[modelName]) {
        if (!this.visitedModels.has(nbr)) this.topologicalSortDFS(nbr);
      }
    }

    // Finding the model from modelName to push into the topological sorting stack
    const modelToPush = this.models.find(
      (model) => model.name === modelName
    ) as Model;
    this.topologicallySortedModels.push(modelToPush);
  }

  generateSeedFileString() {
    this.seedFileString = `import {
        Prisma,
        PrismaClient,
        ${this.models.map((model) => model.name).join(",")}
      } from "@prisma/client";
      import { faker } from "@faker-js/faker";
      
      const getRandomListElement = (items) => {
        return items[Math.floor(Math.random() * items.length)];
      };

      ${this.models
        .map((model) => {
          return `const new${convertToUpperCamelCase(
            model.name
          )} = (${model.attributes.relationalField
            .map((field) => `${field.connection}: ${field.connection}`)
            .join(",")}): Prisma.${model.name}CreateInput => {
            return {
                ${[
                  ...model.attributes.staticField.map((field) => {
                    // Get faker module and method for native Prisma types
                    const faker = prismaFakerMapping[field.type];

                    if (faker !== undefined) {
                      let { module, method } = faker;
                      // Override module and method as per user input
                      if (field?.faker?.module && field?.faker?.method) {
                        module = field.faker.module;
                        method = field.faker.method;
                      }
                      return `${field.name}: faker.${module}.${method}()`;
                    }

                    // Handling enums
                    const userEnum = this.enums.find(
                      (e) => e.name === field.type
                    );
                    if (userEnum !== undefined) {
                      return `${
                        field.name
                      }: getRandomListElement([${userEnum.fields.map(
                        (enumName) => `"${enumName}"`
                      )}])`;
                    }

                    throw new Error(
                      `Type of field: ${field.name} is neither a Prisma data type nor an enum`
                    );
                  }),
                  ...model.attributes.relationalField.map((field) => {
                    return `${field.connection}: { connect: { id: ${field.connection}.id } }`;
                  }),
                ].join(",\n")}
            };
          };`;
        })
        .join("\n\n")}
      
      const prisma = new PrismaClient();
      
      export const seed = async () => {
        const ROWS = 10;
        
        ${this.models
          .map((model) => `const ${model.name}s: Array<${model.name}> = [];`)
          .join("\n")}
      
        Array.from({ length: ROWS }).forEach(async () => {
            ${this.topologicallySortedModels
              .map((model) => {
                return `const ${model.name} = await prisma.${
                  model.name
                }.create({ data: new${convertToUpperCamelCase(
                  model.name
                )}(${model.attributes.relationalField
                  .map((field) => `getRandomListElement(${field.connection}s)`)
                  .join(",")}) });
                  ${model.name}s.push(${model.name});\n`;
              })
              .join("\n")}
        });
      
        await prisma.$disconnect();
      };
      seed();
      export default seed;
      `;

    fse.outputFileSync(this.seedFilePath, this.seedFileString);
  }
}

export type PrismaFakerMapping = {
  [key: string]: {
    module: string;
    method: string;
  };
};

export const prismaFakerMapping: PrismaFakerMapping = {
  String: {
    module: "lorem",
    method: "word",
  },
  Boolean: {
    module: "datatype",
    method: "boolean",
  },
  Int: {
    module: "datatype",
    method: "number",
  },
  BigInt: {
    module: "datatype",
    method: "bigInt",
  },
  Float: {
    module: "datatype",
    method: "float",
  },
  Decimal: {
    module: "datatype",
    method: "float",
  },
  DateTime: {
    module: "datatype",
    method: "datetime",
  },
  Json: {
    module: "datatype",
    method: "json",
  },
};
