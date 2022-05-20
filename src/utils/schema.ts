export type JoiMapping = {
  [index: string]: string;
};
export const joiMapping: JoiMapping = {
  String: `Joi.string().allow("")`,
  Int: "Joi.number().integer().strict()",
  Json: "Joi.any()",
  Boolean: "Joi.bool()",
  Float: "Joi.number()",
  DateTime: "Joi.string()",
};
