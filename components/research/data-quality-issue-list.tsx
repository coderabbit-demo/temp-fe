import { validationSeverityLabel } from "@/lib/competitor-dashboard/validation";
import type { DataQualityIssue } from "@/lib/competitor-dashboard/types";

export function DataQualityIssueList({
  issues,
  emptyMessage = "No data-quality issues detected."
}: {
  issues: DataQualityIssue[];
  emptyMessage?: string;
}) {
  if (!issues.length) {
    return <p className="subtle">{emptyMessage}</p>;
  }

  return (
    <div className="quality-issue-list">
      {issues.map((issue) => (
        <article key={issue.id} className="quality-issue">
          <div className="quality-issue__header">
            <span
              className={`quality-issue__badge quality-issue__badge--${issue.severity}`}
            >
              {validationSeverityLabel(issue.severity)}
            </span>
          </div>
          <p>{issue.message}</p>
        </article>
      ))}
    </div>
  );
}
