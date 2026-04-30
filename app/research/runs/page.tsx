import { EmptyState } from "@/components/research/empty-state";
import { formatDateTime } from "@/lib/competitor-dashboard/format";
import { buildRunsSummary, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const context = await getDashboardContext({});
  if (!context) {
    return (
      <div className="page">
        <EmptyState
          title="No sweep runs found"
          description="Run npm run seed to generate local sweep runs and competitor reports."
        />
      </div>
    );
  }

  const runs = buildRunsSummary(context);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Runs</span>
          <h1>Sweep runs</h1>
          <p>One sweep run produces multiple competitor-specific report records that remain preserved over time.</p>
        </div>
      </section>

      <section className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Generated</th>
              <th>Window</th>
              <th>Reports</th>
              <th>Findings</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>{formatDateTime(run.generatedAt)}</td>
                <td>{run.reportWindowLabel}</td>
                <td>{run.reportCount}</td>
                <td>{run.findingsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
