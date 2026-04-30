import fs from "node:fs/promises";

import {
  artifactRootPath,
  dataFilePath,
  toRepoRelative
} from "@/lib/competitor-dashboard/paths";
import { loadDashboardData } from "@/lib/competitor-dashboard/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [data, artifactStat] = await Promise.all([
    loadDashboardData(),
    fs
      .stat(artifactRootPath())
      .then(() => true)
      .catch(() => false)
  ]);
  const ok = Boolean(data) && artifactStat;

  return Response.json(
    {
      ok,
      dataFile: toRepoRelative(dataFilePath()),
      artifactRoot: toRepoRelative(artifactRootPath()),
      hasSeedData: Boolean(data),
      artifactRootExists: artifactStat,
      lastSeededAt: data?.lastSeededAt ?? null
    },
    {
      status: ok ? 200 : 503
    }
  );
}
