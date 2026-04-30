import fs from "node:fs/promises";
import path from "node:path";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PNG } from "pngjs";

import { artifactRootPath, toRepoRelative } from "@/lib/competitor-dashboard/paths";
import type {
  Artifact,
  Competitor,
  CompetitorReport,
  Finding,
  SweepRun
} from "@/lib/competitor-dashboard/types";

export async function ensureArtifactRoot(): Promise<string> {
  const root = artifactRootPath();
  await fs.mkdir(root, { recursive: true });
  return root;
}

export async function writeReportArtifacts(input: {
  artifactPdf: Artifact;
  artifactPng: Artifact;
  competitor: Competitor;
  report: CompetitorReport;
  run: SweepRun;
  findings: Finding[];
}): Promise<{ pdfRelativePath: string; pngRelativePath: string }> {
  const root = await ensureArtifactRoot();
  const pdfPath = path.join(root, input.artifactPdf.title);
  const pngPath = path.join(root, input.artifactPng.title);

  await Promise.all([
    writePdfArtifact(pdfPath, input.competitor, input.report, input.run, input.findings),
    writePngArtifact(pngPath, input.competitor, input.report)
  ]);

  return {
    pdfRelativePath: toRepoRelative(pdfPath),
    pngRelativePath: toRepoRelative(pngPath)
  };
}

async function writePdfArtifact(
  filePath: string,
  competitor: Competitor,
  report: CompetitorReport,
  run: SweepRun,
  findings: Finding[]
): Promise<void> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 732, width: 612, height: 60, color: rgb(0.08, 0.12, 0.2) });
  page.drawText("Competitor Research Dashboard", {
    x: 36,
    y: 760,
    font: boldFont,
    size: 20,
    color: rgb(1, 1, 1)
  });
  page.drawText(competitor.name, {
    x: 36,
    y: 738,
    font,
    size: 12,
    color: rgb(0.82, 0.88, 1)
  });

  let y = 700;
  const lines = [
    `Run: ${run.label} (${run.reportWindowLabel})`,
    `Report generated at: ${report.generatedAt}`,
    `Validation coverage: ${report.validationCoverage}%`,
    `Latest changelog movement found: ${report.latestMovementFound ? "Yes" : "No"}`,
    `Summary: ${report.summary}`
  ];

  for (const line of lines) {
    page.drawText(line, { x: 36, y, font, size: 11, color: rgb(0.12, 0.14, 0.18) });
    y -= 22;
  }

  y -= 6;
  page.drawText("Recent findings", {
    x: 36,
    y,
    font: boldFont,
    size: 14,
    color: rgb(0.1, 0.14, 0.24)
  });
  y -= 24;

  for (const finding of findings.slice(0, 4)) {
    const block = [
      `Claim: ${finding.claim}`,
      `Why it matters: ${finding.whyItMatters}`,
      `CodeRabbit comparison: ${finding.codeRabbitComparison}`
    ];

    for (const line of block) {
      page.drawText(trimLine(line, 96), {
        x: 48,
        y,
        font,
        size: 10,
        color: rgb(0.18, 0.2, 0.25)
      });
      y -= 18;
    }

    y -= 8;
    if (y < 80) {
      break;
    }
  }

  await fs.writeFile(filePath, await pdf.save());
}

async function writePngArtifact(
  filePath: string,
  competitor: Competitor,
  report: CompetitorReport
): Promise<void> {
  const width = 1280;
  const height = 720;
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      const stripe = Math.floor(x / 180) % 3;
      png.data[idx] = stripe === 0 ? 13 : stripe === 1 ? 21 : 32;
      png.data[idx + 1] = stripe === 0 ? 21 : stripe === 1 ? 33 : 47;
      png.data[idx + 2] = stripe === 0 ? 39 : stripe === 1 ? 52 : 67;
      png.data[idx + 3] = 255;
    }
  }

  drawPanel(png, 48, 48, 1184, 624, [243, 247, 252]);
  drawPanel(png, 80, 92, 480, 76, [26, 39, 63]);
  drawPanel(png, 80, 200, 320, 160, [224, 233, 246]);
  drawPanel(png, 430, 200, 320, 160, [224, 233, 246]);
  drawPanel(png, 780, 200, 420, 330, [224, 233, 246]);
  drawPanel(png, 80, 390, 670, 140, [233, 239, 248]);
  drawPanel(png, 80, 560, 1120, 70, report.latestMovementFound ? [208, 238, 223] : [248, 224, 224]);

  const bannerColor: [number, number, number] = report.latestMovementFound
    ? [20, 133, 79]
    : [166, 54, 64];
  drawPanel(png, 850, 92, 260, 76, bannerColor);

  await fs.writeFile(filePath, PNG.sync.write(png));

  // The preview is intentionally lightweight and text-free to avoid native dependencies.
  void competitor;
}

function drawPanel(
  png: PNG,
  xStart: number,
  yStart: number,
  width: number,
  height: number,
  color: [number, number, number]
): void {
  for (let y = yStart; y < yStart + height; y += 1) {
    for (let x = xStart; x < xStart + width; x += 1) {
      const idx = (png.width * y + x) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = 255;
    }
  }
}

function trimLine(line: string, limit: number): string {
  return line.length <= limit ? line : `${line.slice(0, limit - 3)}...`;
}
