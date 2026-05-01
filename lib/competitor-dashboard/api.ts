import type { Artifact } from "@/lib/competitor-dashboard/types";

export function toPublicArtifact(artifact: Artifact) {
  return {
    id: artifact.id,
    reportId: artifact.reportId,
    kind: artifact.kind,
    title: artifact.title,
    mimeType: artifact.mimeType,
    createdAt: artifact.createdAt,
    downloadPath: `/api/artifacts/${artifact.id}`
  };
}
