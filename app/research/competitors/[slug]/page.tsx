import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/research/empty-state";
import { StatusChip } from "@/components/research/status-chip";
import { formatDate, formatDateTime, formatPercent } from "@/lib/competitor-dashboard/format";
import { getCompetitorDetail, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export default async function CompetitorDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const context = await getDashboardContext({});
  if (!context) {
    return (
      <div className="page">
        <EmptyState
          title="No competitor history"
          description="Run npm run seed before opening competitor detail pages."
        />
      </div>
    );
  }

  const detail = getCompetitorDetail(context, params.slug);
  if (!detail) {
    notFound();
  }

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Competitor history</span>
          <h1>{detail.competitor.name}</h1>
          <p>Compare multiple runs across time for the same competitor and review the newest findings first.</p>
        </div>
        <div className="metric-strip">
          <article className="metric-card">
            <span>Reports</span>
            <strong>{detail.reports.length}</strong>
          </article>
          <article className="metric-card">
            <span>Findings</span>
            <strong>{detail.findings.length}</strong>
          </article>
          <article className="metric-card">
            <span>Last updated</span>
            <strong>{formatDateTime(context.data.lastSeededAt)}</strong>
          </article>
        </div>
      </section>

      <section className="table-shell">
        <h2>Run comparison</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Generated</th>
              <th>Window</th>
              <th>Findings</th>
              <th>Validation</th>
              <th>Latest movement</th>
              <th>Artifacts</th>
            </tr>
          </thead>
          <tbody>
            {detail.reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <Link href={`/research/reports/${report.id}`}>{report.runId}</Link>
                </td>
                <td>{formatDate(report.generatedAt)}</td>
                <td>{report.reportWindowLabel}</td>
                <td>{report.findingsCount}</td>
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

      <section className="stack">
        <h2>Recent finding log</h2>
        {detail.findings.map((finding) => (
          <article key={finding.id} className="finding-card">
            <div className="finding-card__header">
              <div>
                <h3>{finding.claim}</h3>
                <p>{formatDateTime(finding.createdAt)}</p>
              </div>
              <StatusChip status={finding.validationStatus} />
            </div>
            <div className="finding-card__body">
              <p>
                <strong>Supporting details:</strong> {finding.supportingDetails}
              </p>
              <p>
                <strong>Why it matters:</strong> {finding.whyItMatters}
              </p>
              <p>
                <strong>CodeRabbit comparison:</strong> {finding.codeRabbitComparison}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
