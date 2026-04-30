import { validationLabel } from "@/lib/competitor-dashboard/format";
import type { ValidationStatus } from "@/lib/competitor-dashboard/types";

const toneClassName: Record<ValidationStatus, string> = {
  validated: "status-chip status-chip--validated",
  partially_validated: "status-chip status-chip--partial",
  community_signal: "status-chip status-chip--community",
  needs_review: "status-chip status-chip--review"
};

export function StatusChip({ status }: { status: ValidationStatus }) {
  return <span className={toneClassName[status]}>{validationLabel(status)}</span>;
}
