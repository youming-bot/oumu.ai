# Repository Guidelines

## Project Structure & Module Organization
- Feature routes, server actions, and API handlers live in `src/app/<feature>` using kebab-case directories.
- Shared UI, hooks, utilities, and contracts reside in `src/components/`, `src/hooks/`, `src/lib/`, and `src/types/` respectively.
- Co-locate unit tests with their modules or place broader suites in `src/__tests__/`; reserve `test/` for end-to-end flows and store static assets in `public/`.
- Keep feature-specific helpers alongside their owners and place docs or diagrams inside `docs/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server (requires `.env.local`).
- `npm run build` followed by `npm start` produces and serves the production bundle.
- `npm run lint` runs Biome; `npm run format` applies its fixes.
- `npm run type-check` executes `tsc --noEmit`.
- `npm test`, `npm run test:watch`, and `npm run test:coverage` run Jest once, in watch mode, or with coverage reporting.

## Coding Style & Naming Conventions
- Write strict TypeScript with 2-space indentation, prefer `const`, and annotate exported return types.
- Use `camelCase` for variables/functions, `PascalCase` for components/types, selective `SCREAMING_SNAKE_CASE` for constants, and `kebab-case` for route folders.
- Let Biome manage formatting for JSX, Tailwind classes, and import ordering; avoid manual reflowing.

## Testing Guidelines
- Use Jest with Testing Library; mock Dexie-backed flows with `fake-indexeddb` when needed.
- Name test files `*.test.ts[x]` and keep coverage at or above 80% statements and branches.
- Document intentional test gaps or flaky paths in PR notes.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (e.g., `feat: transcription queue`, `fix: api cache`, `chore: update docs`).
- PRs should explain scope, link related issues, include UI evidence for visual changes, and flag env/config updates.
- Confirm recent lint, type-check, and test runs before requesting review; call out areas needing extra attention.

## Security & Configuration Tips
- Stream audio directly to Groq without persisting blobs, and keep credentials in `.env.local` only.
- Ensure `/api/*` responses set `Cache-Control: no-store` and validate payloads with Zod before side effects.
- Apply exponential backoff and conservative concurrency when calling Groq or OpenRouter services.

## Agent Workflow Notes
- Keep diffs tight, aligned with existing architecture, and avoid opportunistic refactors.
- Defer to any deeper `AGENTS.md` files inside feature folders if present.
