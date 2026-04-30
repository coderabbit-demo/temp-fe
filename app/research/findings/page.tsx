import Link from "next/link";

import { EmptyState } from "@/components/research/empty-state";
import { FilterForm } from "@/components/research/filter-form";
import { StatusChip } from "@/components/research/status-chip";
import { formatDateTime } from "@/lib/competitor-dashboard/format";
import { buildFindings, buildRunsSummary, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export default async function FindingsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const context = await getDashboardContext(searchParams);
  if (!context) {
    return (
      <div className="page">
        <EmptyState title="No findings available" description="Run npm run seed to populate local demo data." />
      </div>
    );
  }

  const findings = buildFindings(context);
  const runs = buildRunsSummary(context);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Findings</span>
          <h1>Finding log</h1>
          <p>Search across findings, compare validation state, and jump into detailed competitor reports.</p>
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
        showViewToggle={false}
      />

      <section className="stack">
        {findings.map((finding) => (
          <article key={finding.id} className="finding-card">
            <div className="finding-card__header">
              <div>
                <h3>{finding.claim}</h3>
                <p>
                  {finding.competitor.name} · {formatDateTime(finding.createdAt)} ·{" "}
                  <Link href={`/research/reports/${finding.report.id}`}>{finding.report.runId}</Link>
                </p>
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
