import type {
  DashboardData,
  DashboardValidationResult,
  DataQualityIssue,
  DataQualityIssueCode,
  DataQualitySeverity,
  Finding,
  Source
} from "@/lib/competitor-dashboard/types";

const severityOrder: Record<DataQualitySeverity, number> = {
  critical: 0,
  warning: 1,
  minor: 2
};

export function validateDashboardData(data: DashboardData): DashboardValidationResult {
  const issues: DataQualityIssue[] = [];
  let repetitiveClaimGroups = 0;
  let duplicateSourceGroups = 0;

  const competitorIds = new Set(data.competitors.map((competitor) => competitor.id));
  const runIds = new Set(data.sweepRuns.map((run) => run.id));
  const reportIds = new Set(data.reports.map((report) => report.id));
  const findingIds = new Set(data.findings.map((finding) => finding.id));
  const sourceIds = new Set(data.sources.map((source) => source.id));

  for (const report of data.reports) {
    if (!competitorIds.has(report.competitorId)) {
      issues.push(
        createIssue("critical", "missing_competitor_reference", {
          message: `Report ${report.id} references missing competitor ${report.competitorId}.`,
          competitorId: report.competitorId,
          reportId: report.id
        })
      );
    }

    if (!runIds.has(report.runId)) {
      issues.push(
        createIssue("critical", "missing_run_reference", {
          message: `Report ${report.id} references missing run ${report.runId}.`,
          reportId: report.id
        })
      );
    }
  }

  for (const finding of data.findings) {
    if (!reportIds.has(finding.reportId)) {
      issues.push(
        createIssue("critical", "missing_report_reference", {
          message: `Finding ${finding.id} references missing report ${finding.reportId}.`,
          competitorId: finding.competitorId,
          reportId: finding.reportId,
          findingIds: [finding.id]
        })
      );
    }

    if (!competitorIds.has(finding.competitorId)) {
      issues.push(
        createIssue("critical", "missing_competitor_reference", {
          message: `Finding ${finding.id} references missing competitor ${finding.competitorId}.`,
          competitorId: finding.competitorId,
          reportId: finding.reportId,
          findingIds: [finding.id]
        })
      );
    }

    const missingSourceIds = finding.sourceIds.filter((sourceId) => !sourceIds.has(sourceId));
    if (missingSourceIds.length) {
      issues.push(
        createIssue("critical", "missing_source_reference", {
          message: `Finding ${finding.id} is missing ${missingSourceIds.length} linked source reference(s).`,
          competitorId: finding.competitorId,
          reportId: finding.reportId,
          findingIds: [finding.id],
          sourceIds: missingSourceIds
        })
      );
    }
  }

  for (const source of data.sources) {
    if (!reportIds.has(source.reportId)) {
      issues.push(
        createIssue("critical", "missing_report_reference", {
          message: `Source ${source.id} references missing report ${source.reportId}.`,
          reportId: source.reportId,
          sourceIds: [source.id]
        })
      );
    }

    if (!findingIds.has(source.findingId)) {
      issues.push(
        createIssue("critical", "missing_finding_reference", {
          message: `Source ${source.id} references missing finding ${source.findingId}.`,
          reportId: source.reportId,
          findingIds: [source.findingId],
          sourceIds: [source.id]
        })
      );
    }
  }

  for (const report of data.reports) {
    const reportFindings = data.findings.filter((finding) => finding.reportId === report.id);

    repetitiveClaimGroups += addDuplicateFindingIssues(
      issues,
      reportFindings,
      "duplicate_claim_within_report",
      "critical",
      (finding) => normalizeText(finding.claim),
      (count) => `Report ${report.id} repeats the same claim across ${count} findings.`
    );

    addDuplicateFindingIssues(
      issues,
      reportFindings,
      "duplicate_supporting_details_within_report",
      "warning",
      (finding) => normalizeText(finding.supportingDetails),
      (count) => `Report ${report.id} repeats the same supporting detail across ${count} findings.`
    );

    for (const finding of reportFindings) {
      const findingSources = data.sources.filter((source) => source.findingId === finding.id);

      duplicateSourceGroups += addDuplicateSourceIssues(
        issues,
        findingSources,
        "duplicate_source_url_within_finding",
        "critical",
        (source) => normalizeUrl(source.url),
        (count) => `Finding ${finding.id} reuses the same source URL ${count} times.`,
        report.competitorId,
        report.id,
        finding.id
      );

      addDuplicateSourceIssues(
        issues,
        findingSources,
        "duplicate_source_title_within_finding",
        "minor",
        (source) => normalizeText(source.title),
        (count) => `Finding ${finding.id} repeats the same source title ${count} times.`,
        report.competitorId,
        report.id,
        finding.id
      );
    }
  }

  const findingsByCompetitorClaim = groupBy(
    data.findings,
    (finding) => `${finding.competitorId}::${normalizeText(finding.claim)}`
  );

  for (const repeatedFindings of findingsByCompetitorClaim.values()) {
    const distinctReports = new Set(repeatedFindings.map((finding) => finding.reportId));
    if (repeatedFindings.length < 2 || distinctReports.size < 2) {
      continue;
    }

    repetitiveClaimGroups += 1;
    const [firstFinding] = repeatedFindings;
    issues.push(
      createIssue("warning", "repeated_claim_across_history", {
        message: `Competitor history repeats a claim across ${distinctReports.size} reports, which usually indicates stale sweep language.`,
        competitorId: firstFinding.competitorId,
        reportId: firstFinding.reportId,
        findingIds: repeatedFindings.map((finding) => finding.id)
      })
    );
  }

  issues.sort((left, right) => {
    if (severityOrder[left.severity] !== severityOrder[right.severity]) {
      return severityOrder[left.severity] - severityOrder[right.severity];
    }

    return left.message.localeCompare(right.message);
  });

  const reportsWithIssues = new Set(issues.flatMap((issue) => (issue.reportId ? [issue.reportId] : [])));
  const findingsWithIssues = new Set(issues.flatMap((issue) => issue.findingIds ?? []));
  const sourcesWithIssues = new Set(issues.flatMap((issue) => issue.sourceIds ?? []));

  const criticalIssues = issues.filter((issue) => issue.severity === "critical").length;
  const warningIssues = issues.filter((issue) => issue.severity === "warning").length;
  const minorIssues = issues.filter((issue) => issue.severity === "minor").length;

  const healthScore = Math.max(0, 100 - criticalIssues * 22 - warningIssues * 10 - minorIssues * 4);

  return {
    summary: {
      totalIssues: issues.length,
      criticalIssues,
      warningIssues,
      minorIssues,
      reportsWithIssues: reportsWithIssues.size,
      findingsWithIssues: findingsWithIssues.size,
      sourcesWithIssues: sourcesWithIssues.size,
      repetitiveClaimGroups,
      duplicateSourceGroups,
      healthScore
    },
    issues
  };
}

export function getIssuesForReport(
  validation: DashboardValidationResult,
  reportId: string
): DataQualityIssue[] {
  return validation.issues.filter((issue) => issue.reportId === reportId);
}

export function getIssuesForFinding(
  validation: DashboardValidationResult,
  findingId: string
): DataQualityIssue[] {
  return validation.issues.filter((issue) => issue.findingIds?.includes(findingId));
}

export function validationSeverityLabel(severity: DataQualitySeverity): string {
  if (severity === "critical") {
    return "Critical";
  }

  if (severity === "warning") {
    return "Warning";
  }

  return "Minor";
}

function addDuplicateFindingIssues(
  issues: DataQualityIssue[],
  findings: Finding[],
  code: DataQualityIssueCode,
  severity: DataQualitySeverity,
  keyFn: (finding: Finding) => string,
  messageFn: (count: number) => string
): number {
  let duplicateGroups = 0;

  for (const duplicates of groupBy(findings, keyFn).values()) {
    if (duplicates.length < 2) {
      continue;
    }

    duplicateGroups += 1;
    const [firstFinding] = duplicates;
    issues.push(
      createIssue(severity, code, {
        message: messageFn(duplicates.length),
        competitorId: firstFinding.competitorId,
        reportId: firstFinding.reportId,
        findingIds: duplicates.map((finding) => finding.id)
      })
    );
  }

  return duplicateGroups;
}

function addDuplicateSourceIssues(
  issues: DataQualityIssue[],
  sources: Source[],
  code: DataQualityIssueCode,
  severity: DataQualitySeverity,
  keyFn: (source: Source) => string,
  messageFn: (count: number) => string,
  competitorId: string,
  reportId: string,
  findingId: string
): number {
  let duplicateGroups = 0;

  for (const duplicates of groupBy(sources, keyFn).values()) {
    if (duplicates.length < 2) {
      continue;
    }

    duplicateGroups += 1;
    issues.push(
      createIssue(severity, code, {
        message: messageFn(duplicates.length),
        competitorId,
        reportId,
        findingIds: [findingId],
        sourceIds: duplicates.map((source) => source.id)
      })
    );
  }

  return duplicateGroups;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    if (!key) {
      continue;
    }

    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }

  return groups;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host.toLowerCase()}${pathname}${url.search}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function createIssue(
  severity: DataQualitySeverity,
  code: DataQualityIssueCode,
  issue: Omit<DataQualityIssue, "id" | "severity" | "code">
): DataQualityIssue {
  const slug = issue.message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);

  return {
    id: `${code}-${slug}`,
    severity,
    code,
    ...issue
  };
}
