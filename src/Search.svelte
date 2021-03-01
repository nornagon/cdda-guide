<script lang="ts">
  import { data } from './data'
  let search: string = history.state?.search || '';
  
  function matches(search: string, obj: any) {
    return obj.id && obj.id.includes(search);
  }
  function filter(text: string) {
    const matchesByType = new Map<string, any>()
    for (const obj of $data.all()) {
      if (matches(text, obj)) {
        if (!matchesByType.has(obj.type))
          matchesByType.set(obj.type, [])
        matchesByType.get(obj.type).push(obj)
      }
    }
    return matchesByType
  }
  
  $: matchingObjects = search && search.length > 1 && $data && filter(search)
  
  $: history.replaceState({ search }, '')
  
  const insensitive = (a: string, b: string) => {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  }
  
  const byId = (a, b) => {
    return a.id.localeCompare(b.id)
  }
</script>

<input bind:value={search} tabindex=0 />
{#if matchingObjects}
  {#each [...matchingObjects.keys()].sort(insensitive) as type}
  <h2>{type}</h2>
  <ul>
    {#each matchingObjects.get(type).sort(byId) as obj}
    <li><a href="#/item/{obj.id}">{obj.id}</a></li>
    {/each}
  </ul>
  {/each}
{:else}
  <pre>...</pre>
{/if}
