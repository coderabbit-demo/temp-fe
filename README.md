# Competitor Research Dashboard

Local-first competitor dashboard rebuilt in Next.js + TypeScript.

## What this is

This app replaces the previous Flask and Python implementation with a Node-only stack that is easy to run in a normal VS Code terminal.

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind-backed design system for the dashboard shell and shared UI
- Runtime: Node.js + npm
- Storage: local JSON file under `data/competitor-dashboard.json`
- Artifacts: local PDF and PNG files under `outputs/competitor-dashboard-artifacts`

The dashboard preserves separate competitor report records across sweep runs so users can browse historical reports, compare runs, inspect findings, and download artifacts.

## Why JSON instead of SQLite

SQLite would work well here, but the primary pain points called out for this migration were local setup friction and dependency churn. For the current local-first dashboard, a structured JSON store is enough to preserve history, support filtering, generate artifacts, and keep install reliability high with no native database setup.

If this grows into a shared multi-user service later, the data layer can be swapped to SQLite or another database behind the same query helpers.

## Local setup

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Seed the local archive and artifacts:

```bash
npm run seed
```

Start the app locally:

```bash
npm run dev
```

Open:

- `http://localhost:3000/research/dashboard`
- `http://localhost:3000/research/settings`
- `http://localhost:3000/api/health`

Build for production verification:

```bash
npm run build
```

## Package scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run seed`
- `npm run check:api-security`
- `npm run validate:data`
- `npm run typecheck`

## Environment

Optional environment variables are documented in `.env.example`:

- `COMPETITOR_DASHBOARD_DATA_FILE`
- `COMPETITOR_DASHBOARD_ARTIFACT_ROOT`

Both paths are repo-root-relative by default.

## Main routes

- `/research/dashboard`: archive home with sticky filters and table/card view
- `/research/competitors`: competitor index
- `/research/competitors/[slug]`: per-competitor run comparison
- `/research/runs`: sweep run history
- `/research/reports/[reportId]`: detailed competitor report page
- `/research/findings`: findings search and review page
- `/research/sources`: source ledger page
- `/research/settings`: access notes, purpose, and local operations

## API routes

- `/api/health`
- `/api/reports`
- `/api/reports/[reportId]`
- `/api/findings`
- `/api/sources`
- `/api/artifacts/[artifactId]`

## Seeded demo behavior

`npm run seed` creates:

- 3 sweep runs
- 7 competitors
- 21 competitor-specific reports
- 42 findings
- 126 sources
- 42 artifacts

It also reseeds the dataset with non-repetitive competitor narratives and prints a data-quality score for the local archive.

Artifacts are written under:

- `outputs/competitor-dashboard-artifacts`

Local data is written to:

- `data/competitor-dashboard.json`

## Developer notes

- No Python runtime is required.
- No Flask, pip, virtualenv, ddtrace, or Python-only dependencies remain.
- All filesystem paths are repo-root-relative.
- The seed script emits developer-friendly logs and fails loudly if artifact generation breaks.
- `npm run check:api-security` verifies that the critical API routes do not leak internal storage paths and still serve the expected public contract.
- `npm run validate:data` prints duplicate/noise checks and exits non-zero when critical data issues exist.

## Additional docs

- `docs/competitor_research_dashboard.md`
- `docs/migration-notes.md`
