# Repository Guidelines

## Project Structure & Module Organization
This Next.js app router project organizes routes, server actions, and API handlers inside `src/app/<feature>` using kebab-case folders. Shared UI, hooks, and utilities live in `src/components/`, `src/hooks/`, and `src/lib/`, while reusable contracts go in `src/types/`; keep feature-only helpers alongside their modules. Place colocated unit tests near the code or move broader suites to `src/__tests__/`, reserve `test/` for end-to-end flows, store static assets in `public/`, and keep docs or diagrams within `docs/`.

## Build, Test, and Development Commands
- `npm run dev` — start the dev server (requires `.env.local`).
- `npm run build` / `npm start` — create and verify the production bundle.
- `npm run lint` — run Biome; `npm run format` applies fixes.
- `npm run type-check` — execute `tsc --noEmit`.
- `npm test` | `npm run test:watch` | `npm run test:coverage` — run Jest once, in watch mode, or with coverage.

## Coding Style & Naming Conventions
Write strict TypeScript with 2-space indentation, prefer `const`, and annotate export return types. Trust Biome for formatting JSX, Tailwind class lists, and import order; avoid manual reflows. Use `camelCase` for variables and functions, `PascalCase` for components and types, selective `SCREAMING_SNAKE_CASE` constants, and `kebab-case` route directories.

## Testing Guidelines
Rely on Jest with Testing Library for components, hooks, and server actions. Name files `*.test.ts[x]`, colocate them when practical, and keep Dexie-backed suites under `fake-indexeddb`. Maintain ≥80% statement and branch coverage, and document any intentional gaps or flaky paths in the PR notes.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (for example `feat: transcription queue`, `fix: api cache`, `chore: update docs`). PRs should explain scope, link issues, attach UI evidence when visuals change, and highlight env or config updates. Confirm recent lint, type-check, and test runs, and flag areas needing focused review.

## Security & Configuration Tips
Stream audio directly to Groq without persisting blobs, and store credentials only in `.env.local`. Ensure `/api/*` responses set `Cache-Control: no-store` and validate payloads with Zod before side effects. Apply exponential backoff and conservative concurrency when calling Groq or OpenRouter services.

## Agent-Specific Notes
Keep diffs tight and aligned with existing architecture; skip opportunistic refactors. Check deeper folders for additional `AGENTS.md` files and defer to the most local guidance.
