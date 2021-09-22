<script lang="ts">
import { getContext } from "svelte";
import type { CddaData } from "../../data";

import type { BookSlot } from "../../types";
import ThingLink from "../ThingLink.svelte";

export let item: BookSlot & { id: string; type: "BOOK" };

let data = getContext<CddaData>("data");

const bookRecipes = new Map<string, number>();
function add(recipe_id: string, level: number) {
  bookRecipes.set(
    recipe_id,
    Math.min(level, bookRecipes.get(recipe_id) ?? Infinity)
  );
}
for (const recipe of data.byType("recipe")) {
  if (Array.isArray(recipe.book_learn))
    for (const [id, level = 0] of recipe.book_learn)
      if (id === item.id) add(recipe.result, level);
      else if (recipe.book_learn)
        for (const [id, obj] of Object.entries(
          recipe.book_learn as Record<string, any>
        ))
          if (id === item.id) add(recipe.result, obj.skill_level ?? 0);
}
</script>

<section>
  <h1>Book</h1>
  <dl>
    {#if item.skill}
      <dt>Skill</dt>
      <dd><ThingLink id={item.skill} type="skill" /></dd>
      <dt>Required Level</dt>
      <dd>{item.required_level ?? 0}</dd>
      <dt>Maximum Level</dt>
      <dd>{item.max_level ?? 0}</dd>
    {/if}
    <dt>Required Intelligence</dt>
    <dd>{item.intelligence ?? 0}</dd>
    <dt>Read Time</dt>
    <dd>{item.time ?? 0}</dd>
    <dt>Fun</dt>
    <dd>{item.fun ?? 0}</dd>
    {#if item.chapters}
      <dt>Chapters</dt>
      <dd>{item.chapters}</dd>
    {/if}
    {#if item.martial_art}
      <dt>Martial Art</dt>
      <dd><ThingLink type="martial_art" id={item.martial_art} /></dd>
    {/if}
    {#if bookRecipes.size}
      <dt>Recipes</dt>
      <dd>
        <ul>
          {#each [...bookRecipes.entries()].sort((a, b) => {
            if (a[1] !== b[1]) return a[1] - b[1];
            return a[0].localeCompare(b[0]);
          }) as [id, level]}
            <li><ThingLink {id} type="item" /> ({level})</li>
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
</section>
