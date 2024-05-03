import * as TJS from "ts-json-schema-generator";
import * as fs from "fs";
import * as util from "util";
import Ajv, { ValidateFunction } from "ajv";
import { CddaData } from "./data";
import { test, expect } from "vitest";

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchSchema(validate: ValidateFunction): R;
    }
  }
}

expect.extend({
  toMatchSchema(obj: any, schema: ValidateFunction) {
    const valid = schema(obj);
    const errors = schema.errors?.slice();
    return {
      pass: valid,
      message: () => {
        return (
          errors
            ?.map((e) => {
              return `${e.instancePath} ${e.message}, but was ${util.inspect(
                e.data
              )}`;
            })
            .join("\n") ?? ""
        );
      },
    };
  },
});

const program = TJS.createGenerator({
  tsconfig: __dirname + "/../tsconfig.json",
  additionalProperties: true, // Someday I'd like to turn this off.
});

const ajv = new Ajv({ allowUnionTypes: true, verbose: true });
const typesSchema = program.createSchema("SupportedTypes");
fs.writeFileSync("schema.json", JSON.stringify(typesSchema, null, 2));
const schemasByType = new Map(
  Object.entries(
    (typesSchema!.definitions!["SupportedTypes"] as any).properties
  ).map(([typeName, sch]) => {
    const schemaForType = sch as TJS.Definition;
    return [
      typeName,
      ajv.compile({
        ...schemaForType,
        definitions: typesSchema!.definitions,
        $schema: typesSchema!.$schema,
      } as TJS.Definition),
    ];
  })
);
const data = new CddaData(
  JSON.parse(fs.readFileSync(__dirname + "/../_test/all.json", "utf8")).data
);
const id = (x: any) => {
  if (x.id) return x.id;
  if (x.result) return x.result;
  if (x.om_terrain) return JSON.stringify(x.om_terrain);
};
const all = data._raw
  .filter((x) => id(x))
  .filter((x) => schemasByType.has(x.type))
  .map((x, i) => [x.type, id(x) ?? i, data._flatten(x)]);

const skipped = new Set<string>([
  "veggy_pickled_fried", // see https://github.com/CleverRaven/Cataclysm-DDA/pull/73406
]);

test.each(all)("schema matches %s %s", (type, id, obj) => {
  if (skipped.has(id)) {
    //pending();
    return;
  }
  expect(obj).toMatchSchema(schemasByType.get(type)!);
});
