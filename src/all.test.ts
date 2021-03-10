import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/svelte'
import * as fs from 'fs'

import { CddaData } from './data'

import Thing from './Thing.svelte';

const json = JSON.parse(fs.readFileSync(__dirname + '/../_test/all.json', 'utf8'))
let data: CddaData = new CddaData(json.data)
const types = [
  'item',
  'furniture',
  'monster',
  'technique',
  'ammunition_type',
  'fault',
  'json_flag',
  'material',
  'proficiency',
  'tool_quality',
  'skill',
]
for (const ty of types) {
  for (const item of data.byType(ty)) {
    if (item.id)
      test(`render ${ty} ${item.id}`, () => {
        const { container } = render(Thing, { item: { type: ty, id: item.id}, data })
        if (ty !== 'technique') {
          expect(container.textContent).not.toMatch(/undefined/)
          expect(container.textContent).not.toMatch(/NaN/)
        }
      })
  }
}
