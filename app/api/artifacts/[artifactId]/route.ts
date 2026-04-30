import fs from "node:fs/promises";

import { resolveFromRepo } from "@/lib/competitor-dashboard/paths";
import { getArtifactById } from "@/lib/competitor-dashboard/queries";
import { loadDashboardData } from "@/lib/competitor-dashboard/store";

export async function GET(
  _request: Request,
  { params }: { params: { artifactId: string } }
) {
  const data = await loadDashboardData();
  if (!data) {
    return new Response("No local dashboard data found. Run npm run seed.", { status: 404 });
  }

  const artifact = getArtifactById(data, params.artifactId);
  if (!artifact || !artifact.relativePath) {
    return new Response("Artifact not found.", { status: 404 });
  }

  const filePath = resolveFromRepo(artifact.relativePath);

  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": artifact.mimeType,
        "Content-Disposition": `inline; filename="${artifact.title}"`
      }
    });
  } catch {
    return new Response("Artifact file missing.", { status: 404 });
  }
}
