import { render } from '@testing-library/svelte'
import SpawnedIn from './SpawnedIn.svelte'
import WithData from '../../WithData.svelte'

test('TODO', () => {
  render(WithData, {Component: SpawnedIn, item_id: "fake_item"})
})
