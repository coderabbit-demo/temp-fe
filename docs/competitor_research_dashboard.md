# Competitor Research Dashboard

## Purpose

The Competitor Research Dashboard is an internal archive for historical competitor sweep reports. It gives Sales Engineers, product stakeholders, and demo-prep owners one place to:

- review recent competitor movement without re-running a sweep by hand
- compare the same competitor across multiple sweep runs
- inspect validation state and source-level coverage before using a finding in a customer conversation
- quickly open supporting PDF and PNG artifacts when a stakeholder needs source material fast

The dashboard is intentionally built around **separate competitor report records**. One sweep run can create multiple competitor-specific reports, but the app does not merge competitors into a single report entity.

## Competitors Covered

The current dashboard model supports these competitors as first-class report entities:

- GitHub Copilot
- Cursor / Bugbot
- Qodo
- Greptile
- Gemini Code Assist
- Claude Code / Anthropic
- Cubic

## How To Access It

### Local Development

1. Seed the local archive and example artifacts:

```bash
python scripts/bootstrap_competitor_dashboard.py --reset
```

2. Start the Flask app from the repo root:

```bash
flask --app app run
```

3. Open the dashboard home:

```text
/research/dashboard
```

### Important Paths

- Dashboard home: `/research/dashboard`
- Competitor history: `/research/competitors/<competitor-slug>`
- Report detail: `/research/reports/<report-id>`
- Findings search: `/research/findings`
- Source ledger: `/research/sources`
- Product spec and operating notes: `/research/settings`

### Local Storage

- SQLite database: `instance/competitor_dashboard.sqlite3`
- Generated example artifacts: `outputs/competitor-dashboard-artifacts/`

## What Users Can Do

### Dashboard Home

The home page is the report archive. It is optimized for quick filtering and recent-first scanning.

Users can:

- filter by competitor
- filter by date preset: last 7, 30, 49, 60, or 90 days
- apply a custom date range
- filter by source level coverage
- filter by validation status
- filter by report run ID
- switch between table and card layouts
- open a competitor report detail page
- open run comparison history for one competitor
- download linked PDF and PNG artifacts directly from archive rows/cards

All filters live in URL state so the current view can be bookmarked or shared internally.

### Competitor History

The competitor page is for run-to-run comparison. It is useful when someone needs to answer:

- “What changed for this competitor since the last sweep?”
- “Did we already validate this claim last month?”
- “Are we seeing a recurring gap or a one-off community signal?”

### Report Detail

The report detail page is where a Sales Engineer or strategist should go before reusing a finding in a demo, recap, or competitive follow-up.

Each finding shows:

- the claim
- supporting details
- why it matters
- CodeRabbit comparison
- validation status
- a source ledger split into Level 1, Level 2, and Level 3

This page is the best place to validate whether a point is safe to repeat externally.

## SE Use Cases

### 1. Demo Preparation

Before a live demo, an SE can:

- filter to the competitor expected in the deal
- limit the view to the last 30 days
- open the most recent competitor report
- scan validated findings first
- pull the PDF or PNG artifact if they need a fast internal handoff

This makes it easier to tailor the demo narrative to current competitor movement rather than relying on stale battlecard memory.

### 2. Objection Handling

When a prospect says a competitor recently launched or changed something, the SE can:

- search the dashboard by competitor name, feature language, or source text
- confirm whether the point is already captured in a recent sweep
- check whether it is validated, partially validated, or still community-signal only
- use the source ledger to decide whether the claim is safe to repeat

This reduces the risk of repeating weak or unvalidated market chatter.

### 3. Fast Competitive Refresh Before Calls

For late-stage calls or executive reviews, an SE can use saved views such as:

- Last 30 days
- 30-49 days
- 49-90 days
- Missing latest changelog
- Community-signal only

This makes it easy to scan for:

- current movement
- stale coverage
- items that still need stronger validation before use

### 4. Internal Follow-Up Material

After a call, an SE can use the detail page to collect:

- the exact finding wording
- the high-level implication
- the evidence split by source level
- any linked artifact files

That supports clean handoff into Slack threads, internal notes, demo prep docs, or follow-up positioning work.

## Recommended Workflow For SEs

1. Start on `/research/dashboard`.
2. Filter to the competitor and recent date window.
3. Prioritize findings marked `Validated` or `Partially Validated`.
4. Open the report detail page before repeating any claim externally.
5. Use Level 1 and Level 2 sources first.
6. Treat Level 3 material as supportive context unless corroborated.

## Data Model Summary

The dashboard preserves history instead of overwriting it.

- `sweep_runs` stores one execution of the sweep process.
- `competitor_reports` stores one report per competitor for that run.
- `findings` stores the actual finding log entries.
- `sources` stores the supporting ledger with source-level tagging.
- `artifacts` stores downloadable files such as PDFs and PNG previews.
- `validation_flags` stores additional review notes or warnings.

## Ingestion Model

The ingestion path assumes one payload per sweep run.

That payload contains:

- one run record
- multiple competitor-specific reports
- findings per competitor report
- sources per finding or report
- linked artifacts

Use this script to ingest a new payload:

```bash
python scripts/ingest_competitor_sweep.py path/to/payload.json
```

This preserves prior history instead of replacing older records.

## Notes

- The currently seeded data is illustrative sample data for the prototype.
- The UI and data model are ready for real sweep payload insertion.
- The dashboard is designed to support quick internal access to recent competitor information without collapsing distinct competitors into one merged archive record.
