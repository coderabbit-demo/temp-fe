import Link from "next/link";

import { DataQualityIssueList } from "@/components/research/data-quality-issue-list";
import { EmptyState } from "@/components/research/empty-state";
import { FilterForm } from "@/components/research/filter-form";
import { StatusChip } from "@/components/research/status-chip";
import { formatDate, formatDateTime, formatPercent } from "@/lib/competitor-dashboard/format";
import {
  buildCompetitorSummary,
  buildFindings,
  buildReportRows,
  buildRunsSummary,
  getDashboardContext
} from "@/lib/competitor-dashboard/queries";
import { getIssuesForReport } from "@/lib/competitor-dashboard/validation";

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
  const findings = buildFindings(context);
  const latestReport = reports[0];
  const totalFindings = reports.reduce((total, report) => total + report.findingsCount, 0);
  const cardsView = context.filters.view === "cards";
  const validationSummary = context.validation.summary;
  const priorityIssues = context.validation.issues.slice(0, 6);
  const featuredReports = reports.slice(0, 4);
  const latestSignals = findings.slice(0, 5);
  const competitorSpotlights = buildCompetitorSummary(context)
    .sort((left, right) => {
      const leftDate = left.latestReport?.generatedAt ?? "";
      const rightDate = right.latestReport?.generatedAt ?? "";
      return rightDate.localeCompare(leftDate);
    })
    .slice(0, 4);
  const validatedSignals = findings.filter((finding) => finding.validationStatus === "validated").length;
  const roleJourneys = [
    {
      title: "SE demo prep",
      description: "Open the strongest validated talking points before a live competitive call.",
      href: "/research/findings?validationStatus=validated&preset=30",
      cta: "Open validated signals"
    },
    {
      title: "AE deal support",
      description: "Review the latest product movement and find the right competitor narrative fast.",
      href: "/research/dashboard?latestMovement=found&preset=30&view=cards",
      cta: "See latest movement"
    },
    {
      title: "Sales coaching",
      description: "Track which competitors keep showing up and where the messaging is shifting over time.",
      href: "/research/competitors",
      cta: "Browse competitor briefings"
    }
  ] as const;

  return (
    <div className="page">
      <section className="overflow-hidden rounded-[36px] border border-white/10 bg-slate-950 px-6 py-7 text-white shadow-shell sm:px-8 sm:py-9">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-100/80">
              Revenue briefing home
            </span>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.5rem,6vw,4.6rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-white">
              Walk into the next competitive conversation with a clearer story.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              This dashboard turns sweep history into fast briefings for SE demos, AE follow-up, and
              sales coaching. Start with the curated flow below, then drop into the full archive only if
              you need deeper evidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#featured-briefings"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-50"
              >
                Open featured briefings
              </Link>
              <Link
                href="/research/findings?validationStatus=validated&preset=30"
                className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                Review latest signals
              </Link>
              <Link
                href="#archive-explorer"
                className="inline-flex items-center rounded-full border border-white/15 bg-transparent px-5 py-3 font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Explore the archive
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div>
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-sky-100/70">
                This week at a glance
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Prioritize validated movement first, then use the archive only when a deal needs deeper
                history or source proof.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <article className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                  Featured reports
                </span>
                <strong className="mt-2 block text-2xl font-semibold tracking-[-0.04em]">
                  {featuredReports.length}
                </strong>
              </article>
              <article className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                  Validated signals
                </span>
                <strong className="mt-2 block text-2xl font-semibold tracking-[-0.04em]">
                  {validatedSignals}
                </strong>
              </article>
              <article className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                  Data health
                </span>
                <strong className="mt-2 block text-2xl font-semibold tracking-[-0.04em]">
                  {validationSummary.healthScore}/100
                </strong>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {roleJourneys.map((journey) => (
          <article
            key={journey.title}
            className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <span className="eyebrow text-slate-500">{journey.title}</span>
            <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
              {journey.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{journey.description}</p>
            <Link
              href={journey.href}
              className="mt-5 inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800"
            >
              {journey.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="page-header">
        <div>
          <span className="eyebrow">Briefing pulse</span>
          <h2 className="mt-2 text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
            Fast-read signal board for revenue teams
          </h2>
          <p>
            Start with the briefings and signals that are easiest to use in calls, follow-up notes, and
            internal coaching. The full archive stays below when you need to go deeper.
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
          <article className="metric-card">
            <span>Data health</span>
            <strong>{validationSummary.healthScore}/100</strong>
          </article>
          <article className="metric-card">
            <span>Active issues</span>
            <strong>{validationSummary.totalIssues}</strong>
          </article>
        </div>
      </section>

      <section id="featured-briefings" className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <article className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow text-slate-500">Featured briefings</span>
              <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">
                Start with the reports most likely to shape the next call
              </h2>
            </div>
            <Link href="/research/competitors" className="text-sm font-semibold text-slate-700">
              Browse all competitors
            </Link>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {featuredReports.map((report) => {
              const reportIssues = getIssuesForReport(context.validation, report.id);

              return (
                <article key={report.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {report.competitor.vendor}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                        {report.competitor.name}
                      </h3>
                    </div>
                    <StatusChip
                      status={
                        context.data.findings.find((finding) => finding.reportId === report.id)?.validationStatus ??
                        "needs_review"
                      }
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{report.summary}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] bg-white p-4 shadow-sm">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Window
                      </div>
                      <div className="mt-2 text-base font-semibold text-slate-950">
                        {report.reportWindowLabel}
                      </div>
                    </div>
                    <div className="rounded-[22px] bg-white p-4 shadow-sm">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Data quality
                      </div>
                      <div className="mt-2 text-base font-semibold text-slate-950">
                        {describeReportQuality(
                          reportIssues.length,
                          reportIssues.some((issue) => issue.severity === "critical")
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/research/reports/${report.id}`}
                      className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open briefing
                    </Link>
                    <Link
                      href={`/research/competitors/${report.competitor.slug}`}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                    >
                      View history
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <div className="grid gap-4">
          <article className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow text-slate-500">Latest signals</span>
                <h2 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-950">
                  What changed most recently
                </h2>
              </div>
              <Link href="/research/findings" className="text-sm font-semibold text-slate-700">
                Open all signals
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {latestSignals.map((finding) => (
                <article key={finding.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">{finding.competitor.name}</div>
                      <h3 className="mt-1 text-base font-semibold leading-6 text-slate-950">
                        {finding.claim}
                      </h3>
                    </div>
                    <StatusChip status={finding.validationStatus} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{finding.whyItMatters}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>{formatDateTime(finding.createdAt)}</span>
                    <span>·</span>
                    <Link href={`/research/reports/${finding.report.id}`}>{finding.report.runId}</Link>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow text-slate-500">Competitor spotlight</span>
                <h2 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-950">
                  Who is showing up in the most recent briefings
                </h2>
              </div>
              <Link href="/research/competitors" className="text-sm font-semibold text-slate-700">
                Open competitor view
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {competitorSpotlights.map((summary) => (
                <article key={summary.competitor.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">{summary.competitor.vendor}</div>
                      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        {summary.competitor.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Findings
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{summary.findings}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>{summary.reports} report{summary.reports === 1 ? "" : "s"}</span>
                    <span>·</span>
                    <span>
                      Latest {summary.latestReport ? formatDate(summary.latestReport.generatedAt) : "not available"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2>Data quality snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Critical issues</dt>
              <dd>{validationSummary.criticalIssues}</dd>
            </div>
            <div>
              <dt>Warning issues</dt>
              <dd>{validationSummary.warningIssues}</dd>
            </div>
            <div>
              <dt>Minor issues</dt>
              <dd>{validationSummary.minorIssues}</dd>
            </div>
            <div>
              <dt>Reports with issues</dt>
              <dd>{validationSummary.reportsWithIssues}</dd>
            </div>
          </dl>
          <p className="subtle">
            Run <code>npm run validate:data</code> locally to print the full validation report and fail
            fast on critical data issues.
          </p>
        </article>

        <article className="detail-panel">
          <h2>Priority issues</h2>
          <DataQualityIssueList
            issues={priorityIssues}
            emptyMessage="No duplicate or missing-reference issues are active in the current dataset."
          />
        </article>
      </section>

      <section id="archive-explorer" className="page-header">
        <div>
          <span className="eyebrow">Archive explorer</span>
          <h2 className="mt-2 text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-[-0.04em] text-slate-950">
            Need more depth? Drop into the full archive.
          </h2>
          <p>
            Use filters, saved views, and table/card mode when a deal needs more history than the curated
            briefing flow above.
          </p>
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
          {reports.map((report) => {
            const reportIssues = getIssuesForReport(context.validation, report.id);
            return (
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
                  <div>
                    <dt>Data quality</dt>
                    <dd>
                      {describeReportQuality(
                        reportIssues.length,
                        reportIssues.some((issue) => issue.severity === "critical")
                      )}
                    </dd>
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
            );
          })}
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
                <th>Data quality</th>
                <th>Artifacts</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const reportIssues = getIssuesForReport(context.validation, report.id);
                return (
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
                      {describeReportQuality(
                        reportIssues.length,
                        reportIssues.some((issue) => issue.severity === "critical")
                      )}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function describeReportQuality(issueCount: number, hasCriticalIssue: boolean): string {
  if (!issueCount) {
    return "Clean";
  }

  if (hasCriticalIssue) {
    return `${issueCount} critical`;
  }

  return `${issueCount} issue${issueCount === 1 ? "" : "s"}`;
}
