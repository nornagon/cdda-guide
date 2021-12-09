<script lang="ts">
import { getContext } from "svelte";

import { CddaData, mapType, singularName } from "../data";
import LimitedList from "../LimitedList.svelte";
import type { Skill, SupportedTypesWithMapped } from "../types";
import ItemSymbol from "./item/ItemSymbol.svelte";
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

const itemsUsingSkill = data
  .byType("item")
  .filter(
    (i) => i.id && i.type === "GUN" && i.skill === item.id
  ) as SupportedTypesWithMapped["GUN"][];
itemsUsingSkill.sort((a, b) => singularName(a).localeCompare(singularName(b)));
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
        <dt style="font-variant: tabular-nums">Level {level}</dt>
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

{#if itemsUsingSkill.length}
  <section>
    <h1>Used By</h1>
    <LimitedList items={itemsUsingSkill} let:item>
      <ItemSymbol {item} />
      <ThingLink type="item" id={item.id} />
    </LimitedList>
  </section>
{/if}
