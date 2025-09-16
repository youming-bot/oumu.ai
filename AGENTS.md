# Repository Guidelines

This guide aligns contributors on structure, commands, style, testing, and security for this Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Dexie project.

## Project Structure & Module Organization
- `app/` routes and API routes (e.g., `app/api/transcribe/route.ts`, `app/api/postprocess/route.ts`).
- `components/` UI (player, subtitles, cards).
- `lib/` utilities (segmentation/merge, OpenRouter client, schema).
- `db/` Dexie schema/types for `files` and `transcripts`.
- `public/` static assets.
- `tests/` unit/e2e tests. Data stays local in the browser (IndexedDB); do not persist audio on the server.

## Build, Test, and Development Commands
- Prereqs: Node 18+, npm/pnpm, `.env.local` with `GROQ_API_KEY`, `OPENROUTER_API_KEY`, etc.
- Dev: `npm run dev` — start Next.js in dev mode.
- Build: `npm run build`; Run: `npm start` (built server).
- Quality: `npm run lint`, `npm run format`, `npm run typecheck`.
- Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm test -- --watch` for local loops.

## Coding Style & Naming Conventions
- TypeScript strict; 2‑space indent; no implicit `any`.
- ESLint + Prettier; prefer fix‑on‑save.
- Names: `camelCase` (vars/functions), `PascalCase` (components/types), `kebab-case` for route folders/files under `app/`.
- Keep modules focused; co‑locate small helpers near features.

## Testing Guidelines
- Unit: Vitest/Jest; cover `lib/` and API routes; target ≥80% statements/branches.
- E2E: Playwright for upload → transcribe → postprocess → shadowing.
- Files: `*.test.ts` or `*.spec.ts` next to source or under `tests/`.
- Mocks: MSW for `/api/*` and OpenRouter/Groq stubs.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`) with scopes like `api`, `ui`, `lib`, `db`.
- PRs: clear description, linked issues, screenshots for UI, notes on env/DB changes, and evidence of tests (unit/e2e). Keep diffs small and atomic.

## Security & Configuration Tips
- Never persist audio on the server; proxy to STT; set `Cache-Control: no-store` on `/api/*`.
- Stream `FormData` to Groq; avoid disk writes; validate with Zod.
- Enforce chunk limits, concurrency caps, backoff; redact secrets in logs.
- Store keys in `.env.local`; never commit secrets.

## Agent-Specific Instructions
- Prefer minimal, surgical diffs aligned with the architecture; keep filenames stable.
- Do not add licenses or unrelated refactors.
- Obey AGENTS.md scoping: nested AGENTS.md files override within their directories.

