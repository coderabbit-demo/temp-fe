import { DATE_PRESETS } from "@/lib/competitor-dashboard/constants";
import type { DashboardFilters, ResolvedDateRange } from "@/lib/competitor-dashboard/types";

export function normalizeFilters(
  searchParams:
    | URLSearchParams
    | DashboardFilters
    | Record<string, string | string[] | undefined>
    | Readonly<Record<string, string | undefined>>
): DashboardFilters {
  const getValue = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }

    const value = (searchParams as Record<string, string | string[] | undefined>)[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    q: getValue("q")?.trim() || undefined,
    competitor: getValue("competitor") || undefined,
    preset: getValue("preset") || undefined,
    start: getValue("start") || undefined,
    end: getValue("end") || undefined,
    sourceLevel: getValue("sourceLevel") || undefined,
    validationStatus: getValue("validationStatus") || undefined,
    reportRunId: getValue("reportRunId") || undefined,
    historyBand: getValue("historyBand") || undefined,
    latestMovement: getValue("latestMovement") || undefined,
    view: getValue("view") || undefined
  };
}

export function filtersToSearchParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export function resolveDateRange(
  filters: DashboardFilters,
  referenceIso: string
): ResolvedDateRange {
  if (filters.start || filters.end) {
    return {
      label: "Custom range",
      start: normalizeDateBoundary(filters.start, "start"),
      end: normalizeDateBoundary(filters.end, "end")
    };
  }

  const presetDays = Number(filters.preset);
  if (DATE_PRESETS.includes(presetDays)) {
    const endDate = new Date(referenceIso);
    const startDate = new Date(referenceIso);
    startDate.setUTCDate(startDate.getUTCDate() - presetDays);
    return {
      label: `Last ${presetDays} days`,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }

  return { label: "All time" };
}

function normalizeDateBoundary(
  value: string | undefined,
  boundary: "start" | "end"
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return boundary === "start"
      ? `${value}T00:00:00.000Z`
      : `${value}T23:59:59.999Z`;
  }

  return value;
}

export function historyBandMatches(historyBand: string | undefined, ageInDays: number): boolean {
  if (!historyBand) {
    return true;
  }

  if (historyBand === "0-30") {
    return ageInDays >= 0 && ageInDays <= 30;
  }

  if (historyBand === "30-49") {
    return ageInDays > 30 && ageInDays <= 49;
  }

  if (historyBand === "49-90") {
    return ageInDays > 49 && ageInDays <= 90;
  }

  return true;
}
