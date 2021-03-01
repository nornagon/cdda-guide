<script lang="ts">
  import { data } from './data'
  import Fuse from 'fuse.js'
  
  let fuse: Fuse<any>
  $: fuse = new Fuse([...$data?.all() ?? []].filter(x => typeof x.id === 'string'), {
    keys: ['id', 'name'],
    getFn: (obj: any, path: string | string[]): string | string[] => {
      if (path[0] === 'id')
        return obj.id ?? obj.abstract ?? ''
      if (path[0] === 'name')
        return obj.name?.str ?? ''
    },
    ignoreFieldNorm: true,
  })

  let search: string = history.state?.search || '';
  
  function filter(text: string) {
    const results = fuse.search(text, { limit: 100 })
    return results.map(x => x.item)
  }
  
  $: matchingObjects = search && search.length > 1 && $data && filter(search)
  
  $: history.replaceState({ search }, '')
</script>

<input bind:value={search} tabindex=0 />
{#if matchingObjects}
  <ul>
    {#each matchingObjects as obj}
    <li><a href="#/item/{obj.id}">{obj.id}</a></li>
    {/each}
  </ul>
{:else}
  <pre>...</pre>
{/if}
