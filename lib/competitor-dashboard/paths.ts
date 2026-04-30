import path from "node:path";

const defaultDataFile = "./data/competitor-dashboard.json";
const defaultArtifactRoot = "./outputs/competitor-dashboard-artifacts";

export function repoRoot(): string {
  return process.cwd();
}

export function resolveFromRepo(relativeOrAbsolute: string): string {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.resolve(repoRoot(), relativeOrAbsolute);
}

export function dataFilePath(): string {
  return resolveFromRepo(process.env.COMPETITOR_DASHBOARD_DATA_FILE ?? defaultDataFile);
}

export function artifactRootPath(): string {
  return resolveFromRepo(
    process.env.COMPETITOR_DASHBOARD_ARTIFACT_ROOT ?? defaultArtifactRoot
  );
}

export function toRepoRelative(targetPath: string): string {
  return path.relative(repoRoot(), targetPath).split(path.sep).join("/");
}
