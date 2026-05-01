import fs from "node:fs/promises";
import path from "node:path";

import { writeReportArtifacts } from "@/lib/competitor-dashboard/artifacts";
import { artifactRootPath } from "@/lib/competitor-dashboard/paths";
import { buildSeedData } from "@/lib/competitor-dashboard/seed-data";
import { saveDashboardData } from "@/lib/competitor-dashboard/store";
import { validateDashboardData } from "@/lib/competitor-dashboard/validation";

async function main() {
  console.log("[seed] building competitor dashboard demo data");

  const seed = buildSeedData();
  const artifactRoot = artifactRootPath();

  await fs.mkdir(artifactRoot, { recursive: true });

  for (const report of seed.data.reports) {
    const competitor = seed.data.competitors.find((candidate) => candidate.id === report.competitorId);
    const run = seed.data.sweepRuns.find((candidate) => candidate.id === report.runId);
    const findings = seed.data.findings.filter((finding) => finding.reportId === report.id);
    const artifactPdf = seed.artifacts.find((artifact) => artifact.id === `${report.id}-pdf`);
    const artifactPng = seed.artifacts.find((artifact) => artifact.id === `${report.id}-png`);

    if (!competitor || !run || !artifactPdf || !artifactPng) {
      throw new Error(`Seed artifact inputs missing for report ${report.id}`);
    }

    const { pdfRelativePath, pngRelativePath } = await writeReportArtifacts({
      artifactPdf,
      artifactPng,
      competitor,
      report,
      run,
      findings
    });

    artifactPdf.relativePath = pdfRelativePath;
    artifactPng.relativePath = pngRelativePath;
  }

  await saveDashboardData(seed.data);
  const validation = validateDashboardData(seed.data);

  console.log("[seed] wrote data file and artifacts");
  console.log(`[seed] data file contains ${seed.data.reports.length} reports`);
  console.log(`[seed] findings: ${seed.data.findings.length}`);
  console.log(`[seed] artifacts: ${seed.data.artifacts.length}`);
  console.log(
    `[seed] data quality: ${validation.summary.healthScore}/100 (${validation.summary.totalIssues} issues)`
  );
  console.log(
    `[seed] artifact root: ${path.relative(process.cwd(), artifactRoot).split(path.sep).join("/")}`
  );
}

main().catch((error) => {
  console.error("[seed] failed:", error);
  process.exitCode = 1;
});
