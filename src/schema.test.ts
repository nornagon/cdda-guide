import * as TJS from "typescript-json-schema";
import * as fs from "fs";
import Ajv from "ajv";
import { CddaData } from "./data";

const program = TJS.programFromConfig(__dirname + "/../tsconfig.json");

const ajv = new Ajv({ allowUnionTypes: true });
const typesSchema = TJS.generateSchema(program, "SupportedTypes", {
  required: true,
});
const schemasByType = new Map(
  Object.entries(typesSchema.properties).map(([typeName, sch]) => {
    const schemaForType = sch as TJS.Definition;
    return [
      typeName,
      ajv.compile({
        ...schemaForType,
        definitions: typesSchema.definitions,
        $schema: typesSchema.$schema,
      } as TJS.Definition),
    ];
  })
);
const data = new CddaData(
  JSON.parse(fs.readFileSync(__dirname + "/../_test/all.json", "utf8")).data
);
const id = (x) => {
  if (x.id) return x.id;
  if (x.result) return x.result;
  if (x.om_terrain) return JSON.stringify(x.om_terrain);
};
const all = data._raw
  .filter((x) => id(x))
  .filter((x) => schemasByType.has(x.type))
  .map((x, i) => [x.type, id(x) ?? i, data._flatten(x)]);

const skipped = new Set<string>([
  "iflesh", // https://github.com/CleverRaven/Cataclysm-DDA/pull/52010
]);

test.each(all)("schema matches %s %s", (type, id, obj) => {
  if (skipped.has(id)) {
    pending();
    return;
  }
  const validate = schemasByType.get(type);
  const valid = validate(obj);
  if (!valid) {
    expect(validate.errors).toHaveLength(0);
  }
  expect(valid).toBe(true);
});
