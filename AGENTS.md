# Repository Guidelines

## Project Structure & Module Organization
Oumu.ai uses the Next.js App Router in `src/app`, where each route segment bundles page, layout, and server actions. Shared UI primitives live in `src/components`, composable state lives in `src/hooks`, domain logic and API clients stay under `src/lib`, and reusable types are defined in `src/types`. Static assets and icons belong in `public/`. Scenario notes and architecture references sit in `docs/`, while automated diagnostics and fixtures are in `test/diagnostic` and `test/factories`.

## Build, Test, and Development Commands
Use pnpm (the repo pins pnpm 10). Key commands:
- `pnpm dev` launches the local Next.js server with hot reload.
- `pnpm build` compiles the production bundle; run before profiling deployments.
- `pnpm start` serves the `.next` output for smoke testing.
- `pnpm lint` and `pnpm format` apply Biome checks; the latter writes fixes.
- `pnpm type-check` runs the TypeScript compiler without emitting files.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, 100-character line width, and recommended lint rules (`noUnusedImports`, `useConst`). Prefer `PascalCase` for components, `camelCase` for variables and hooks (`useTranscriptionStatus`), and `SCREAMING_SNAKE_CASE` for environment constants. Keep JSX pure and favor Tailwind utility classes configured in `tailwind.config.ts`. Run `pnpm format` before pushing to avoid churn.

## Testing Guidelines
Jest with Testing Library backs both unit and integration coverage. Co-locate specs in the mirrored `test/unit` or `test/integration` paths, naming files `*.test.ts` or `*.test.tsx`. For IndexedDB flows, reuse helpers in `test/factories`. Execute `pnpm test` for CI parity and `pnpm test:coverage` when touching core flows; maintain or improve reported coverage gates. Use `pnpm test:watch` when iterating locally.

## Commit & Pull Request Guidelines
Follow the concise, imperative style seen in history (`fix: resolve Dexie schema drift`). Keep subject lines under 72 characters and include context in the body when behavior changes. Reference GitHub issues with `Closes #123` when applicable. Pull requests should summarize intent, call out user-facing impacts, and attach before/after screenshots for UI changes. Verify `pnpm lint`, `pnpm type-check`, and `pnpm test` locally before requesting review.

## Environment & Data Handling
Configuration lives in `.env.example`; copy it to `.env.local` and inject Groq/OpenRouter keys. Never commit credentials. The app persists user media to IndexedDB only—respect this contract when adding features and ensure new API calls avoid server-side storage. Document any new flags in `docs/` so agents can reproduce setups.
