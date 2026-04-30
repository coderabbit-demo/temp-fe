import Link from "next/link";

import { EmptyState } from "@/components/research/empty-state";
import { FilterForm } from "@/components/research/filter-form";
import { StatusChip } from "@/components/research/status-chip";
import { formatDate, formatDateTime, formatPercent } from "@/lib/competitor-dashboard/format";
import { buildReportRows, buildRunsSummary, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const context = await getDashboardContext(searchParams);

  if (!context) {
    return (
      <div className="page">
        <EmptyState
          title="No seeded dashboard data yet"
          description="Run npm run seed from the repo root to create the local competitor archive and artifact set."
        />
      </div>
    );
  }

  const reports = buildReportRows(context);
  const runs = buildRunsSummary(context);
  const latestReport = reports[0];
  const totalFindings = reports.reduce((total, report) => total + report.findingsCount, 0);
  const cardsView = context.filters.view === "cards";

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Archive dashboard</span>
          <h1>Historical competitor sweep reports</h1>
          <p>
            Review separate competitor report entities across time, filter the archive, and open detail
            pages with finding logs, source ledgers, and artifact downloads.
          </p>
        </div>
        <div className="metric-strip">
          <article className="metric-card">
            <span>Reports</span>
            <strong>{reports.length}</strong>
          </article>
          <article className="metric-card">
            <span>Findings</span>
            <strong>{totalFindings}</strong>
          </article>
          <article className="metric-card">
            <span>Last updated</span>
            <strong>{formatDateTime(context.data.lastSeededAt)}</strong>
          </article>
          <article className="metric-card">
            <span>Latest run</span>
            <strong>{latestReport ? formatDate(latestReport.generatedAt) : "Not available"}</strong>
          </article>
        </div>
      </section>

      <FilterForm
        filters={context.filters}
        competitors={context.data.competitors.map((competitor) => ({
          id: competitor.id,
          name: competitor.name
        }))}
        runs={runs.map((run) => ({ id: run.id, label: run.id }))}
        savedViews={context.data.savedViews}
      />

      {cardsView ? (
        <section className="card-grid">
          {reports.map((report) => (
            <article key={report.id} className="archive-card">
              <div className="archive-card__header">
                <div>
                  <h2>{report.competitor.name}</h2>
                  <p>{report.runId}</p>
                </div>
                <StatusChip
                  status={
                    context.data.findings.find((finding) => finding.reportId === report.id)?.validationStatus ??
                    "needs_review"
                  }
                />
              </div>
              <dl className="archive-card__meta">
                <div>
                  <dt>Run date</dt>
                  <dd>{formatDate(report.sweepRunDate)}</dd>
                </div>
                <div>
                  <dt>Window</dt>
                  <dd>{report.reportWindowLabel}</dd>
                </div>
                <div>
                  <dt>Findings</dt>
                  <dd>{report.findingsCount}</dd>
                </div>
                <div>
                  <dt>Newest finding</dt>
                  <dd>{formatDate(report.newestFindingDate)}</dd>
                </div>
                <div>
                  <dt>Validation</dt>
                  <dd>{formatPercent(report.validationCoverage)}</dd>
                </div>
                <div>
                  <dt>Latest movement</dt>
                  <dd>{report.latestMovementFound ? "Found" : "Missing"}</dd>
                </div>
              </dl>
              <div className="archive-card__footer">
                <Link href={`/research/reports/${report.id}`}>Open report</Link>
                <div className="link-row">
                  {report.artifacts.map((artifact) => (
                    <Link key={artifact.id} href={`/api/artifacts/${artifact.id}`}>
                      {artifact.kind.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Competitor</th>
                <th>Run date</th>
                <th>Window</th>
                <th>Findings</th>
                <th>Newest finding</th>
                <th>Validation</th>
                <th>Latest movement</th>
                <th>Artifacts</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <Link href={`/research/reports/${report.id}`}>{report.competitor.name}</Link>
                    <div className="subtle">{report.runId}</div>
                  </td>
                  <td>{formatDate(report.sweepRunDate)}</td>
                  <td>{report.reportWindowLabel}</td>
                  <td>{report.findingsCount}</td>
                  <td>{formatDate(report.newestFindingDate)}</td>
                  <td>{formatPercent(report.validationCoverage)}</td>
                  <td>{report.latestMovementFound ? "Found" : "Missing"}</td>
                  <td>
                    <div className="link-row">
                      {report.artifacts.map((artifact) => (
                        <Link key={artifact.id} href={`/api/artifacts/${artifact.id}`}>
                          {artifact.kind.toUpperCase()}
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
