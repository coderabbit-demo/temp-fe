import { EmptyState } from "@/components/research/empty-state";
import { formatDateTime } from "@/lib/competitor-dashboard/format";
import { getDashboardContext } from "@/lib/competitor-dashboard/queries";

export default async function SettingsPage() {
  const context = await getDashboardContext({});
  if (!context) {
    return (
      <div className="page">
        <EmptyState title="Dashboard setup not complete" description="Run npm run seed to create the local archive." />
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <span className="eyebrow">Settings and docs</span>
          <h1>Access, purpose, and local operations</h1>
          <p>Everything needed to run the local dashboard, understand its purpose, and keep the seeded archive current.</p>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2>Access and purpose</h2>
          <ul className="detail-bullets">
            <li>Run `npm install`, then `npm run seed`, then `npm run dev` from the repo root.</li>
            <li>Open `/research/dashboard` for the archive home and `/research/settings` for operator notes.</li>
            <li>The dashboard preserves separate competitor report entities across sweep runs instead of merging them.</li>
            <li>Last seeded at: {formatDateTime(context.data.lastSeededAt)}</li>
          </ul>
        </article>

        <article className="detail-panel">
          <h2>SE use cases</h2>
          <ul className="detail-bullets">
            <li>Prep demos by pulling the newest validated competitor movement before a call.</li>
            <li>Compare multiple runs for the same competitor to spot repeated claims or product shifts.</li>
            <li>Download PDF and PNG artifacts for fast internal briefing or call prep.</li>
            <li>Use findings and source filters to isolate official evidence or community-signal gaps.</li>
          </ul>
        </article>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2>Local commands</h2>
          <pre className="code-block">{`npm install\nnpm run seed\nnpm run dev\nnpm run build`}</pre>
        </article>

        <article className="detail-panel">
          <h2>Docs</h2>
          <pre className="code-block">{`README.md\ndocs/competitor_research_dashboard.md\ndocs/migration-notes.md`}</pre>
        </article>
      </section>
    </div>
  );
}
