export default {
  "*.{js,ts,mjs,svelte,html}": [
    "prettier -w",
    "svelte-check",
    () => "tsc --noEmit -p .",
  ],
};
