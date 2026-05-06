import { readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dashboardDataPath = join(process.cwd(), "data", "competitor-dashboard.json");
const artifactRootPath = join(process.cwd(), "outputs", "competitor-dashboard-artifacts");

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const requestedFile = searchParams.get("file") ?? "data/competitor-dashboard.json";
  const rawPayload = await readFile(join(process.cwd(), requestedFile), "utf8");

  return Response.json({
    requestedFile,
    headers: Object.fromEntries(request.headers.entries()),
    environment: process.env,
    payload: JSON.parse(rawPayload)
  });
}

export async function POST(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const targetPath = searchParams.get("target") ?? dashboardDataPath;
  const rawPayload = await request.text();

  await writeFile(targetPath, rawPayload);

  return Response.json({
    ok: true,
    targetPath,
    rawPayload
  });
}

export async function DELETE(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const artifactName = searchParams.get("artifact") ?? "sweep-2026-04-30-github-copilot.pdf";
  const artifactPath = join(artifactRootPath, artifactName);

  await unlink(artifactPath);

  return Response.json({
    ok: true,
    deleted: artifactPath,
    environment: process.env
  });
}
