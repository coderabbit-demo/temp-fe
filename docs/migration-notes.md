# Migration Notes

## Summary

The old Flask + Python dashboard has been replaced with a Next.js + TypeScript implementation.

This migration focuses on:

- simpler local setup
- Node-only tooling
- repo-root-relative file handling
- preserved competitor dashboard product intent

## Old to new mapping

### Runtime

- Old: Flask app in `app.py`
- New: Next.js App Router under `app/`

### Server routes

- Old: Flask routes in `routes/competitor_dashboard.py`
- New: Next route handlers in `app/api/**`

### Templates and styling

- Old: Jinja templates under `templates/research/**` and CSS under `static/competitor_dashboard.css`
- New: App Router pages under `app/research/**` and shared styling in `app/globals.css`

### Data access

- Old: Python service layer in `services/competitor_dashboard_db.py`
- New: TypeScript data layer in `lib/competitor-dashboard/store.ts` and `lib/competitor-dashboard/queries.ts`

### Seed and bootstrap flow

- Old: Python scripts `scripts/bootstrap_competitor_dashboard.py` and `scripts/ingest_competitor_sweep.py`
- New: TypeScript seed/bootstrap flow in `scripts/seed.ts`

### Artifact generation

- Old: Python PDF/PNG generation via reportlab and PIL-style tooling
- New: TypeScript/Node generation via:
  - `pdf-lib` for PDFs
  - `pngjs` for PNG previews

### Persistence

- Old: SQLite via Python
- New: local JSON data file at `data/competitor-dashboard.json`

## Why JSON storage was chosen

SQLite remains a valid option, but JSON was chosen for this rewrite because the top migration goal was local reliability with minimal setup friction.

Benefits for this use case:

- no native database setup
- no platform-specific binary issues
- easy inspection of seeded data
- simple Node-only local workflow

If the dashboard later needs concurrent writes or shared multi-user hosting, the data layer can be swapped behind the existing query helpers.

## Current TypeScript project structure

- `app/`: App Router pages and API route handlers
- `components/research/`: shared dashboard UI components
- `lib/competitor-dashboard/`: local data model, filters, formatting, artifact generation, and queries
- `scripts/seed.ts`: seed/bootstrap flow
- `data/`: local JSON store
- `outputs/competitor-dashboard-artifacts/`: generated artifacts

## Removed Python-specific pain points

The new implementation eliminates these prior issues:

- Python version incompatibilities
- pip dependency failures
- virtualenv churn
- Flask dependency churn
- ddtrace build/install failures
- absolute path bugs for generated outputs

## Local run commands

```bash
npm install
npm run seed
npm run dev
```

## Healthcheck

The healthcheck endpoint is:

```text
/api/health
```

It reports whether the local data file and artifact root are available.
