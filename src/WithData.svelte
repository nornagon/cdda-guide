<script lang="ts">
import { setContext } from "svelte"
import { CddaData } from './data'
import * as fs from 'fs'

export let Component;

const json = JSON.parse(fs.readFileSync(__dirname + '/../_test/all.json', 'utf8'))
const data: CddaData = new CddaData(json.data)
setContext('data', data)

</script>

<svelte:component this={Component} {...$$restProps}/>
