# Competitor Research Dashboard

## Purpose

The Competitor Research Dashboard is a local-first internal archive for historical competitor sweep reports.

It is designed to help teams:

- review what was pulled across time
- browse separate competitor report entities per sweep run
- find the newest validated competitor movement quickly
- compare multiple runs for the same competitor
- download report artifacts for internal prep

Each sweep run creates separate competitor reports for:

- GitHub Copilot
- Cursor / Bugbot
- Qodo
- Greptile
- Gemini Code Assist
- Claude Code / Anthropic
- Cubic

Reports are preserved over time and are never overwritten.

## Access

From the repo root:

```bash
npm install
npm run seed
npm run dev
```

Then open:

- `http://localhost:3000/research/dashboard`

Useful companion routes:

- `http://localhost:3000/research/settings`
- `http://localhost:3000/api/health`

## What users can do

### Dashboard

The archive home supports:

- recent-first sorting
- sticky filters that stay visible while browsing
- shareable URL state
- table or card view
- saved views for common slices

Filters include:

- competitor
- date preset: 7, 30, 49, 60, 90 days
- custom date range
- source level
- validation status
- report run ID
- history band
- latest changelog movement found or missing
- free-text search

### Competitor history

The competitor detail page lets users:

- inspect all runs for one competitor
- compare report windows across time
- review the most recent findings first

### Report detail

Each report page shows:

- competitor name
- sweep run date
- report window used
- number of findings
- newest finding date
- validation coverage
- latest changelog movement found or missing
- PDF and PNG artifact downloads
- recent finding log
- source ledger grouped into Level 1, Level 2, and Level 3

### Findings and sources

The findings and sources pages support:

- quick search
- filtered review
- validation-focused triage
- source-level browsing

## SE use cases

Sales Engineers can use this dashboard to prep for demos and stay current on competitor movement without digging through raw sweep outputs.

### Before a demo

Use the dashboard to:

- open the latest report for the competitor most likely to come up on the call
- filter to the last 30 days
- focus on validated or partially validated findings
- download the PDF or PNG artifact for a quick internal brief

### During objection handling prep

Use the findings view to:

- search by competitor or feature area
- isolate community-signal items that still need stronger proof
- identify where CodeRabbit comparison language is already captured

### For historical comparisons

Use competitor detail pages to:

- compare multiple runs for the same competitor
- see whether messaging or product movement is new or recurring
- understand whether a claim is supported by official evidence or weaker sources

### For quick internal handoff

Use artifact links to:

- share a seeded PDF summary
- share a PNG preview
- give a teammate a concrete report page URL with filters preserved in the query string

## Recommended SE workflow

1. Open `/research/dashboard`.
2. Apply a competitor filter and a recent date preset.
3. Check whether latest changelog movement was found.
4. Open the report detail page.
5. Review the newest findings first.
6. Use the source ledger to distinguish official evidence from weaker community signals.
7. Download the PDF or PNG artifact if you need a quick internal shareable asset.

## Data and artifact locations

Local dashboard data:

- `data/competitor-dashboard.json`

Generated artifacts:

- `outputs/competitor-dashboard-artifacts`

Both locations are configurable through `.env.example` and default to repo-root-relative paths.

## How new sweep outputs get inserted

The current implementation ships with a local TypeScript seed flow for demo and development use.

`npm run seed`:

- builds the local dashboard dataset
- creates sweep runs
- creates separate competitor reports per run
- creates findings, sources, and validation flags
- generates PDF and PNG artifacts
- writes the final dataset to `data/competitor-dashboard.json`

The app reads that local dataset directly at runtime through the shared TypeScript data layer.

## Reliability goals of this rewrite

This version intentionally removes:

- Python version drift
- pip install failures
- Flask dependency churn
- ddtrace build/install issues
- absolute-path output bugs

The goal is a local workflow that works with standard Node tooling only.
