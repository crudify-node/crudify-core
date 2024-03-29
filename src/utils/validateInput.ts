import Joi from "joi";

const staticFieldSchema = Joi.object().keys({
  name: Joi.string().required(),
  type: Joi.string().required(),
  isUnique: Joi.boolean().optional(),
  toBeHashed: Joi.boolean().optional(),
  faker: Joi.any(),
  defaultValue: Joi.string().optional(),
});

const relationalFieldSchema = Joi.object().keys({
  name: Joi.string().required(),
  connection: Joi.string().required(),
  foriegnKeyName: Joi.string().required(),
  targetKeyName: Joi.string().optional(),
  type: Joi.string().valid("ONETOMANY", "ONETOONE").required(),
});

const attributeSchema = Joi.object().keys({
  StaticFields: Joi.array().items(staticFieldSchema).required(),
  RelationalFields: Joi.array().items(relationalFieldSchema).required(),
});

const model = Joi.object().keys({
  name: Joi.string().required(),
  attributes: attributeSchema,
  softDelete: Joi.boolean().optional().default(true),
});

const schema = Joi.object().keys({
  Models: Joi.array().items(model).required(),
  Authentication: Joi.any().optional(),
  Enums: Joi.array().optional(),
  default: Joi.any(),
});

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const validateInput = (inp: JSON) => {
  if (isJsonString(JSON.stringify(inp))) {
    const { error } = schema.validate(inp);
    if (!error) return { message: "All good" };
    const msg = error.details[0].message;
    return { error: msg };
  }
  return { error: "not a valid JSON" };
};
