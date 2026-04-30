import { VALIDATION_STATUS_LABELS } from "@/lib/competitor-dashboard/constants";
import type { ValidationStatus } from "@/lib/competitor-dashboard/types";

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC"
});

export function formatDate(value?: string): string {
  if (!value) {
    return "Not available";
  }

  return shortDateFormatter.format(new Date(value));
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return "Not available";
  }

  return `${longDateFormatter.format(new Date(value))} UTC`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function validationLabel(status: ValidationStatus): string {
  return VALIDATION_STATUS_LABELS[status];
}

export function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
