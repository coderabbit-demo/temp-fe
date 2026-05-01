import { GET as artifactGet } from "@/app/api/artifacts/[artifactId]/route";
import { GET as findingsGet } from "@/app/api/findings/route";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as reportDetailGet } from "@/app/api/reports/[reportId]/route";
import { GET as reportsGet } from "@/app/api/reports/route";
import { GET as sourcesGet } from "@/app/api/sources/route";
import { loadDashboardData } from "@/lib/competitor-dashboard/store";

async function main() {
  const data = await loadDashboardData();
  assert(data, "No local dashboard data found. Run npm run seed first.");

  const reportId = data.reports[0]?.id;
  const artifactId = data.artifacts[0]?.id;

  assert(reportId, "Seeded data must include at least one report.");
  assert(artifactId, "Seeded data must include at least one artifact.");

  const health = await readJson(await healthGet());
  assert(health.response.status === 200, "Health endpoint should be ready after seeding.");
  assertNoForbiddenKeys(health.body, "health");
  assertAllowedKeys(
    health.body,
    ["ok", "hasSeedData", "artifactRootExists", "lastSeededAt", "dataQuality"],
    "health"
  );

  const reports = await readJson(await reportsGet(new Request("http://localhost/api/reports")));
  assert(reports.response.status === 200, "Reports endpoint should return 200.");
  assert(
    Array.isArray(reports.body.reports) && reports.body.reports.length > 0,
    "Reports endpoint must return seeded reports."
  );
  assertNoForbiddenKeys(reports.body, "reports");
  assertArtifactContracts(reports.body.reports.flatMap((report: any) => report.artifacts), "reports");

  const detail = await readJson(
    await reportDetailGet(new Request(`http://localhost/api/reports/${reportId}`), {
      params: { reportId }
    })
  );
  assert(detail.response.status === 200, "Report detail endpoint should return 200 for a seeded report.");
  assertNoForbiddenKeys(detail.body, "report detail");
  assertArtifactContracts(detail.body.artifacts, "report detail");

  const findings = await readJson(await findingsGet(new Request("http://localhost/api/findings")));
  assert(findings.response.status === 200, "Findings endpoint should return 200.");
  assertNoForbiddenKeys(findings.body, "findings");

  const sources = await readJson(await sourcesGet(new Request("http://localhost/api/sources")));
  assert(sources.response.status === 200, "Sources endpoint should return 200.");
  assertNoForbiddenKeys(sources.body, "sources");

  const artifactResponse = await artifactGet(new Request(`http://localhost/api/artifacts/${artifactId}`), {
    params: { artifactId }
  });
  assert(artifactResponse.status === 200, "Artifact endpoint should return 200 for a seeded artifact.");
  assert(
    (artifactResponse.headers.get("content-disposition") ?? "").includes(data.artifacts[0].title),
    "Artifact content-disposition should expose only the file title."
  );

  const missingArtifact = await artifactGet(new Request("http://localhost/api/artifacts/../../etc/passwd"), {
    params: { artifactId: "../../etc/passwd" }
  });
  assert(missingArtifact.status === 404, "Artifact endpoint should reject traversal-style artifact ids.");

  console.log("[check:api-security] critical API guards passed.");
}

async function readJson(response: Response) {
  return {
    response,
    body: await response.json()
  };
}

function assertArtifactContracts(artifacts: any[], label: string) {
  for (const artifact of artifacts) {
    assert(!("relativePath" in artifact), `${label} should not expose artifact.relativePath.`);
    assert(
      typeof artifact.downloadPath === "string" && artifact.downloadPath.startsWith("/api/artifacts/"),
      `${label} should expose a safe artifact downloadPath.`
    );
  }
}

function assertNoForbiddenKeys(value: unknown, label: string, path = label) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, label, `${path}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      assert(!looksLikeInternalPath(value), `${path} should not expose internal filesystem paths.`);
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    assert(!["relativePath", "dataFile", "artifactRoot"].includes(key), `${path}.${key} is a forbidden exposed field.`);
    assertNoForbiddenKeys(nestedValue, label, `${path}.${key}`);
  }
}

function assertAllowedKeys(value: Record<string, unknown>, allowed: string[], label: string) {
  for (const key of Object.keys(value)) {
    assert(allowed.includes(key), `${label} returned unexpected field "${key}".`);
  }
}

function looksLikeInternalPath(value: string) {
  return (
    value.startsWith("/home/") ||
    value.startsWith("data/") ||
    value.startsWith("outputs/") ||
    value.includes("\\") ||
    value.includes("../")
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error("[check:api-security] failed:", error);
  process.exitCode = 1;
});
