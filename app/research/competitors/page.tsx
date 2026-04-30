import Link from "next/link";

import { EmptyState } from "@/components/research/empty-state";
import { formatDate, formatDateTime } from "@/lib/competitor-dashboard/format";
import { buildCompetitorSummary, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export default async function CompetitorsPage() {
  const context = await getDashboardContext({});

  if (!context) {
    return (
      <div className="page">
        <EmptyState
          title="No competitor archive data"
          description="Seed the local data file first so the competitor index can render."
        />
      </div>
    );
  }

  const summaries = buildCompetitorSummary(context);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Competitors</span>
          <h1>Competitor report entities</h1>
          <p>Each competitor is tracked as a separate report entity across sweep runs.</p>
        </div>
        <div className="metric-strip">
          <article className="metric-card">
            <span>Competitors</span>
            <strong>{summaries.length}</strong>
          </article>
          <article className="metric-card">
            <span>Last updated</span>
            <strong>{formatDateTime(context.data.lastSeededAt)}</strong>
          </article>
        </div>
      </section>

      <section className="card-grid">
        {summaries.map((summary) => (
          <article key={summary.competitor.id} className="archive-card">
            <div className="archive-card__header">
              <div>
                <h2>{summary.competitor.name}</h2>
                <p>{summary.competitor.vendor}</p>
              </div>
            </div>
            <dl className="archive-card__meta">
              <div>
                <dt>Reports</dt>
                <dd>{summary.reports}</dd>
              </div>
              <div>
                <dt>Findings</dt>
                <dd>{summary.findings}</dd>
              </div>
              <div>
                <dt>Latest report</dt>
                <dd>{summary.latestReport ? formatDate(summary.latestReport.generatedAt) : "Not available"}</dd>
              </div>
            </dl>
            <div className="archive-card__footer">
              <Link href={`/research/competitors/${summary.competitor.slug}`}>Open competitor history</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
