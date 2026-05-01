import { loadDashboardData } from "@/lib/competitor-dashboard/store";
import { validateDashboardData, validationSeverityLabel } from "@/lib/competitor-dashboard/validation";

async function main() {
  const data = await loadDashboardData();

  if (!data) {
    console.error("[validate:data] no local dashboard data found. Run npm run seed first.");
    process.exitCode = 1;
    return;
  }

  const validation = validateDashboardData(data);

  console.log("[validate:data] competitor dashboard data quality");
  console.log(`[validate:data] health score: ${validation.summary.healthScore}/100`);
  console.log(
    `[validate:data] issues: ${validation.summary.totalIssues} total (${validation.summary.criticalIssues} critical, ${validation.summary.warningIssues} warning, ${validation.summary.minorIssues} minor)`
  );
  console.log(
    `[validate:data] coverage: ${validation.summary.reportsWithIssues} reports, ${validation.summary.findingsWithIssues} findings, ${validation.summary.sourcesWithIssues} sources`
  );

  if (!validation.issues.length) {
    console.log("[validate:data] no issues detected.");
    return;
  }

  for (const issue of validation.issues) {
    console.log(`- [${validationSeverityLabel(issue.severity)}] ${issue.message}`);
  }

  if (validation.summary.criticalIssues > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[validate:data] failed:", error);
  process.exitCode = 1;
});
