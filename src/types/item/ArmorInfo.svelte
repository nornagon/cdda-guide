<script lang="ts">
import { t } from "@transifex/native";
import { getContext } from "svelte";
import { CddaData, i18n, parseMass, parseVolume, singular } from "../../data";
import type {
  ArmorPortionData,
  ArmorSlot,
  BodyPart,
  ItemBasicInfo,
  PartMaterial,
  Material,
} from "../../types";
import ThingLink from "../ThingLink.svelte";
import { groupBy, uniq } from "./utils";
import ColorText from "../ColorText.svelte";

export let item: ItemBasicInfo & ArmorSlot;
let data = getContext<CddaData>("data");

const _context = "Item Armor Info";

function addRange(
  x: number | [number, number],
  y: number | [number, number]
): [number, number] {
  const [xlo, xhi] = typeof x === "number" ? [x, x] : x;
  const [ylo, yhi] = typeof y === "number" ? [y, y] : y;
  return [xlo + ylo, xhi + yhi];
}

function normalizeApdMaterial(m: NonNullable<ArmorPortionData["material"]>[0]) {
  return typeof m === "string" ? { type: m } : { ...m };
}

function isStrings<T>(array: string[] | T[]): array is string[] {
  return Array.isArray(array) && typeof array[0] === "string";
}
const itemMaterials =
  item.material == null
    ? []
    : typeof item.material === "string"
    ? [{ type: item.material, portion: 1 }]
    : Array.isArray(item.material)
    ? isStrings(item.material)
      ? item.material.map((s) => ({ type: s, portion: 1 }))
      : item.material.map((s) => ({ portion: 1, ...s }))
    : Object.entries(item.material).map(([type, portion]) => ({
        type,
        portion: portion as number,
      }));
const totalMaterialPortion = itemMaterials.reduce((m, o) => m + o.portion, 0);

const normalizedPortionData: (ArmorPortionData & {
  covers: NonNullable<ArmorPortionData["covers"]>;
  coverage: NonNullable<ArmorPortionData["coverage"]>;
  cover_melee: NonNullable<ArmorPortionData["cover_melee"]>;
  cover_ranged: NonNullable<ArmorPortionData["cover_ranged"]>;
})[] = [];
for (const apd of item.armor ?? []) {
  const mats =
    apd.material?.map(normalizeApdMaterial) ??
    itemMaterials.map((mat) => ({
      type: mat.type,
      covered_by_mat: 100,
      thickness:
        (mat.portion / totalMaterialPortion) * (item.material_thickness ?? 0),
    }));
  for (const bp_id of uniq(apd.covers ?? [])) {
    const bp = data.byId("body_part", bp_id);
    const existing = normalizedPortionData.find((apd2) =>
      apd2.covers.includes(bp_id)
    );
    if (existing) {
      existing.encumbrance = addRange(
        existing.encumbrance ?? 0,
        apd.encumbrance ?? 0
      );
      const scale = maxCoverage(bp, apd) / 100;
      const existingScale = maxCoverage(bp, existing) / 100;

      const baseCoverage = apd.coverage ?? 0;
      existing.coverage += (baseCoverage * scale) | 0;
      existing.cover_melee += ((apd.cover_melee ?? baseCoverage) * scale) | 0;
      existing.cover_ranged += ((apd.cover_ranged ?? baseCoverage) * scale) | 0;
      existing.cover_vitals =
        (existing.cover_vitals ?? 0) + (apd.cover_vitals ?? 0);

      existing.material_thickness =
        ((apd.material_thickness ?? item.material_thickness ?? 0) * scale +
          (existing.material_thickness ?? item.material_thickness ?? 0) *
            existingScale) /
        (scale + existingScale);
      existing.environmental_protection =
        (((apd.environmental_protection ?? item.environmental_protection ?? 0) *
          scale +
          (existing.environmental_protection ??
            item.environmental_protection ??
            0) *
            existingScale) /
          (scale + existingScale)) |
        0;
      existing.environmental_protection_with_filter =
        (((apd.environmental_protection_with_filter ??
          item.environmental_protection_with_filter ??
          0) *
          scale +
          (existing.environmental_protection_with_filter ??
            item.environmental_protection_with_filter ??
            0) *
            existingScale) /
          (scale + existingScale)) |
        0;

      existing.layers = existing.layers ?? [];
      for (const layer of apd.layers ?? [])
        if (!existing.layers.includes(layer)) existing.layers.push(layer);
      for (const newMat of mats) {
        const existingMat = (existing.material! as PartMaterial[]).find(
          (s) => s.type === newMat.type
        );
        if (existingMat) {
          const maxCoverageNew = maxCoverage(bp, apd);
          const maxCoverageMats = maxCoverage(bp, existing);
          existingMat.covered_by_mat =
            ((existingMat.covered_by_mat ?? 100) +
              ((newMat.covered_by_mat ?? 100) * maxCoverageNew) / 100) |
            0;

          existingMat.thickness =
            (maxCoverageNew * (newMat.thickness ?? 0) +
              maxCoverageMats * (existingMat.thickness ?? 0)) /
            (maxCoverageMats + maxCoverageNew);
        } else {
          const maxCoverageNew = maxCoverage(bp, apd);
          const modifiedMat = JSON.parse(
            JSON.stringify(newMat)
          ) as PartMaterial;
          modifiedMat.covered_by_mat =
            ((newMat.covered_by_mat ?? 100) * maxCoverageNew) / 100;
          (existing.material as PartMaterial[]).push(modifiedMat);
        }
      }
      for (const sbp of apd.specifically_covers ?? []) {
        if (!existing.specifically_covers?.includes(sbp)) {
          if (existing.specifically_covers == null)
            existing.specifically_covers = [];
          existing.specifically_covers!.push(sbp);
        }
      }
    } else {
      const newApd = JSON.parse(JSON.stringify(apd)) as ArmorPortionData;
      newApd.covers = [bp_id];
      const scale = maxCoverage(bp, newApd) / 100;

      const oldCoverage = newApd.coverage ?? 0;
      newApd.coverage = (oldCoverage * scale) | 0;
      newApd.cover_melee = ((newApd.cover_melee ?? oldCoverage) * scale) | 0;
      newApd.cover_ranged = ((newApd.cover_ranged ?? oldCoverage) * scale) | 0;
      newApd.material = JSON.parse(JSON.stringify(mats)) as PartMaterial[];
      for (const mat of newApd.material ?? []) {
        mat.covered_by_mat =
          ((mat.covered_by_mat ?? 100) * newApd.coverage) / 100;
      }
      normalizedPortionData.push(newApd as any /* TODO */);
    }
  }
}
for (const apd of normalizedPortionData) {
  for (const mat of (apd.material ?? []) as PartMaterial[]) {
    mat.covered_by_mat =
      (((mat.covered_by_mat ?? 100) / (apd.coverage ?? 0)) * 100) | 0;
  }
}

function coverageLabel(covers: string[]): string[] {
  const covered = new Set();
  const labels: string[] = [];
  for (const bp_id of covers ?? []) {
    if (covered.has(bp_id)) continue;
    const bp = data.byId("body_part", bp_id);
    if (bp.opposite_part && covers.includes(bp.opposite_part)) {
      labels.push(singular(bp.heading_multiple));
      covered.add(bp.opposite_part);
    } else {
      labels.push(singular(bp.heading));
    }
    covered.add(bp_id);
  }
  return labels;
}

function subCoverageLabel(covers: string[]): string[] {
  const covered = new Set();
  const labels: string[] = [];
  for (const bp_id of covers ?? []) {
    if (covered.has(bp_id)) continue;
    const bp = data.byId("sub_body_part", bp_id);
    if (bp.opposite && covers.includes(bp.opposite)) {
      labels.push(singular(bp.name_multiple ?? bp.name));
      covered.add(bp.opposite);
    } else {
      labels.push(singular(bp.name));
    }
    covered.add(bp_id);
  }
  return labels;
}

// group body parts by ArmorPortionData equivalence modulo |covers|.

const allCoveredPartIds = [
  ...new Set(normalizedPortionData.flatMap((x) => x.covers)),
];

const grouped = groupBy(allCoveredPartIds, (bp_id) => {
  const { covers, ...apdModuloCovers } = normalizedPortionData.find((x) =>
    x.covers.includes(bp_id)
  )!; // we know there is exactly 1
  return [JSON.stringify(apdModuloCovers)];
});

const coveredPartGroups = [...grouped.values()].map((bp_ids) => {
  const apdCoveringBp = normalizedPortionData.find((x) =>
    x.covers.includes(bp_ids[0])
  )!;
  return {
    bp_ids,
    apd: apdCoveringBp,
  };
});

const cpGroupHeading = (cpGroup: string[]) => {
  return coverageLabel(cpGroup).join(", ");
};
const encumbranceModifier = {
  IMBALANCED: { type: "flat", value: 10 },
  RESTRICTS_NECK: { type: "flat", value: 10 },
  WELL_SUPPORTED: { type: "mult", value: -20 },
  NONE: { type: "flat", value: 0 },
};
function calcEncumbrance(apd: ArmorPortionData, weight: number, bpId: string) {
  const massToEncumbrance = data.byId("body_part", bpId).encumbrance_per_weight;
  if (!massToEncumbrance) return 0;
  const parsedMassToEncumbrance = massToEncumbrance.map(
    ({ weight, encumbrance }) => ({ weight: parseMass(weight), encumbrance })
  );
  parsedMassToEncumbrance.sort((a, b) => a.weight - b.weight);
  const postIndex = parsedMassToEncumbrance.findIndex(
    ({ weight: w }) => w > weight
  );
  const preIndex = postIndex - 1;
  const pre = parsedMassToEncumbrance[preIndex];
  const post = parsedMassToEncumbrance[postIndex];
  const t = (weight - pre.weight) / (post.weight - pre.weight);
  let encumbrance = pre.encumbrance + (post.encumbrance - pre.encumbrance) * t;
  let multiplier = 100;
  let additionalEncumbrance = 0;
  if (apd.encumbrance_modifiers?.length) {
    for (const modId of apd.encumbrance_modifiers) {
      const mod = encumbranceModifier[modId];
      if (mod.type === "flat") {
        additionalEncumbrance += mod.value;
      } else if (mod.type === "mult") {
        multiplier += mod.value;
      }
    }
  }
  encumbrance =
    Math.round((encumbrance * multiplier) / 100) + additionalEncumbrance;
  return Math.max(encumbrance, 1);
}
const computeMaxEncumber = (apd: ArmorPortionData, enc: number): number => {
  return (
    enc +
    Math.floor(
      ((item.pocket_data?.reduce(
        (m, o) =>
          m +
          Math.floor(
            !o.rigid
              ? parseVolume(o.max_contains_volume ?? 0) *
                  (o.volume_encumber_modifier ?? 1)
              : 0
          ),
        0
      ) ?? 0) *
        (apd.volume_encumber_modifier ?? 1)) /
        250
    )
  );
};
const encumbrance = (cp: (typeof coveredPartGroups)[0]): [number, number] => {
  if (cp.apd.encumbrance_modifiers?.length) {
    let encumber = calcEncumbrance(
      cp.apd,
      parseMass(item.weight ?? 1),
      cp.bp_ids[0]
    );
    if (item.flags?.includes("VARSIZE"))
      encumber = Math.min(encumber * 2, encumber + 10);
    return [encumber, encumber];
  }
  return typeof cp.apd.encumbrance === "number"
    ? [cp.apd.encumbrance, computeMaxEncumber(cp.apd, cp.apd.encumbrance)]
    : cp.apd.encumbrance ?? [0, 0];
};
const fitsEncumbrance = (enc: number) =>
  Math.max(Math.floor(enc / 2), enc - 10);
function maxCoverage(bp: BodyPart, apd: ArmorPortionData): number {
  if (!bp.sub_parts?.length) return 100;

  let primaryMaxCoverage = 0;
  let secondaryMaxCoverage = 0;
  const subCovers =
    apd.specifically_covers && apd.specifically_covers.length
      ? apd.specifically_covers.map((x) => data.byId("sub_body_part", x))
      : data.byType("sub_body_part").filter((x) => x.parent === bp.id);
  for (const sub of subCovers) {
    if (bp.id !== sub.parent) continue;
    if (sub.secondary) {
      secondaryMaxCoverage += sub.max_coverage ?? 0;
    } else {
      primaryMaxCoverage += sub.max_coverage ?? 0;
    }
  }
  return Math.max(primaryMaxCoverage, secondaryMaxCoverage);
}

function armorMadeOf(bp_id: string): PartMaterial[] {
  for (const apd of normalizedPortionData)
    if (apd.covers?.includes(bp_id)) return apd.material as PartMaterial[];
  return [];
}

function getEnvResist() {
  if (normalizedPortionData.length === 0) return 0;
  const avgEnvResist =
    normalizedPortionData.reduce(
      (m, o) =>
        m + (o.environmental_protection ?? item.environmental_protection ?? 0),
      0
    ) / normalizedPortionData.length;
  return avgEnvResist;
}

function envResist(bp_id: string, resistFn: (m: Material) => number) {
  {
    const mats = armorMadeOf(bp_id);
    if (mats?.length) {
      let resist = 0;
      for (const mat of mats)
        resist +=
          resistFn(data.byId("material", mat.type)) *
          (mat.covered_by_mat ?? 0) *
          0.01;
      const env = getEnvResist();
      if (env < 10) resist *= env / 10;
      return resist;
    }
  }

  let resist = 0;
  const { mats, total } = computeMats();
  if (mats.length) {
    for (const m of mats) resist += resistFn(data.byId("material", m.type));
    resist /= total;
  }
  const env = getEnvResist();
  if (env < 10) resist *= env / 10;
  return resist;
}

function acidResist(bp_id: string) {
  return envResist(bp_id, (m) => m.acid_resist ?? m.resist?.acid ?? 0);
}

function heatResist(bp_id: string) {
  return envResist(bp_id, (m) => m.fire_resist ?? m.resist?.heat ?? 0);
}

/*
function getThickness(bp_id: string): number {
  for (const apd of normalizedPortionData)
    if (apd.covers?.includes(bp_id))
      return apd.material_thickness ?? item.material_thickness ?? 0;
}
*/

function computeMats() {
  let matPortionTotal = 0;
  const mats: { type: string; portion: number }[] = [];
  if (Array.isArray(item.material)) {
    for (const mat of item.material) {
      if (typeof mat === "string") {
        mats.push({ type: mat, portion: 1 });
        matPortionTotal += 1;
      } else if (typeof mat === "object") {
        const nmat = { type: mat.type, portion: mat.portion ?? 1 };
        matPortionTotal += nmat.portion;
        mats.push(nmat);
      }
    }
  }
  return { mats, total: matPortionTotal };
}

function fixApd(
  apd: ArmorPortionData
): ArmorPortionData & { material: PartMaterial[] } {
  return apd as any;
}
</script>

<section>
  <h1>{t("Armor", { _context, _comment: "Section heading" })}</h1>
  <dl>
    <dt>{t("Layer", { _context })}</dt>
    <dd>
      {#if (item.flags ?? []).includes("PERSONAL")}{t("Personal aura", {
          _context: "Armor Layer",
        })}
      {:else if (item.flags ?? []).includes("SKINTIGHT")}{t("Close to skin", {
          _context: "Armor Layer",
        })}
      {:else if (item.flags ?? []).includes("BELTED")}{t("Strapped", {
          _context: "Armor Layer",
        })}
      {:else if (item.flags ?? []).includes("OUTER")}{t("Outer", {
          _context: "Armor Layer",
        })}
      {:else if (item.flags ?? []).includes("WAIST")}{t("Waist", {
          _context: "Armor Layer",
        })}
      {:else if (item.flags ?? []).includes("AURA")}{t("Outer aura", {
          _context: "Armor Layer",
        })}
      {:else}{t("Normal", { _context: "Armor Layer" })}
      {/if}
    </dd>
    <dt>{t("Warmth", { _context })}</dt>
    <dd>{item.warmth ?? 0}</dd>
    {#if item.sided}
      <dt>{t("Sided", { _context })}</dt>
      <dd>{t("Yes")}</dd>
    {/if}
  </dl>

  <div class="body-parts">
    {#each coveredPartGroups as cp}
      {@const apd = fixApd(cp.apd)}
      {@const [encMin, encMax] = encumbrance(cp)}
      <div class="body-part">
        <h2>
          {cpGroupHeading(cp.bp_ids)}
          {#if cp.apd.specifically_covers?.length}
            ({subCoverageLabel(cp.apd.specifically_covers).join(", ")})
          {/if}
        </h2>
        <dl>
          <dt>{t("Encumbrance", { _context })}</dt>
          <dd>
            {#if item.flags?.includes("VARSIZE")}
              {@const fitsEncMin = fitsEncumbrance(encMin)}
              {@const fitsEncMax = fitsEncumbrance(encMax)}
              <dl>
                <dt>
                  <ColorText
                    text={i18n.__(" <info>(fits)</info>")}
                    fgOnly={true} />
                </dt>
                <dd>
                  {#if fitsEncMin === fitsEncMax}
                    {fitsEncMin}
                  {:else}
                    {fitsEncMin}–{fitsEncMax}
                  {/if}
                </dd>
                <dt>
                  <ColorText
                    text={i18n.__(" <bad>(poor fit)</bad>")}
                    fgOnly={true} />
                </dt>
                <dd>
                  {#if encMin === encMax}
                    {encMin}
                  {:else}
                    {encMin}–{encMax}
                  {/if}
                </dd>
              </dl>
            {:else if encMin === encMax}
              {encMin}
            {:else}
              {encMin}–{encMax}
            {/if}
          </dd>
          <dt>{t("Coverage", { _context })}</dt>
          <dd>
            {#if cp.apd.coverage === cp.apd.cover_melee && cp.apd.coverage === cp.apd.cover_ranged && cp.apd.cover_vitals === 0}
              {cp.apd.coverage}%
            {:else}
              <dl>
                <dt>{t("Default", { _context: "Armor Coverage" })}</dt>
                <dd>{cp.apd.coverage}%</dd>
                {#if cp.apd.coverage !== cp.apd.cover_melee}
                  <dt>{t("Melee", { _context: "Armor Coverage" })}</dt>
                  <dd>{cp.apd.cover_melee}%</dd>
                {/if}
                {#if cp.apd.coverage !== cp.apd.cover_ranged}
                  <dt>{t("Ranged", { _context: "Armor Coverage" })}</dt>
                  <dd>{cp.apd.cover_ranged}%</dd>
                {/if}
                {#if cp.apd.cover_vitals}
                  <dt>{t("Vitals", { _context: "Armor Coverage" })}</dt>
                  <dd>{cp.apd.cover_vitals}%</dd>
                {/if}
              </dl>
            {/if}
          </dd>
          <dt>{t("Protection", { _context })}</dt>
          <dd class="protection">
            {#if getEnvResist()}
              <dl class="protection-env">
                <dt>{t("Acid", { _context: "Damage Type" })}</dt>
                <dd>{acidResist(cp.bp_ids[0]).toFixed(2)}</dd>
                <dt>{t("Heat", { _context: "Damage Type" })}</dt>
                <dd>{heatResist(cp.bp_ids[0]).toFixed(2)}</dd>
                <dt>{t("Environ.", { _context })}</dt>
                <dd>{getEnvResist()}</dd>
              </dl>
            {/if}
            <table style="text-align: center;">
              <tbody>
                <tr>
                  <td />
                  {#each apd.material as mat}
                    <td
                      style="writing-mode: vertical-rl; text-align: right; vertical-align: middle;"
                      ><ThingLink type="material" id={mat.type} /></td>
                  {/each}
                </tr>
                <tr>
                  <td>{t("Thickness", { _context })}</td>
                  {#each apd.material as mat}
                    <td>{(mat.thickness ?? 0).toFixed(1)}mm</td>
                  {/each}
                </tr>
                <tr>
                  <td>{t("Coverage", { _context })}</td>
                  {#each apd.material as mat}
                    <td>{(mat.covered_by_mat ?? 100).toFixed(0)}%</td>
                  {/each}
                </tr>
                <tr>
                  <td>{t("Bash", { _context: "Damage Type" })}</td>
                  {#each apd.material as mat}
                    {@const m = data.byId("material", mat.type)}
                    <td
                      >{(
                        (m.bash_resist ?? m.resist?.bash ?? 0) *
                        (mat.thickness ?? 0)
                      ).toFixed(2)}</td>
                  {/each}
                </tr>
                <tr>
                  <td>{t("Cut", { _context: "Damage Type" })}</td>
                  {#each apd.material as mat}
                    {@const m = data.byId("material", mat.type)}
                    <td
                      >{(
                        (m.cut_resist ?? m.resist?.cut ?? 0) *
                        (mat.thickness ?? 0)
                      ).toFixed(2)}</td>
                  {/each}
                </tr>
                <tr>
                  <td>{t("Ballistic", { _context: "Damage Type" })}</td>
                  {#each apd.material as mat}
                    {@const m = data.byId("material", mat.type)}
                    <td
                      >{(
                        (m.bullet_resist ?? m.resist?.bullet ?? 0) *
                        (mat.thickness ?? 0)
                      ).toFixed(2)}</td>
                  {/each}
                </tr>
              </tbody>
            </table>
          </dd>
        </dl>
      </div>
    {/each}
  </div>
</section>

<style>
.body-parts {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.body-part {
  margin-right: 1em;
}

.body-part h2 {
  font-size: 1rem;
  margin: 0;
  text-transform: capitalize;
  color: var(--cata-color-gray);
}

table {
  border-spacing: 1em 0;
}

table tr > td:first-child {
  font-weight: bold;
  color: var(--cata-color-gray);
  text-align: right;
}

.protection {
  margin-left: -4em;
  margin-right: -1em;
  font-variant: tabular-nums;
}

.protection-env {
  margin-left: 4em;
}

@media (max-width: 600px) {
  .protection {
    margin-left: -1em;
  }

  .protection-env {
    margin-left: 1em;
  }

  .body-part dl {
    padding-left: 1em;
  }
}
</style>
