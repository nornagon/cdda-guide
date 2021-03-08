<script lang="ts">
  import { getContext } from "svelte"
  import { CddaData, pluralName, singularName } from "../data"

  export let type: string
  export let id: string
  export let plural: boolean = false
  
  const data = getContext<CddaData>('data')
  
  let item = data.byId(type, id)
</script>

<a href="#/{type}/{id}">{(plural ? pluralName : singularName)(item) ?? id}</a>