<script lang="ts">
import { t } from "@transifex/native";

const isTesting =
  typeof globalThis !== undefined && (globalThis as any)?.__isTesting__;

export let spoily = false;
export let revealed = isTesting; // Spoilers are revealed in test mode.
</script>

{#if spoily}
  {#if !revealed}
    <section>
      <h1>{t("Spoiler Warning")}</h1>
      <p style="font-style: italic; color: var(--cata-color-gray)">
        {t(
          "This page contains spoilers for Cataclysm: Dark Days Ahead. If you are new to the game, it is recommended that you do not read this page. If you are a veteran player, you may find this page useful."
        )}
      </p>
      <button class="disclosure" on:click={() => (revealed = true)}
        >{t("Reveal Spoilers")}</button>
    </section>
  {:else}
    <p style="font-style: italic; color: var(--cata-color-gray)">
      {t(
        `You cheated not only the game, but yourself. You didn't grow. You didn't improve. You took a shortcut and gained nothing. You experienced a hollow victory. Nothing was risked and nothing was gained. It's sad that you don't know the difference.`
      )}
    </p>
    <slot />
  {/if}
{:else}
  <slot />
{/if}
