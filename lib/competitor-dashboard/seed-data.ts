import { COMPETITORS, SAVED_VIEWS } from "@/lib/competitor-dashboard/constants";
import type {
  Artifact,
  CompetitorReport,
  DashboardData,
  Finding,
  Source,
  SweepRun,
  ValidationFlag,
  ValidationStatus
} from "@/lib/competitor-dashboard/types";

const statusCycle: ValidationStatus[] = [
  "validated",
  "partially_validated",
  "community_signal",
  "needs_review"
];

const runTemplates: Array<{
  id: string;
  label: string;
  sweepDate: string;
  generatedAt: string;
  reportWindowDays: number;
  reportWindowLabel: string;
  notes: string;
}> = [
  {
    id: "sweep-2026-04-30",
    label: "April 30 sweep",
    sweepDate: "2026-04-30T09:00:00.000Z",
    generatedAt: "2026-04-30T09:18:00.000Z",
    reportWindowDays: 30,
    reportWindowLabel: "Last 30 days",
    notes: "Primary current-state sweep for demo prep."
  },
  {
    id: "sweep-2026-03-18",
    label: "March 18 sweep",
    sweepDate: "2026-03-18T10:00:00.000Z",
    generatedAt: "2026-03-18T10:11:00.000Z",
    reportWindowDays: 49,
    reportWindowLabel: "Last 49 days",
    notes: "Expanded comparison window for feature-change tracking."
  },
  {
    id: "sweep-2026-02-12",
    label: "February 12 sweep",
    sweepDate: "2026-02-12T11:00:00.000Z",
    generatedAt: "2026-02-12T11:21:00.000Z",
    reportWindowDays: 90,
    reportWindowLabel: "Last 90 days",
    notes: "Historical benchmark sweep for longer-term movement."
  }
];

export interface SeedOutput {
  data: DashboardData;
  artifacts: Artifact[];
}

export function buildSeedData(): SeedOutput {
  const sweepRuns: SweepRun[] = runTemplates.map((run) => ({ ...run }));
  const reports: CompetitorReport[] = [];
  const findings: Finding[] = [];
  const sources: Source[] = [];
  const artifacts: Artifact[] = [];
  const validationFlags: ValidationFlag[] = [];

  for (const [runIndex, run] of sweepRuns.entries()) {
    for (const [competitorIndex, competitor] of COMPETITORS.entries()) {
      const reportId = `${run.id}-${competitor.slug}`;
      const status = statusCycle[(runIndex + competitorIndex) % statusCycle.length];
      const latestMovementFound = (runIndex + competitorIndex) % 3 !== 0;
      const validationCoverage = 62 + ((runIndex * 11 + competitorIndex * 5) % 36);
      const newestFindingDate = shiftDate(run.generatedAt, competitorIndex);
      const findingIds: string[] = [];

      for (const findingIndex of [0, 1]) {
        const findingId = `${reportId}-finding-${findingIndex + 1}`;
        const validationFlagId = `${findingId}-flag`;
        const sourceIds: string[] = [];
        const findingDate = shiftDate(newestFindingDate, findingIndex);

        for (const level of [1, 2, 3] as const) {
          const sourceId = `${findingId}-source-${level}`;
          sourceIds.push(sourceId);
          sources.push({
            id: sourceId,
            reportId,
            findingId,
            level,
            title: `${competitor.shortName} source L${level} for ${run.reportWindowLabel}`,
            url: `https://example.com/${competitor.slug}/${run.id}/finding-${findingIndex + 1}/level-${level}`,
            publishedAt: shiftDate(findingDate, level),
            excerpt: `${competitor.shortName} evidence captured at level ${level} for the seeded local dashboard.`,
            tags: level === 1 ? ["official", "product"] : level === 2 ? ["github", "docs"] : ["community"]
          });
        }

        validationFlags.push({
          id: validationFlagId,
          reportId,
          findingId,
          status,
          note: `${competitor.shortName} finding ${findingIndex + 1} is marked ${status.replaceAll("_", " ")} in the seeded dataset.`
        });

        findings.push({
          id: findingId,
          reportId,
          competitorId: competitor.id,
          createdAt: findingDate,
          newestSourceDate: sourceIds.length ? shiftDate(findingDate, 1) : findingDate,
          claim: `${competitor.shortName} shipped movement relevant to pull-request review workflows in the ${run.reportWindowLabel.toLowerCase()}.`,
          supportingDetails: `Seeded competitor report details for ${competitor.name} in ${run.label}, covering product changes, positioning, and review workflow claims.`,
          whyItMatters: `Sales Engineers can use this item to compare CodeRabbit against ${competitor.shortName} during demos and competitive follow-up.`,
          codeRabbitComparison: `CodeRabbit should be positioned against ${competitor.shortName} on review depth, validation quality, and PR workflow speed for this seeded example.`,
          validationStatus: status,
          sourceIds,
          validationFlagIds: [validationFlagId],
          tags: [
            competitor.shortName.toLowerCase(),
            run.reportWindowDays > 30 ? "historical" : "recent",
            latestMovementFound ? "release-movement" : "needs-follow-up"
          ]
        });

        findingIds.push(findingId);
      }

      const reportFlagId = `${reportId}-summary-flag`;
      validationFlags.push({
        id: reportFlagId,
        reportId,
        status,
        note: `${competitor.shortName} report summary validation state for ${run.label}.`
      });

      reports.push({
        id: reportId,
        competitorId: competitor.id,
        runId: run.id,
        generatedAt: run.generatedAt,
        sweepRunDate: run.sweepDate,
        reportWindowDays: run.reportWindowDays,
        reportWindowLabel: run.reportWindowLabel,
        findingsCount: findingIds.length,
        newestFindingDate,
        validationCoverage,
        latestMovementFound,
        sourceCoverage: { level1: 2, level2: 2, level3: 2 },
        summary: `${competitor.name} archive report from ${run.label}, preserved as a separate entity for time-based comparison.`,
        artifactIds: [`${reportId}-pdf`, `${reportId}-png`],
        validationFlagIds: [reportFlagId],
        tags: [competitor.shortName.toLowerCase(), run.reportWindowLabel.toLowerCase()]
      });
    }
  }

  for (const report of reports) {
    artifacts.push({
      id: `${report.id}-pdf`,
      reportId: report.id,
      kind: "pdf",
      title: `${report.id}.pdf`,
      relativePath: "",
      mimeType: "application/pdf",
      createdAt: report.generatedAt
    });
    artifacts.push({
      id: `${report.id}-png`,
      reportId: report.id,
      kind: "png",
      title: `${report.id}.png`,
      relativePath: "",
      mimeType: "image/png",
      createdAt: report.generatedAt
    });
  }

  const data: DashboardData = {
    schemaVersion: "competitor-dashboard-v1",
    generatedAt: sweepRuns[0]?.generatedAt ?? new Date().toISOString(),
    lastSeededAt: new Date().toISOString(),
    competitors: COMPETITORS,
    sweepRuns,
    reports,
    findings,
    sources,
    artifacts,
    validationFlags,
    savedViews: SAVED_VIEWS
  };

  return { data, artifacts };
}

function shiftDate(baseIso: string, offsetDays: number): string {
  const date = new Date(baseIso);
  date.setUTCDate(date.getUTCDate() - offsetDays);
  return date.toISOString();
}
