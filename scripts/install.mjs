import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();

const directories = [
  path.join(repoRoot, "data"),
  path.join(repoRoot, "outputs"),
  path.join(repoRoot, "outputs", "competitor-dashboard-artifacts")
];

for (const directory of directories) {
  await fs.mkdir(directory, { recursive: true });
}

for (const keepFile of [
  path.join(repoRoot, "data", ".gitkeep"),
  path.join(repoRoot, "outputs", "competitor-dashboard-artifacts", ".gitkeep")
]) {
  try {
    await fs.access(keepFile);
  } catch {
    await fs.writeFile(keepFile, "");
  }
}

console.log("[install] ensured local data and output directories");
