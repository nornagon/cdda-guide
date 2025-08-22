<script lang="ts">
interface Props {
  item: any;
}

let { item }: Props = $props();
</script>

<pre>{JSON.stringify(item, null, 2)}</pre>
