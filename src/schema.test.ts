import * as TJS from "typescript-json-schema";
import * as fs from 'fs'
import Ajv from 'ajv'
import { CddaData } from "./data";

const program = TJS.programFromConfig(
  __dirname + '/../tsconfig.json',
);

const schema = TJS.generateSchema(program, "Thing", {required: true})
const data = new CddaData(JSON.parse(fs.readFileSync(__dirname + '/../_test/all.json', 'utf8')).data)
const id = x => {
  if (x.id) return x.id
  if (x.result) return x.result
  if (x.om_terrain) return JSON.stringify(x.om_terrain)
}
const all = data._raw.filter(x => id(x)).map((x, i) => [x.type, id(x) ?? i, data._flatten(x)])

const skipped = new Set([
])

const ajv = new Ajv({ allowUnionTypes: true })
const validate = ajv.compile(schema)

test.each(all)("schema matches %s %s", (type, id, obj) => {
  if (skipped.has(id)) {
    pending()
    return;
  }
  const valid = validate(obj)
  if (!valid) {
    expect(validate.errors.filter(e => e.dataPath !== '/type')).toHaveLength(0)
    expect(validate.errors).toHaveLength(0)
  }
  expect(valid).toBe(true)
})
