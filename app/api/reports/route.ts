import { toPublicArtifact } from "@/lib/competitor-dashboard/api";
import { buildReportRows, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export async function GET(request: Request) {
  const context = await getDashboardContext(new URL(request.url).searchParams);

  if (!context) {
    return Response.json({ reports: [], error: "No local dashboard data found. Run npm run seed." });
  }

  return Response.json({
    reports: buildReportRows(context).map((report) => ({
      ...report,
      artifacts: report.artifacts.map(toPublicArtifact)
    })),
    lastSeededAt: context.data.lastSeededAt
  });
}
