import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/svelte'
import * as fs from 'fs'

import { CddaData } from './data'

import Thing from './Thing.svelte';

const json = JSON.parse(fs.readFileSync(__dirname + '/../_test/all.json', 'utf8'))
let data: CddaData = new CddaData(json.data)
for (const item of data.byType('json_flag')) {
  if (item.id)
    test(`render json_flag ${item.id}`, () => {
      render(Thing, { item: { type: 'json_flag', id: item.id}, data })
    })
}
