<script lang="ts">
type JsonFlag = {
  type: "json_flag"
  id: string
  
  info?: string
  conflicts?: string[]
  inherit?: boolean // default: true
  craft_inherit?: boolean // default: false
  requires_flag?: string
  taste_mod?: number // default: 0
}

export let item: JsonFlag
</script>

<h1>Flag: {item.id}</h1>
{#if item.info}
<section>
  <p style="color: var(--cata-color-gray)">{item.info}</p>
</section>
{/if}