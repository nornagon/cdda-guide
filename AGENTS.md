## Project Overview

This repository hosts a web-based guide for Cataclysm: Dark Days Ahead (CDDA) that presents searchable, browsable data about game entities such as items and monsters.
The goal is to provide players with a quick reference for in-game information, mirroring the semantics from the upstream CDDA codebase and JSON data.
When behavior or terminology is unclear, cross-reference the official Cataclysm-DDA source, which may already be checked out in ../Cataclysm-DDA.

## Coding Conventions

- Source is written in **TypeScript** using **Svelte** components.
- Use `yarn lint:fix` before committing to apply **Prettier** formatting.
- A pre‑commit hook runs Prettier, `svelte-check` and `tsc --noEmit`.
- Tests are written with **Vitest** (`*.test.ts`). Run `yarn test` to execute them.
- `yarn test` fetches data into `_test/all.json` if needed via `fetch-fixtures.js`.

## Repository Layout

- `src/` – Svelte components and TypeScript logic
  - `types/` – UI components grouped by game object type
  - `types/item/`, `types/monster/` – submodules for item and monster details
  - `assets/` – bundled images
  - `*.test.ts` – unit tests
  - `data.ts` – code for loading and translating game data
- `public/` – static assets used by Vite
- `_test/` – downloaded test fixtures (`all.meta.json` is tracked, `all.json` is fetched on demand)
- `vite.config.ts`, `svelte.config.js`, `tsconfig*.json` – build configuration
- Scripts like `fetch-fixtures.js` and `generate-color-css.js` live in the repo root

## Development

- Use **Yarn** for dependency management (`yarn install`).
- Run `yarn dev` for the development server and `yarn build` to create a production build.
- CI uses Node.js 22.x; modern Node versions (>=18) are recommended.
- Always run `yarn test` before committing. If tests cannot run due to network limits, note this in your PR.

## Backwards compatibility

cdda-guide is intended to function with data from the master branch of Cataclysm-DDA, as well as with the most recent stable version.
Compatibility with older versions is desirable but not required.
When making changes, if it is easy to maintain compatibility with older versions, please do so. However, if it would require a significant amount of work, it is acceptable to only support the latest stable version and master.

## Translation

There are two sources for translation strings:

- For text from the game itself, we rely on the translations provided by the Cataclysm-DDA project.
  These are usable via the i18n.gettext helpers (`singular` / `plural` / `translate` / etc. in data.ts for data from items, or `i18n.__` / `i18n.gettext` for UI strings).
  It's preferable to use these when possible as they match the in-game strings and don't require further translation.
- For UI strings and any additional text we add, we use Transifex via the `t("English String", { _context?: string, _comment?: string })` helper.
  If a string requires interpolation, and the interpolated values are basic values (e.g. strings or numbers), they can be passed using the `t("{n}", {n})` syntax.
  If the interpolated values aren't basic strings (e.g. they are links or Svelte components), the \<InterpolatedString> component can be used.
