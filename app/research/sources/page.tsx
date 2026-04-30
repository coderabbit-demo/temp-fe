import { EmptyState } from "@/components/research/empty-state";
import { FilterForm } from "@/components/research/filter-form";
import { formatDateTime } from "@/lib/competitor-dashboard/format";
import { buildRunsSummary, buildSources, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export default async function SourcesPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const context = await getDashboardContext(searchParams);
  if (!context) {
    return (
      <div className="page">
        <EmptyState title="No sources available" description="Run npm run seed to generate local source records." />
      </div>
    );
  }

  const sources = buildSources(context);
  const runs = buildRunsSummary(context);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Sources</span>
          <h1>Source ledger</h1>
          <p>Filter the evidence ledger by competitor, validation state, source level, and time window.</p>
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

      <section className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Competitor</th>
              <th>Level</th>
              <th>Published</th>
              <th>Run</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                  <div className="subtle">{source.excerpt}</div>
                </td>
                <td>{source.competitor.name}</td>
                <td>Level {source.level}</td>
                <td>{formatDateTime(source.publishedAt)}</td>
                <td>{source.report.runId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
