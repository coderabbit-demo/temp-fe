export type ValidationStatus =
  | "validated"
  | "partially_validated"
  | "community_signal"
  | "needs_review";

export type ArtifactKind = "pdf" | "png";

export type SourceLevel = 1 | 2 | 3;

export interface Competitor {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  vendor: string;
  category: string;
}

export interface SweepRun {
  id: string;
  label: string;
  sweepDate: string;
  generatedAt: string;
  reportWindowDays: number;
  reportWindowLabel: string;
  notes: string;
}

export interface Artifact {
  id: string;
  reportId: string;
  kind: ArtifactKind;
  title: string;
  relativePath: string;
  mimeType: string;
  createdAt: string;
}

export interface Source {
  id: string;
  reportId: string;
  findingId: string;
  level: SourceLevel;
  title: string;
  url: string;
  publishedAt: string;
  excerpt: string;
  tags: string[];
}

export interface ValidationFlag {
  id: string;
  reportId: string;
  findingId?: string;
  status: ValidationStatus;
  note: string;
}

export interface Finding {
  id: string;
  reportId: string;
  competitorId: string;
  createdAt: string;
  newestSourceDate: string;
  claim: string;
  supportingDetails: string;
  whyItMatters: string;
  codeRabbitComparison: string;
  validationStatus: ValidationStatus;
  sourceIds: string[];
  validationFlagIds: string[];
  tags: string[];
}

export interface ReportSourceCoverage {
  level1: number;
  level2: number;
  level3: number;
}

export interface CompetitorReport {
  id: string;
  competitorId: string;
  runId: string;
  generatedAt: string;
  sweepRunDate: string;
  reportWindowDays: number;
  reportWindowLabel: string;
  findingsCount: number;
  newestFindingDate: string;
  validationCoverage: number;
  latestMovementFound: boolean;
  sourceCoverage: ReportSourceCoverage;
  summary: string;
  artifactIds: string[];
  validationFlagIds: string[];
  tags: string[];
}

export interface SavedView {
  id: string;
  name: string;
  description: string;
  params: Record<string, string>;
}

export interface DashboardData {
  schemaVersion: "competitor-dashboard-v1";
  generatedAt: string;
  lastSeededAt: string;
  competitors: Competitor[];
  sweepRuns: SweepRun[];
  reports: CompetitorReport[];
  findings: Finding[];
  sources: Source[];
  artifacts: Artifact[];
  validationFlags: ValidationFlag[];
  savedViews: SavedView[];
}

export interface DashboardFilters {
  q?: string;
  competitor?: string;
  preset?: string;
  start?: string;
  end?: string;
  sourceLevel?: string;
  validationStatus?: string;
  reportRunId?: string;
  historyBand?: string;
  latestMovement?: string;
  view?: string;
}

export interface ResolvedDateRange {
  label: string;
  start?: string;
  end?: string;
}
