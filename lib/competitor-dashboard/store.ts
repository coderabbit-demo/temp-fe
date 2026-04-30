import fs from "node:fs/promises";
import path from "node:path";

import { dataFilePath } from "@/lib/competitor-dashboard/paths";
import type { DashboardData } from "@/lib/competitor-dashboard/types";

export async function ensureLocalDirectories(): Promise<void> {
  const dataFile = dataFilePath();
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
}

export async function loadDashboardData(): Promise<DashboardData | null> {
  const filePath = dataFilePath();

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as DashboardData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw new Error(
      `Failed to load competitor dashboard data from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function saveDashboardData(data: DashboardData): Promise<void> {
  const filePath = dataFilePath();
  await ensureLocalDirectories();
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
