<script lang="ts">
import { getContext } from "svelte"
import { CddaData, countsByCharges, pluralName, singularName } from "../data"

export let type: string
export let id: string
export let plural: boolean = false
export let count: number | undefined = undefined

const data = getContext<CddaData>('data')

let item = data.byId(type, id)
</script>

{#if count != null}
<span style="white-space: nowrap">
{#if !countsByCharges(item)}{count}{/if}
<svelte:self type={type} id={id} plural={count !== 1 && !countsByCharges(item)} />{#if countsByCharges(item)}{' '}({count}){/if}</span>
{:else}
<a href="#/{type}/{id}">{item ? (plural ? pluralName : singularName)(item) : id}</a>
{/if}
