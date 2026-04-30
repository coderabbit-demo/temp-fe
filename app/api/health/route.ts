import fs from "node:fs/promises";

import { artifactRootPath, dataFilePath } from "@/lib/competitor-dashboard/paths";
import { loadDashboardData } from "@/lib/competitor-dashboard/store";

export async function GET() {
  const [data, artifactStat] = await Promise.all([
    loadDashboardData(),
    fs
      .stat(artifactRootPath())
      .then(() => true)
      .catch(() => false)
  ]);

  return Response.json({
    ok: true,
    dataFile: dataFilePath(),
    artifactRoot: artifactRootPath(),
    hasSeedData: Boolean(data),
    artifactRootExists: artifactStat,
    lastSeededAt: data?.lastSeededAt ?? null
  });
}
