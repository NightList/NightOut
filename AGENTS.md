# Repository Guidelines

## Project Structure & Module Organization

- `apps/frontend`: React/Vite customer, merchant, and staff interfaces.
- `apps/admin`: React/Vite backoffice under `/admin/`.
- Pages live in `src/modules/<camelCase>/page.tsx`; shared UI, hooks, and API integration live in `src/ui`, `src/hooks`, and `src/services`. Assets live in each app's `public/` directory.
- `apps/backend`: NestJS API; business domains in `src/domains/`, API integration tests in `test/`, and migrations/seeds in `supabase/`.
- `packages/`: shared `contracts`, `types`, `utils`, `ui`, `mock`, and `config`. Infrastructure: `infra/terraform/`; specifications: `docs/`.

## Build, Test, and Development Commands

- Use Node.js 22+ and pnpm 10 (`packageManager`: `pnpm@10.28.0`).
- `pnpm install`: install workspace dependencies.
- Copy `.env.example` to `.env`; follow `docs/SUPABASE.md`. Catalog requires API/Supabase; no demo fallback.
- `pnpm db`: start local Supabase; requires Docker.
- `pnpm dev`: run workspace development tasks; frontend `:5173`, admin `:5174`, backend defaults to `:3000`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: required delivery checks.
- `pnpm format:check`: check Prettier; format only changed files.

## Coding Style & Naming Conventions

- Use strict TypeScript, two-space indentation, UTF-8/LF, single quotes, semicolons, and trailing commas; Prettier uses 100 columns. ESLint: `packages/config`.
- Use function components and hooks; PascalCase component names, camelCase page directories, and snake_case API fields.
- Reuse Ant Design, Phosphor icons, theme tokens, and `@nightout/utils/rest`. Validate API inputs with shared Zod contracts; handle failures explicitly.

## Testing Guidelines

- Use Vitest (`*.test.ts`), colocated package tests, and Supertest/NestJS backend tests.
- `pnpm --filter @nightout/utils test`: run one package's tests.
- Test changed logic, validation, and authorization. No coverage threshold is configured. Verify UI manually with screenshots.

## Commit & Pull Request Guidelines

- History mixes Thai summaries and Conventional Commits; prefer `feat(web): ...`, `fix(admin): ...`, or `docs: ...`, one concern per commit.
- Work on `demo`; avoid subbranches and direct pushes to `main`. The owner merges `demo → main` through a PR.
- PRs: explain behavior, link issues, report checks, and include UI screenshots.

## Security & Agent Workflow

- Repository skills: `.agents/skills/<skill>/SKILL.md`. Read relevant instructions before work; UI requires `frontend-design`, plus `antd`/`ant-design`, `mobile-native`, or `animate` as applicable.
- Follow `CLAUDE.md`: agents must not commit, push, or merge. Confirm out-of-plan features and unspecified admin counterparts before implementation.
- Update module changelogs, `docs/STRUCTURE.md` for module changes, and `docs/SITEMAP.md` for route changes.
- Keep secrets outside Git and browser bundles. Use Supabase only for Auth in clients; route database operations through NestJS with RLS. Payment settlement remains DRAFT; do not enable real-money collection.
