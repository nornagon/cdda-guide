<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singularName } from "../data";
import type {
  Skill,
  SupportedTypeMapped,
  SupportedTypesWithMapped,
} from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Skill;

const data = getContext<CddaData>("data");

const booksWithSkill = data
  .byType("item")
  .filter((t) => t.id && t.type === "BOOK" && t.skill === item.id)
  .sort((a, b) =>
    singularName(a).localeCompare(singularName(b))
  ) as SupportedTypesWithMapped["BOOK"][];

const booksByLevel = new Map<number, SupportedTypesWithMapped["BOOK"][]>();
for (const book of booksWithSkill) {
  if (!booksByLevel.has(book.max_level ?? 0))
    booksByLevel.set(book.max_level ?? 0, []);
  booksByLevel.get(book.max_level ?? 0).push(book);
}
</script>

<h1>Skill: {singularName(item)}</h1>
<section>
  <p style="color: var(--cata-color-gray)">{item.description}</p>
</section>

{#if booksWithSkill.length}
  <section>
    <h1>Books</h1>
    <dl>
      {#each [...booksByLevel.keys()].sort((a, b) => a - b) as level}
        <dt>Level {level}</dt>
        <dd>
          <ul>
            {#each booksByLevel
              .get(level)
              .sort((a, b) => (a.required_level ?? 0) - (b.required_level ?? 0)) as book}
              <li><ThingLink id={book.id} type="item" /></li>
            {/each}
          </ul>
        </dd>
      {/each}
    </dl>
  </section>
{/if}
