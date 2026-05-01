import fs from "node:fs/promises";

import { artifactRootPath } from "@/lib/competitor-dashboard/paths";
import { loadDashboardData } from "@/lib/competitor-dashboard/store";
import { validateDashboardData } from "@/lib/competitor-dashboard/validation";

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
  const validation = data ? validateDashboardData(data) : null;

  return Response.json(
    {
      ok,
      hasSeedData: Boolean(data),
      artifactRootExists: artifactStat,
      lastSeededAt: data?.lastSeededAt ?? null,
      dataQuality: validation?.summary ?? null
    },
    {
      status: ok ? 200 : 503
    }
  );
}
