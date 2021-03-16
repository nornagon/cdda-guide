import * as TJS from "typescript-json-schema";
import * as fs from 'fs'
import Ajv from 'ajv'

const program = TJS.programFromConfig(
  __dirname + '/../tsconfig.json',
);

const schema = TJS.generateSchema(program, "Thing")
const data = JSON.parse(fs.readFileSync(__dirname + '/../_test/all.json', 'utf8')).data
const id = x => {
  if (x.id) return x.id
  if (x.result) return x.result
  if (x.om_terrain) return JSON.stringify(x.om_terrain)
}
const all = data.map((x, i) => [x.type, id(x) ?? i, x])

const ajv = new Ajv
const validate = ajv.compile(schema)

test.each(all)("schema matches %s %s", (type, id, obj) => {
  const valid = validate(obj)
  if (!valid) {
    expect(validate.errors.filter(e => e.dataPath !== '/type')).toHaveLength(0)
    expect(validate.errors).toHaveLength(0)
  }
  expect(valid).toBe(true)
})
