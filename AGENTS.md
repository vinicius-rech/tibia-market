# Repository Guidelines

## Project Structure & Module Organization
- Nuxt 4 app entry lives in `app/app.vue`; keep page-level components and layouts inside `app/` to leverage file-based routing when it is added.
- Global configuration sits in `nuxt.config.ts`; update modules and runtime config there instead of hardcoding values.
- Static assets belong in `public/`; generated artifacts land in `.nuxt/` (do not commit).
- Linting rules are extended from `eslint.config.mjs`; prefer placing shared config tweaks there rather than per-file overrides.

## Build, Test, and Development Commands
- `npm install` installs dependencies and runs `nuxt prepare` (postinstall) to sync type generation.
- `npm run dev` starts the local server at http://localhost:3000 with HMR enabled.
- `npm run build` creates the production bundle in `.output/` and refreshes `.nuxt/`.
- `npm run preview` serves the production build locally for final checks.
- `npm run generate` emits a static build when targeting static hosting.

## Coding Style & Naming Conventions
- Use TypeScript where possible; default to 2-space indentation and single quotes in Vue/TS files.
- Favor `<script setup>` in Vue SFCs and keep components small and cohesive.
- Name components in PascalCase (e.g., `MarketList.vue`) and composables in camelCase (e.g., `usePrices`).
- Run ESLint before committing to catch Nuxt-specific pitfalls (`npx eslint .`).

## Testing Guidelines
- No automated tests are committed yet; when adding them, colocate unit tests near components or in `tests/` using Vue Test Utils/Vitest, and mirror file names (`ComponentName.spec.ts`).
- Aim for meaningful coverage around data handling and routing guards; keep tests fast and deterministic.

## Commit & Pull Request Guidelines
- Write commits in the imperative mood with focused scopes; group related changes and avoid noisy reformatting-only commits.
- Describe PRs concisely (what changed, why, and how to verify). Link issues when relevant and include screenshots or GIFs for UI-facing updates.
- Ensure `npm run build` and linting pass before requesting review; call out known gaps or follow-ups in the PR body.

## Security & Configuration Tips
- Store secrets in environment variables or platform-level config; never commit `.env` files with credentials.
- Review third-party module additions carefully and remove unused dependencies before release.
