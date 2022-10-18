import { RelationalField, StaticField, type } from "./ModelClass";

export function getStaticFields(dataModel: any): Array<StaticField> {
  const staticFields: Array<StaticField> = [];

  for (const staticField of dataModel.attributes.StaticFields) {
    const newStaticField: StaticField = {
      name: staticField.name,
      type: staticField.type,
      isUnique: staticField.isUnique,
      toBeHashed: staticField.toBeHashed,
      faker: staticField.faker,
      defaultValue: staticField.defaultValue
    };
    staticFields.push(newStaticField);
  }
  return staticFields;
}

export function getRelationalFields(dataModel: any): Array<RelationalField> {
  const relationalFields: Array<RelationalField> = [];

  for (const relationalField of dataModel.attributes.RelationalFields) {
    const newRelationalField: RelationalField = {
      connection: relationalField.connection,
      foreignKey: relationalField.foriegnKeyName,
      type: relationalField.type as unknown as type,
    };
    relationalFields.push(newRelationalField);
  }
  return relationalFields;
}
