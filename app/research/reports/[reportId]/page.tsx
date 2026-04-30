import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/research/empty-state";
import { StatusChip } from "@/components/research/status-chip";
import { formatDate, formatDateTime, formatPercent } from "@/lib/competitor-dashboard/format";
import { getDashboardContext, getReportDetail } from "@/lib/competitor-dashboard/queries";

export default async function ReportDetailPage({
  params
}: {
  params: { reportId: string };
}) {
  const context = await getDashboardContext({});
  if (!context) {
    return (
      <div className="page">
        <EmptyState
          title="No report archive"
          description="Run npm run seed to create a local report archive before opening report detail pages."
        />
      </div>
    );
  }

  const detail = getReportDetail(context, params.reportId);
  if (!detail) {
    notFound();
  }

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Competitor report</span>
          <h1>{detail.competitor.name}</h1>
          <p>{detail.report.summary}</p>
        </div>
        <div className="metric-strip">
          <article className="metric-card">
            <span>Generated at</span>
            <strong>{formatDateTime(detail.report.generatedAt)}</strong>
          </article>
          <article className="metric-card">
            <span>Window</span>
            <strong>{detail.report.reportWindowLabel}</strong>
          </article>
          <article className="metric-card">
            <span>Validation</span>
            <strong>{formatPercent(detail.report.validationCoverage)}</strong>
          </article>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2>Report metadata</h2>
          <dl className="detail-list">
            <div>
              <dt>Run ID</dt>
              <dd>{detail.report.runId}</dd>
            </div>
            <div>
              <dt>Sweep run date</dt>
              <dd>{formatDate(detail.report.sweepRunDate)}</dd>
            </div>
            <div>
              <dt>Newest finding date</dt>
              <dd>{formatDate(detail.report.newestFindingDate)}</dd>
            </div>
            <div>
              <dt>Latest changelog movement</dt>
              <dd>{detail.report.latestMovementFound ? "Found" : "Missing"}</dd>
            </div>
            <div>
              <dt>Artifacts</dt>
              <dd className="link-row">
                {detail.artifacts.map((artifact) => (
                  <Link key={artifact.id} href={`/api/artifacts/${artifact.id}`}>
                    {artifact.kind.toUpperCase()}
                  </Link>
                ))}
              </dd>
            </div>
          </dl>
        </article>

        <article className="detail-panel">
          <h2>Source coverage</h2>
          <dl className="detail-list">
            <div>
              <dt>Level 1</dt>
              <dd>{detail.report.sourceCoverage.level1}</dd>
            </div>
            <div>
              <dt>Level 2</dt>
              <dd>{detail.report.sourceCoverage.level2}</dd>
            </div>
            <div>
              <dt>Level 3</dt>
              <dd>{detail.report.sourceCoverage.level3}</dd>
            </div>
          </dl>
        </article>
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
            <div className="source-ledger">
              {[1, 2, 3].map((level) => {
                const levelSources = finding.sources.filter((source) => source.level === level);
                return (
                  <div key={level} className="source-ledger__column">
                    <h4>Level {level}</h4>
                    {levelSources.map((source) => (
                      <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                        <strong>{source.title}</strong>
                        <span>{source.excerpt}</span>
                      </a>
                    ))}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
