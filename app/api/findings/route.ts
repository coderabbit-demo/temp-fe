import { buildFindings, getDashboardContext } from "@/lib/competitor-dashboard/queries";

export async function GET(request: Request) {
  const context = await getDashboardContext(new URL(request.url).searchParams);

  if (!context) {
    return Response.json({ findings: [], error: "No local dashboard data found. Run npm run seed." });
  }

  return Response.json({
    findings: buildFindings(context),
    lastSeededAt: context.data.lastSeededAt
  });
}
