import { joiMapping } from "./schema";
import * as path from "path";
import * as fse from "fs-extra";

export class Authentication {
  model: string;
  userFieldName: string;
  passwordFieldName: string;
  routerString = "";
  controllerString = "";
  validationString = "";
  routerPath = path.join(process.cwd(), "/app/src/routes/auth/index.ts");
  controllerPath = path.join(
    process.cwd(),
    "/app/src/routes/auth/controller.ts"
  );
  inputValidatorPath = path.join(
    process.cwd(),
    "/app/src/routes/auth/schema.ts"
  );

  constructor(model: string, userFieldName: string, passwordFieldName: string) {
    this.model = model;
    this.userFieldName = userFieldName;
    this.passwordFieldName = passwordFieldName;

    this.generateRoutes();
    this.generateUserInputValidator();
    this.generateRouter();
  }

  generateRouter() {
    this.routerString = `
    import { Router } from "express";
    import { ce } from "~/lib/captureError";
    import { handleLogin, getCurrentUser } from "./controller";

    export const router = Router();

    router.post("/login", ce(handleLogin));
    router.get("/me", ce(getCurrentUser));

    export default router;
    `;

    fse.outputFileSync(this.routerPath, this.routerString);
  }

  generateRoutes() {
    this.controllerString = `
import { Request, Response } from "express";
import prisma from "~/lib/prisma";
import { schema } from "./schema";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import config from "../../config";

export const handleLogin = async (req: Request, res: Response) => {
  const { error } = schema.validate(req.body);
  if (!error) {
    const ${this.userFieldName} = req.body.${this.userFieldName};
    if (${this.userFieldName}.length === 0)
      return res.status(400).json({ data: "Invalid ${this.userFieldName}" });

    const request = await prisma.${this.model}.findUnique({
      where: { ${this.userFieldName}: ${this.userFieldName} },
    });

    if (!request) return res.status(404).json({ data: "${this.model} not found" });

    const match = await bcrypt.compare(req.body.password, request.password);
    if (match) {
      //login user
      const secret = config.JWT_SECRET;
      const payload = {
        ${this.userFieldName}: request.${this.userFieldName},
      };
      const token = jwt.sign(payload, secret, { expiresIn: "24h" });
      res.status(200).json({
        token,
        message: "Credentials are correct!, user is logged in.",
      });
    } else {
      res.status(400).json({
        message:
          "User Credentials are invalid, Kindly redirect to login page again",
      });
    }
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  let token: string;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = config.JWT_SECRET;

      const decoded: any = jwt.verify(token, secret);

      const ${this.model} = await prisma.${this.model}.findUnique({
        where: {
          ${this.userFieldName}: decoded.${this.userFieldName},
        },
      });

      if (${this.model}?.password) {
        ${this.model}.password = "";
      }

      return res.status(200).json({ data: ${this.model} });
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  return res.status(400).json({ data: "Invalid token" });
};
    `;

    fse.outputFileSync(this.controllerPath, this.controllerString);
  }

  generateUserInputValidator() {
    this.validationString = `
    import Joi from 'joi'
    export const schema = Joi.object().keys({
      ${[
        { name: this.userFieldName, type: "String" },
        { name: this.passwordFieldName, type: "String" },
      ]
        .map((fieldData) => `${fieldData.name}: ${joiMapping[fieldData.type]},`)
        .join("\n")}
    })
    `;

    fse.outputFileSync(this.inputValidatorPath, this.validationString);
  }
}
