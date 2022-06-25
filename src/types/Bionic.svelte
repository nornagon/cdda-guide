<script lang="ts">
import { getContext } from "svelte";

import { CddaData, singular, singularName } from "../data";
import type { Bionic } from "../types";
import ThingLink from "./ThingLink.svelte";

export let item: Bionic;
const data = getContext<CddaData>("data");
</script>

<h1>{singularName(item)}</h1>
<section>
  <h1>General</h1>
  <dl>
    <dt>Occupied Body Parts</dt>
    <dd>
      {#if item.occupied_bodyparts}
        <ul class="comma-separated">
          {#each item.occupied_bodyparts as [bp_id, slots]}
            <li>
              {singularName(data.byId("body_part", bp_id))} ({slots}
              {slots === 1 ? "slot" : "slots"})
            </li>
          {/each}
        </ul>
      {:else}
        <em>none</em>
      {/if}
    </dd>
    {#if item.encumbrance}
      <dt>Encumbrance</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.encumbrance as [bp_id, encum]}
            <li>{singularName(data.byId("body_part", bp_id))} ({encum})</li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.stat_bonus}
      <dt>Stat Bonuses</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.stat_bonus as [stat_id, bonus]}
            <li>{bonus >= 0 ? `+${bonus}` : `–${-bonus}`} {stat_id}</li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.cant_remove_reason}
      <dt>Cannot Be Removed</dt>
      <dd>{singular(item.cant_remove_reason)}</dd>
    {/if}
    {#if item.act_cost}
      <dt>Activation Cost</dt>
      <dd>{item.act_cost}</dd>
    {/if}
    {#if item.trigger_cost}
      <dt>Trigger Cost</dt>
      <dd>{item.trigger_cost}</dd>
    {/if}
    {#if item.react_cost}
      <dt>Power Over Time</dt>
      <dd>{item.react_cost}</dd>
    {/if}
    {#if (item.vitamin_absorb_mod ?? 1) !== 1}
      <dt>Vitamin Absorption Modifier</dt>
      <dd>{(item.vitamin_absorb_mod * 100).toFixed(0)}%</dd>
    {/if}
    {#if item.fuel_options?.length}
      <dt>Fuel</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.fuel_options as material_id}
            <li><ThingLink type="material" id={material_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.fuel_capacity}
      <dt>Fuel Capacity</dt>
      <dd>{item.fuel_capacity}</dd>
    {/if}
    {#if item.fuel_efficiency}
      <dt>Fuel Efficiency</dt>
      <dd>{item.fuel_efficiency * 100}%</dd>
    {/if}
    {#if item.passive_fuel_efficiency}
      <dt>Passive Fuel Efficiency</dt>
      <dd>{item.passive_fuel_efficiency * 100}%</dd>
    {/if}
    {#if item.exothermic_power_gen}
      <dt>Emits Heat</dt>
      <dd>yes</dd>
    {/if}
    {#if item.power_trickle}
      <dt>Power Trickle</dt>
      <dd>{item.power_trickle}</dd>
    {/if}
    {#if item.time}
      <dt>Charge Time</dt>
      <dd>{item.time} turn{item.time !== 1 ? "s" : ""}</dd>
    {/if}
    {#if item.capacity}
      <dt>Capacity</dt>
      <dd>{item.capacity}</dd>
    {/if}
    {#if item.fake_weapon}
      <dt>Acts As</dt>
      <dd><ThingLink type="item" id={item.fake_weapon} /></dd>
    {/if}
    {#if item.toggled_pseudo_items?.length}
      <dt>Acts As</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.toggled_pseudo_items as item_id}
            <li><ThingLink type="item" id={item_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.passive_pseudo_items?.length}
      <dt>Acts As</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.passive_pseudo_items as item_id}
            <li><ThingLink type="item" id={item_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.included_bionics?.length}
      <dt>Includes</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.included_bionics as bionic_id}
            <li><ThingLink type="bionic" id={bionic_id} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    <dt>Duplicates Allowed</dt>
    <dd>{item.dupes_allowed ? "yes" : "no"}</dd>
    <dt>Flags</dt>
    <dd>
      {#if item.flags?.length}
        <ul class="comma-separated">
          {#each item.flags as flag}
            <li><ThingLink type="json_flag" id={flag} /></li>
          {/each}
        </ul>
      {:else}
        <em>none</em>
      {/if}
    </dd>
    {#if item.active_flags}
      <dt>Flags When Active</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.active_flags as flag}
            <li><ThingLink type="json_flag" id={flag} /></li>
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.mutation_conflicts}
      <dt>Conflicts With Mutations</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.mutation_conflicts as mutation_id}
            {#if data.byId("mutation", mutation_id)}
              <li><ThingLink type="mutation" id={mutation_id} /></li>
            {/if}
          {/each}
        </ul>
      </dd>
    {/if}
    {#if item.canceled_mutations}
      <dt>Removes Mutations</dt>
      <dd>
        <ul class="comma-separated">
          {#each item.canceled_mutations as mutation_id}
            {#if data.byId("mutation", mutation_id)}
              <li><ThingLink type="mutation" id={mutation_id} /></li>
            {/if}
          {/each}
        </ul>
      </dd>
    {/if}
  </dl>
  <p style="color: var(--cata-color-gray)">{singular(item.description)}</p>
</section>
