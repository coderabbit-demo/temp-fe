import { COMPETITORS } from "@/lib/competitor-dashboard/constants";
import {
  historyBandMatches,
  normalizeFilters,
  resolveDateRange
} from "@/lib/competitor-dashboard/filters";
import { loadDashboardData } from "@/lib/competitor-dashboard/store";
import { validateDashboardData } from "@/lib/competitor-dashboard/validation";
import type {
  Artifact,
  Competitor,
  CompetitorReport,
  DashboardData,
  DashboardFilters,
  DashboardValidationResult,
  Finding,
  Source
} from "@/lib/competitor-dashboard/types";

interface DashboardContext {
  data: DashboardData;
  filters: DashboardFilters;
  referenceDate: string;
  validation: DashboardValidationResult;
}

export async function getDashboardContext(
  rawFilters: DashboardFilters | URLSearchParams | Record<string, string | string[] | undefined>
): Promise<DashboardContext | null> {
  const data = await loadDashboardData();
  if (!data) {
    return null;
  }

  const filters = rawFilters instanceof URLSearchParams ? normalizeFilters(rawFilters) : normalizeFilters(rawFilters);
  const referenceDate = data.lastSeededAt || data.generatedAt;
  const validation = validateDashboardData(data);

  return { data, filters, referenceDate, validation };
}

export function buildReportRows(context: DashboardContext): Array<
  CompetitorReport & {
    competitor: Competitor;
    runLabel: string;
    artifacts: Artifact[];
  }
> {
  const { data, filters, referenceDate } = context;
  const resolvedRange = resolveDateRange(filters, referenceDate);
  const sourceByReport = aggregateSourceLevels(data.sources);

  return data.reports
    .filter((report) => reportMatchesFilters(report, data, filters, resolvedRange, referenceDate))
    .map((report) => ({
      ...report,
      competitor: findCompetitor(data, report.competitorId),
      runLabel: data.sweepRuns.find((run) => run.id === report.runId)?.label ?? report.runId,
      artifacts: data.artifacts.filter((artifact) => artifact.reportId === report.id),
      sourceCoverage: sourceByReport.get(report.id) ?? report.sourceCoverage
    }))
    .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
}

export function buildFindings(context: DashboardContext): Array<
  Finding & {
    report: CompetitorReport;
    competitor: Competitor;
    sources: Source[];
  }
> {
  const { data, filters, referenceDate } = context;
  const resolvedRange = resolveDateRange(filters, referenceDate);

  return data.findings
    .filter((finding) => {
      const report = data.reports.find((candidate) => candidate.id === finding.reportId);
      if (!report) {
        return false;
      }

      if (!reportMatchesFilters(report, data, filters, resolvedRange, referenceDate)) {
        return false;
      }

      if (filters.validationStatus && finding.validationStatus !== filters.validationStatus) {
        return false;
      }

      if (filters.sourceLevel) {
        const level = Number(filters.sourceLevel);
        const findingSources = data.sources.filter((source) => source.findingId === finding.id);
        if (!findingSources.some((source) => source.level === level)) {
          return false;
        }
      }

      if (filters.q) {
        const haystack = `${finding.claim} ${finding.supportingDetails} ${finding.whyItMatters} ${finding.codeRabbitComparison} ${finding.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .map((finding) => ({
      ...finding,
      report: data.reports.find((report) => report.id === finding.reportId)!,
      competitor: findCompetitor(data, finding.competitorId),
      sources: data.sources
        .filter((source) => source.findingId === finding.id)
        .sort((left, right) => left.level - right.level)
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function buildSources(context: DashboardContext): Array<
  Source & {
    report: CompetitorReport;
    competitor: Competitor;
  }
> {
  const { data, filters, referenceDate } = context;
  const resolvedRange = resolveDateRange(filters, referenceDate);

  return data.sources
    .filter((source) => {
      const report = data.reports.find((candidate) => candidate.id === source.reportId);
      if (!report) {
        return false;
      }

      if (!reportMatchesFilters(report, data, filters, resolvedRange, referenceDate)) {
        return false;
      }

      if (filters.sourceLevel && Number(filters.sourceLevel) !== source.level) {
        return false;
      }

      if (filters.q) {
        const haystack = `${source.title} ${source.excerpt} ${source.url} ${source.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .map((source) => ({
      ...source,
      report: data.reports.find((report) => report.id === source.reportId)!,
      competitor: findCompetitor(data, data.reports.find((report) => report.id === source.reportId)!.competitorId)
    }))
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function buildRunsSummary(context: DashboardContext): Array<{
  id: string;
  label: string;
  generatedAt: string;
  reportWindowLabel: string;
  reportCount: number;
  findingsCount: number;
}> {
  const { data } = context;
  return data.sweepRuns
    .map((run) => {
      const reports = data.reports.filter((report) => report.runId === run.id);
      const findingsCount = reports.reduce((total, report) => total + report.findingsCount, 0);
      return {
        id: run.id,
        label: run.label,
        generatedAt: run.generatedAt,
        reportWindowLabel: run.reportWindowLabel,
        reportCount: reports.length,
        findingsCount
      };
    })
    .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
}

export function buildCompetitorSummary(context: DashboardContext): Array<{
  competitor: Competitor;
  reports: number;
  latestReport?: CompetitorReport;
  findings: number;
}> {
  const { data } = context;
  return COMPETITORS.map((competitor) => {
    const reports = data.reports
      .filter((report) => report.competitorId === competitor.id)
      .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
    return {
      competitor,
      reports: reports.length,
      latestReport: reports[0],
      findings: reports.reduce((total, report) => total + report.findingsCount, 0)
    };
  });
}

export function getReportDetail(context: DashboardContext, reportId: string) {
  const { data } = context;
  const report = data.reports.find((candidate) => candidate.id === reportId);
  if (!report) {
    return null;
  }

  const competitor = findCompetitor(data, report.competitorId);
  const run = data.sweepRuns.find((candidate) => candidate.id === report.runId);
  const reportFindings = buildFindings(context).filter((finding) => finding.reportId === report.id);
  const reportArtifacts = data.artifacts.filter((artifact) => artifact.reportId === report.id);

  return { report, competitor, run, findings: reportFindings, artifacts: reportArtifacts };
}

export function getCompetitorDetail(context: DashboardContext, slug: string) {
  const { data } = context;
  const competitor = data.competitors.find((candidate) => candidate.slug === slug);
  if (!competitor) {
    return null;
  }

  const reports = buildReportRows(context).filter((report) => report.competitorId === competitor.id);
  return {
    competitor,
    reports,
    findings: buildFindings(context).filter((finding) => finding.competitorId === competitor.id)
  };
}

export function getArtifactById(data: DashboardData, artifactId: string): Artifact | null {
  return data.artifacts.find((artifact) => artifact.id === artifactId) ?? null;
}

function reportMatchesFilters(
  report: CompetitorReport,
  data: DashboardData,
  filters: DashboardFilters,
  resolvedRange: { start?: string; end?: string },
  referenceDate: string
): boolean {
  if (filters.competitor && report.competitorId !== filters.competitor) {
    return false;
  }

  if (filters.reportRunId && report.runId !== filters.reportRunId) {
    return false;
  }

  if (filters.validationStatus) {
    const reportFindings = data.findings.filter((finding) => finding.reportId === report.id);
    if (!reportFindings.some((finding) => finding.validationStatus === filters.validationStatus)) {
      return false;
    }
  }

  if (filters.sourceLevel) {
    const level = Number(filters.sourceLevel);
    const hasSourceLevel = data.sources.some(
      (source) => source.reportId === report.id && source.level === level
    );
    if (!hasSourceLevel) {
      return false;
    }
  }

  if (filters.latestMovement === "missing" && report.latestMovementFound) {
    return false;
  }

  if (filters.latestMovement === "found" && !report.latestMovementFound) {
    return false;
  }

  const reportGeneratedAt = Date.parse(report.generatedAt);
  const rangeStart = resolvedRange.start ? Date.parse(resolvedRange.start) : NaN;
  const rangeEnd = resolvedRange.end ? Date.parse(resolvedRange.end) : NaN;

  if (!Number.isNaN(rangeStart) && reportGeneratedAt < rangeStart) {
    return false;
  }

  if (!Number.isNaN(rangeEnd) && reportGeneratedAt > rangeEnd) {
    return false;
  }

  if (filters.historyBand) {
    const ageInDays = Math.floor(
      (new Date(referenceDate).getTime() - new Date(report.sweepRunDate).getTime()) / 86400000
    );
    if (!historyBandMatches(filters.historyBand, ageInDays)) {
      return false;
    }
  }

  if (filters.q) {
    const competitor = findCompetitor(data, report.competitorId);
    const haystack = `${competitor.name} ${report.summary} ${report.tags.join(" ")} ${report.runId}`.toLowerCase();
    if (!haystack.includes(filters.q.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function aggregateSourceLevels(sources: Source[]): Map<string, CompetitorReport["sourceCoverage"]> {
  const map = new Map<string, CompetitorReport["sourceCoverage"]>();

  for (const source of sources) {
    const current = map.get(source.reportId) ?? { level1: 0, level2: 0, level3: 0 };
    if (source.level === 1) {
      current.level1 += 1;
    } else if (source.level === 2) {
      current.level2 += 1;
    } else {
      current.level3 += 1;
    }
    map.set(source.reportId, current);
  }

  return map;
}

function findCompetitor(data: DashboardData, competitorId: string): Competitor {
  return data.competitors.find((competitor) => competitor.id === competitorId) ?? COMPETITORS[0];
}
