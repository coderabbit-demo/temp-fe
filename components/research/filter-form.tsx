import Link from "next/link";

import { DATE_PRESETS, HISTORY_BANDS } from "@/lib/competitor-dashboard/constants";
import { filtersToSearchParams } from "@/lib/competitor-dashboard/filters";
import type { DashboardFilters } from "@/lib/competitor-dashboard/types";

interface FilterFormProps {
  filters: DashboardFilters;
  competitors: Array<{ id: string; name: string }>;
  runs: Array<{ id: string; label: string }>;
  savedViews?: Array<{ id: string; name: string; description: string; params: Record<string, string> }>;
  enableSearch?: boolean;
  showViewToggle?: boolean;
}

export function FilterForm({
  filters,
  competitors,
  runs,
  savedViews = [],
  enableSearch = true,
  showViewToggle = true
}: FilterFormProps) {
  const activeEntries = Object.entries(filters).filter(([, value]) => value);

  return (
    <div className="filter-shell">
      <form className="filter-form" method="get">
        {enableSearch ? (
          <label className="field">
            <span>Search</span>
            <input name="q" defaultValue={filters.q} placeholder="Search findings, reports, or sources" />
          </label>
        ) : null}

        <label className="field">
          <span>Competitor</span>
          <select name="competitor" defaultValue={filters.competitor ?? ""}>
            <option value="">All competitors</option>
            {competitors.map((competitor) => (
              <option key={competitor.id} value={competitor.id}>
                {competitor.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Date preset</span>
          <select name="preset" defaultValue={filters.preset ?? ""}>
            <option value="">All time</option>
            {DATE_PRESETS.map((days) => (
              <option key={days} value={String(days)}>
                Last {days} days
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Custom start</span>
          <input type="date" name="start" defaultValue={isoDate(filters.start)} />
        </label>

        <label className="field">
          <span>Custom end</span>
          <input type="date" name="end" defaultValue={isoDate(filters.end)} />
        </label>

        <label className="field">
          <span>Source level</span>
          <select name="sourceLevel" defaultValue={filters.sourceLevel ?? ""}>
            <option value="">All levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
        </label>

        <label className="field">
          <span>Validation</span>
          <select name="validationStatus" defaultValue={filters.validationStatus ?? ""}>
            <option value="">All statuses</option>
            <option value="validated">Validated</option>
            <option value="partially_validated">Partially Validated</option>
            <option value="community_signal">Community Signal</option>
            <option value="needs_review">Needs Review</option>
          </select>
        </label>

        <label className="field">
          <span>Run ID</span>
          <select name="reportRunId" defaultValue={filters.reportRunId ?? ""}>
            <option value="">All runs</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>History band</span>
          <select name="historyBand" defaultValue={filters.historyBand ?? ""}>
            <option value="">All ages</option>
            {HISTORY_BANDS.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Latest changelog</span>
          <select name="latestMovement" defaultValue={filters.latestMovement ?? ""}>
            <option value="">Found or missing</option>
            <option value="found">Found</option>
            <option value="missing">Missing</option>
          </select>
        </label>

        {showViewToggle ? (
          <label className="field">
            <span>View</span>
            <select name="view" defaultValue={filters.view ?? "table"}>
              <option value="table">Table</option>
              <option value="cards">Cards</option>
            </select>
          </label>
        ) : null}

        <div className="filter-form__actions">
          <button type="submit">Apply filters</button>
          <Link href="?">Reset</Link>
        </div>
      </form>

      <div className="filter-footer">
        <div className="filter-chips">
          {activeEntries.length ? (
            activeEntries.map(([key, value]) => (
              <span key={key} className="filter-chip">
                {key}: {value}
              </span>
            ))
          ) : (
            <span className="filter-chip filter-chip--muted">No filters applied</span>
          )}
        </div>

        {savedViews.length ? (
          <div className="saved-views">
            {savedViews.map((view) => {
              const params = filtersToSearchParams({ ...filters, ...view.params });
              return (
                <Link key={view.id} href={`?${params.toString()}`} className="saved-view">
                  <strong>{view.name}</strong>
                  <span>{view.description}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function isoDate(value?: string): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}
