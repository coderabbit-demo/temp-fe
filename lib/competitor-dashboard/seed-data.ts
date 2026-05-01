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

const findingThemes = [
  {
    key: "review-depth",
    claim: "deeper pull-request analysis",
    evidence: "review summaries, inline explanations, and decision support",
    whyItMatters: "showing a stronger quality story during technical evaluations",
    comparison: "CodeRabbit's review depth and precision"
  },
  {
    key: "workflow-automation",
    claim: "workflow automation around triage",
    evidence: "handoff flows, approvals, and repetitive follow-up reduction",
    whyItMatters: "reducing seller and SE prep time before meetings",
    comparison: "CodeRabbit's automation coverage across the PR lifecycle"
  },
  {
    key: "enterprise-governance",
    claim: "enterprise governance controls",
    evidence: "policy enforcement, auditability, and safer rollout posture",
    whyItMatters: "answering buyer concerns from security-minded accounts",
    comparison: "CodeRabbit's enterprise readiness and control surface"
  },
  {
    key: "platform-reach",
    claim: "platform reach beyond the IDE",
    evidence: "PR workflows, shared review surfaces, and team collaboration",
    whyItMatters: "positioning the product for broader go-to-market teams",
    comparison: "CodeRabbit's usefulness outside single-user coding loops"
  },
  {
    key: "evidence-quality",
    claim: "stronger evidence packaging",
    evidence: "release notes, documentation, and proof points buyers can verify",
    whyItMatters: "keeping competitive talk tracks grounded in source-backed proof",
    comparison: "CodeRabbit's validation discipline and source quality"
  },
  {
    key: "adoption-story",
    claim: "team adoption and rollout messaging",
    evidence: "onboarding cues, rollout framing, and change-management language",
    whyItMatters: "helping account teams explain business value faster",
    comparison: "CodeRabbit's path from trial to broader team usage"
  },
  {
    key: "measurement",
    claim: "measurement and reporting hooks",
    evidence: "visibility into outcomes, review coverage, and operational signal",
    whyItMatters: "giving AEs and SEs a more defensible ROI narrative",
    comparison: "CodeRabbit's measurable impact in review workflows"
  },
  {
    key: "developer-experience",
    claim: "developer experience improvements",
    evidence: "faster loops, lower friction, and clearer next-step guidance",
    whyItMatters: "showing practical day-to-day value instead of generic AI claims",
    comparison: "CodeRabbit's ease of adoption in real teams"
  }
] as const;

const levelEvidence = {
  1: {
    label: "official release evidence",
    excerpt: "Official product evidence captured from the vendor-controlled release surface."
  },
  2: {
    label: "documentation and repo evidence",
    excerpt: "Secondary proof captured from documentation or public implementation evidence."
  },
  3: {
    label: "community and operator signal",
    excerpt: "Supplemental community or operator signal that needs stronger confirmation."
  }
} as const;

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
      const reportThemes = [
        pickTheme(runIndex, competitorIndex, 0),
        pickTheme(runIndex, competitorIndex, 1)
      ];

      for (const findingIndex of [0, 1]) {
        const findingId = `${reportId}-finding-${findingIndex + 1}`;
        const validationFlagId = `${findingId}-flag`;
        const sourceIds: string[] = [];
        const findingDate = shiftDate(newestFindingDate, findingIndex);
        const theme = reportThemes[findingIndex];
        const narrative = buildFindingNarrative({
          competitorName: competitor.name,
          competitorShortName: competitor.shortName,
          competitorCategory: competitor.category,
          runLabel: run.label,
          reportWindowLabel: run.reportWindowLabel,
          findingIndex,
          theme
        });

        for (const level of [1, 2, 3] as const) {
          const sourceId = `${findingId}-source-${level}`;
          const evidence = levelEvidence[level];
          sourceIds.push(sourceId);
          sources.push({
            id: sourceId,
            reportId,
            findingId,
            level,
            title: `${competitor.shortName} ${theme.claim} ${evidence.label}`,
            url: `https://example.com/${competitor.slug}/${run.id}/finding-${findingIndex + 1}/level-${level}`,
            publishedAt: shiftDate(findingDate, level),
            excerpt: `${evidence.excerpt} Captured for ${competitor.shortName} during ${run.label}.`,
            tags:
              level === 1
                ? ["official", theme.key]
                : level === 2
                  ? ["docs", theme.key]
                  : ["community", theme.key]
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
          claim: narrative.claim,
          supportingDetails: narrative.supportingDetails,
          whyItMatters: narrative.whyItMatters,
          codeRabbitComparison: narrative.codeRabbitComparison,
          validationStatus: status,
          sourceIds,
          validationFlagIds: [validationFlagId],
          tags: [
            competitor.shortName.toLowerCase(),
            theme.key,
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
        summary: `${competitor.name} snapshot from ${run.label}, focused on ${reportThemes[0].claim} and ${reportThemes[1].claim} with source-backed differentiation for go-to-market teams.`,
        artifactIds: [`${reportId}-pdf`, `${reportId}-png`],
        validationFlagIds: [reportFlagId],
        tags: [
          competitor.shortName.toLowerCase(),
          reportThemes[0].key,
          reportThemes[1].key,
          run.reportWindowLabel.toLowerCase()
        ]
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

function pickTheme(runIndex: number, competitorIndex: number, findingIndex: number) {
  return findingThemes[(runIndex * 3 + competitorIndex + findingIndex) % findingThemes.length];
}

function buildFindingNarrative({
  competitorName,
  competitorShortName,
  competitorCategory,
  runLabel,
  reportWindowLabel,
  findingIndex,
  theme
}: {
  competitorName: string;
  competitorShortName: string;
  competitorCategory: string;
  runLabel: string;
  reportWindowLabel: string;
  findingIndex: number;
  theme: (typeof findingThemes)[number];
}) {
  const audience = findingIndex === 0 ? "SEs" : "AEs and sales leaders";
  const timeLens = findingIndex === 0 ? "current-state competitive prep" : "follow-up messaging";
  const categoryContext = competitorCategory.toLowerCase();

  return {
    claim: `${competitorShortName} emphasized ${theme.claim} in the ${reportWindowLabel.toLowerCase()} captured by ${runLabel}.`,
    supportingDetails: `${competitorName} showed fresh movement around ${theme.evidence} for its ${categoryContext} positioning, giving the seeded archive a concrete signal instead of repeated placeholder copy.`,
    whyItMatters: `${audience} can use this item for ${timeLens}, especially when the buying conversation turns to ${theme.whyItMatters}.`,
    codeRabbitComparison: `CodeRabbit should be compared against ${competitorShortName} on ${theme.comparison}, not just generic AI positioning.`
  };
}
