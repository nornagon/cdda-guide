import * as TJS from "typescript-json-schema";
import * as fs from 'fs'
import Ajv from 'ajv'

const program = TJS.programFromConfig(
  __dirname + '/../tsconfig.json',
);

const schema = TJS.generateSchema(program, "All")

test("data matches schema", async () => {
  const json = JSON.parse(await fs.promises.readFile(__dirname + '/../_test/all.json', 'utf8'))
  const ajv = new Ajv
  const validate = ajv.compile(schema)
  const valid = validate(json)
  expect(valid)
})
