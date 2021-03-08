import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/svelte'
import * as fs from 'fs'

import { CddaData } from './data'

import Thing from './Thing.svelte';

const json = JSON.parse(fs.readFileSync(__dirname + '/../_test/all.json', 'utf8'))
let data: CddaData = new CddaData(json.data)
for (const item of data.byType('furniture')) {
  if (item.id)
    test(`render furniture ${item.id}`, () => {
      render(Thing, { item: { type: 'furniture', id: item.id}, data })
    })
}
