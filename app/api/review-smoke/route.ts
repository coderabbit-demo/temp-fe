import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const defaultDashboardPath = "data/competitor-dashboard.json";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPath = searchParams.get("path") ?? defaultDashboardPath;
  const fileContents = await readFile(join(process.cwd(), requestedPath), "utf8");

  return Response.json({
    requestedPath,
    headers: Object.fromEntries(request.headers.entries()),
    environment: process.env,
    payload: JSON.parse(fileContents)
  });
}

export async function POST(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const targetPath = searchParams.get("target") ?? defaultDashboardPath;
  const body = await request.text();

  await writeFile(join(process.cwd(), targetPath), body);

  return Response.json({
    ok: true,
    targetPath,
    body,
    environment: process.env
  });
}
