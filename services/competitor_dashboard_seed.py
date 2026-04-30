from datetime import datetime, timedelta
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from services.competitor_dashboard_db import COMPETITOR_SLUGS


def build_seed_payloads(output_root: Path):
    output_root.mkdir(parents=True, exist_ok=True)
    run_specs = [
        {"run_id": "sweep-2026-04-30", "generated_at": "2026-04-30T14:30:00Z", "days": 30},
        {"run_id": "sweep-2026-03-18", "generated_at": "2026-03-18T10:00:00Z", "days": 49},
        {"run_id": "sweep-2026-02-12", "generated_at": "2026-02-12T09:15:00Z", "days": 90},
    ]
    statuses = ["Validated", "Partially Validated", "Community Signal", "Needs Review"]
    payloads = []

    for run_index, run in enumerate(run_specs):
        generated_at = datetime.fromisoformat(run["generated_at"].replace("Z", "+00:00"))
        report_window_end = generated_at.date()
        report_window_start = report_window_end - timedelta(days=run["days"])
        reports = []

        for comp_index, (slug, name) in enumerate(COMPETITOR_SLUGS.items()):
            validation_status = statuses[(run_index + comp_index) % len(statuses)]
            latest_changelog_found = (run_index + comp_index) % 4 != 3
            artifact_paths = _make_artifacts(output_root, run["run_id"], slug, name, generated_at)
            findings = _build_findings(name, slug, generated_at.date(), run_index, comp_index)

            reports.append(
                {
                    "report_uid": f"{run['run_id']}::{slug}",
                    "competitor_slug": slug,
                    "sweep_run_date": report_window_end.isoformat(),
                    "report_window": {
                        "label": f"Last {run['days']} days",
                        "days": run["days"],
                        "start": report_window_start.isoformat(),
                        "end": report_window_end.isoformat(),
                    },
                    "newest_finding_date": findings[0]["finding_date"],
                    "validation_coverage": f"{1 + ((run_index + comp_index) % 2)}/{len(findings)} findings validated",
                    "validation_status": validation_status,
                    "source_level_coverage": ["L1", "L2", "L3"] if latest_changelog_found else ["L2", "L3"],
                    "latest_changelog_found": latest_changelog_found,
                    "latest_changelog": {
                        "date": (generated_at.date() - timedelta(days=2 + comp_index)).isoformat()
                        if latest_changelog_found
                        else None,
                        "summary": f"Sample latest changelog movement captured for {name}."
                        if latest_changelog_found
                        else "No sample changelog movement attached for this seeded record.",
                        "url": f"https://example.internal/{slug}/changelog/{run['run_id']}"
                        if latest_changelog_found
                        else None,
                    },
                    "artifacts": [
                        {
                            "kind": "pdf",
                            "title": f"{name} sample report PDF",
                            "file_path": str(artifact_paths["pdf"]),
                            "mime_type": "application/pdf",
                        },
                        {
                            "kind": "png",
                            "title": f"{name} sample preview PNG",
                            "file_path": str(artifact_paths["png"]),
                            "mime_type": "image/png",
                        },
                    ],
                    "report_sources": _report_sources(name, slug),
                    "validation_flags": [
                        {
                            "key": "seed_data",
                            "value": "illustrative",
                            "note": "This record was generated as seeded demo data for the dashboard prototype.",
                        }
                    ],
                    "findings": findings,
                }
            )

        payloads.append(
            {
                "run_id": run["run_id"],
                "generated_at": run["generated_at"],
                "report_window": {"label": f"Last {run['days']} days", "days": run["days"]},
                "notes": "Illustrative seeded run for the Competitor Research Dashboard prototype.",
                "reports": reports,
            }
        )

    return payloads


def _build_findings(name, slug, base_date, run_index, comp_index):
    finding_statuses = ["Validated", "Partially Validated", "Community Signal"]
    findings = []
    for idx in range(2):
        finding_date = base_date - timedelta(days=idx * 3 + comp_index)
        validation_status = finding_statuses[(run_index + idx + comp_index) % len(finding_statuses)]
        findings.append(
            {
                "finding_uid": f"{slug}-finding-{run_index}-{comp_index}-{idx}",
                "finding_date": finding_date.isoformat(),
                "finding_type": "Feature Changed" if idx == 0 else "Community Signal",
                "claim": f"Sample finding for {name}: review workflow signal {idx + 1} captured in seeded prototype data.",
                "supporting_details": [
                    f"Sample detail one for {name} report run {run_index + 1}.",
                    "Sample detail two demonstrates the competitor-specific report model instead of a merged archive.",
                    "Sample detail three preserves the exact report window and run identifier for filtering.",
                ],
                "why_it_matters": [
                    "This seeded finding demonstrates how the dashboard stores historical context and validation state per competitor.",
                    "It also exercises source-level filtering and run-to-run comparison for the same competitor.",
                ],
                "coderabbit": {
                    "status": "Partial Match" if idx == 0 else "Unknown",
                    "evidence": [
                        "Sample internal evidence placeholder for prototype rendering.",
                    ],
                    "competitive_takeaway": [
                        "Seeded comparison content shows where CodeRabbit match state and takeaway text appear.",
                    ],
                },
                "suggested_positioning": [
                    "Use this section to capture evidence-grounded positioning in the production sweep pipeline.",
                ],
                "validation_status": validation_status,
                "sources": _finding_sources(name, slug, idx),
                "tags": ["sample", "dashboard", slug],
                "validation_flags": [
                    {
                        "key": "validation_mode",
                        "value": validation_status.lower().replace(" ", "_"),
                        "note": "Seed flag used to demonstrate historical validation states.",
                    }
                ],
            }
        )
    return findings


def _report_sources(name, slug):
    return [
        {
            "level": 1,
            "bucket": "Changelog, documentation, company websites",
            "source_type": "documentation",
            "title": f"{name} sample release notes",
            "url": f"https://example.internal/{slug}/release-notes",
            "domain": "example.internal",
            "notes": "Illustrative Level 1 source for seeded dashboard data.",
            "is_primary": True,
        },
        {
            "level": 2,
            "bucket": "3rd party trusted sources",
            "source_type": "trusted-analysis",
            "title": f"{name} sample trusted coverage",
            "url": f"https://trusted.example/{slug}",
            "domain": "trusted.example",
            "notes": "Illustrative Level 2 source for seeded dashboard data.",
            "is_primary": False,
        },
    ]


def _finding_sources(name, slug, idx):
    return [
        {
            "level": 1,
            "bucket": "Changelogs, documentation, company websites",
            "source_type": "company-doc",
            "title": f"{name} sample doc reference {idx + 1}",
            "url": f"https://example.internal/{slug}/docs/{idx + 1}",
            "domain": "example.internal",
            "notes": "Level 1 seeded reference.",
            "is_primary": True,
        },
        {
            "level": 2,
            "bucket": "3rd party trusted sources such as Withmartian or Y Combinator",
            "source_type": "trusted-third-party",
            "title": f"{name} sample trusted source {idx + 1}",
            "url": f"https://trusted.example/{slug}/trusted-{idx + 1}",
            "domain": "trusted.example",
            "notes": "Level 2 seeded reference.",
            "is_primary": False,
        },
        {
            "level": 3,
            "bucket": "Reddit, LinkedIn, X / Twitter, forums",
            "source_type": "community",
            "title": f"{name} sample community thread {idx + 1}",
            "url": f"https://community.example/{slug}/thread-{idx + 1}",
            "domain": "community.example",
            "notes": "Level 3 seeded reference.",
            "is_primary": False,
        },
    ]


def _make_artifacts(output_root: Path, run_id: str, slug: str, name: str, generated_at: datetime):
    artifact_dir = output_root / run_id
    artifact_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = artifact_dir / f"{slug}.pdf"
    png_path = artifact_dir / f"{slug}.png"

    pdf = canvas.Canvas(str(pdf_path), pagesize=letter)
    pdf.setTitle(f"{name} Seeded Competitor Report")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(72, 740, "Competitor Research Dashboard")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(72, 710, f"Competitor: {name}")
    pdf.drawString(72, 690, f"Run ID: {run_id}")
    pdf.drawString(72, 670, f"Generated at: {generated_at.isoformat()}")
    pdf.drawString(72, 650, "This PDF is illustrative seeded data for the internal dashboard prototype.")
    pdf.save()

    image = Image.new("RGB", (1400, 800), color=(245, 248, 250))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((60, 60, 1340, 740), outline=(31, 55, 75), width=3)
    draw.text((110, 120), "Competitor Research Dashboard", fill=(14, 35, 54), font=font)
    draw.text((110, 170), f"Competitor: {name}", fill=(14, 35, 54), font=font)
    draw.text((110, 210), f"Run ID: {run_id}", fill=(14, 35, 54), font=font)
    draw.text((110, 250), "Seeded PNG preview artifact for archive/download testing.", fill=(65, 79, 92), font=font)
    image.save(png_path)

    return {"pdf": pdf_path, "png": png_path}
