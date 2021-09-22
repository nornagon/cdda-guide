<script lang="ts">
import { CddaData, singularName } from "../data";
import ThingLink from "./ThingLink.svelte";
import type { Proficiency } from "../types";
import { getContext } from "svelte";
import LimitedList from "../LimitedList.svelte";

export let item: Proficiency;

const data = getContext<CddaData>("data");

const recipesUsingProficiency = [
  ...new Set(
    data
      .byType("recipe")
      .filter((recipe) =>
        (recipe.proficiencies ?? []).some(
          (prof) => prof.proficiency === item.id
        )
      )
      .map((recipe) => recipe.result)
  ),
].sort((a, b) =>
  singularName(data.byId("item", a)).localeCompare(
    singularName(data.byId("item", b))
  )
);
</script>

<h1>Proficiency: {singularName(item)}</h1>
<section>
  <dl>
    <dt>Time to Learn</dt>
    <dd>{item.can_learn ? item.time_to_learn : "not learnable"}</dd>
    <dt>Default Time Multiplier</dt>
    <dd>{item.default_time_multiplier ?? 2}&times;</dd>
    <dt>Default Fail Multiplier</dt>
    <dd>{item.default_fail_multiplier ?? 2}&times;</dd>
    {#if item.required_proficiencies}
      <dt>Required Proficiencies</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.required_proficiencies as id}
            <li><ThingLink {id} type="proficiency" /></li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if recipesUsingProficiency.length}
  <section>
    <h1>Recipes</h1>
    <LimitedList items={recipesUsingProficiency} let:item>
      <ThingLink type="item" id={item} />
    </LimitedList>
  </section>
{/if}
