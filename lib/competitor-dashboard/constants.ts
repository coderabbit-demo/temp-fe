import type { Competitor, SavedView, ValidationStatus } from "@/lib/competitor-dashboard/types";

export const COMPETITORS: Competitor[] = [
  {
    id: "github-copilot",
    slug: "github-copilot",
    name: "GitHub Copilot",
    shortName: "Copilot",
    vendor: "GitHub",
    category: "Code assistant"
  },
  {
    id: "cursor-bugbot",
    slug: "cursor-bugbot",
    name: "Cursor / Bugbot",
    shortName: "Cursor",
    vendor: "Cursor",
    category: "IDE + review workflow"
  },
  {
    id: "qodo",
    slug: "qodo",
    name: "Qodo",
    shortName: "Qodo",
    vendor: "Qodo",
    category: "Code quality"
  },
  {
    id: "greptile",
    slug: "greptile",
    name: "Greptile",
    shortName: "Greptile",
    vendor: "Greptile",
    category: "PR review"
  },
  {
    id: "gemini-code-assist",
    slug: "gemini-code-assist",
    name: "Gemini Code Assist",
    shortName: "Gemini",
    vendor: "Google",
    category: "Code assistant"
  },
  {
    id: "claude-code-anthropic",
    slug: "claude-code-anthropic",
    name: "Claude Code / Anthropic",
    shortName: "Claude Code",
    vendor: "Anthropic",
    category: "Agentic coding"
  },
  {
    id: "cubic",
    slug: "cubic",
    name: "Cubic",
    shortName: "Cubic",
    vendor: "Cubic",
    category: "Developer tooling"
  }
];

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  validated: "Validated",
  partially_validated: "Partially Validated",
  community_signal: "Community Signal",
  needs_review: "Needs Review"
};

export const DATE_PRESETS = [7, 30, 49, 60, 90];

export const HISTORY_BANDS = [
  { value: "0-30", label: "0-30 days" },
  { value: "30-49", label: "30-49 days" },
  { value: "49-90", label: "49-90 days" }
];

export const SAVED_VIEWS: SavedView[] = [
  {
    id: "last-30-days",
    name: "Last 30 days",
    description: "Recent archive view for current competitive movement.",
    params: { preset: "30" }
  },
  {
    id: "30-49-days",
    name: "30-49 days",
    description: "Reports old enough to compare against current claims.",
    params: { historyBand: "30-49" }
  },
  {
    id: "missing-latest-changelog",
    name: "Missing latest changelog",
    description: "Reports that still need official product movement confirmation.",
    params: { latestMovement: "missing" }
  },
  {
    id: "community-signal-only",
    name: "Community-signal only",
    description: "Items that still rely on weaker evidence.",
    params: { validationStatus: "community_signal" }
  }
];

export const LEVEL_LABELS = {
  1: "Level 1",
  2: "Level 2",
  3: "Level 3"
} as const;
