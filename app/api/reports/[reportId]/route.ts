import { toPublicArtifact } from "@/lib/competitor-dashboard/api";
import { getDashboardContext, getReportDetail } from "@/lib/competitor-dashboard/queries";

export async function GET(
  _request: Request,
  { params }: { params: { reportId: string } }
) {
  const context = await getDashboardContext({});
  if (!context) {
    return Response.json(
      { error: "No local dashboard data found. Run npm run seed." },
      { status: 404 }
    );
  }

  const detail = getReportDetail(context, params.reportId);
  if (!detail) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  return Response.json({
    ...detail,
    artifacts: detail.artifacts.map(toPublicArtifact)
  });
}
