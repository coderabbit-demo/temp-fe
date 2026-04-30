from datetime import datetime
from pathlib import Path

from flask import Blueprint, abort, jsonify, redirect, render_template, request, send_file

from services.competitor_dashboard_db import (
    get_artifact,
    get_competitor_history,
    get_report,
    get_saved_views,
    list_artifacts_for_reports,
    list_competitors,
    list_findings,
    list_reports,
    list_runs,
    list_sources,
    report_counts,
)
from utils.security import return_safe_html


research_bp = Blueprint("research", __name__, url_prefix="/research")

VALIDATION_STATUSES = [
    "Validated",
    "Partially Validated",
    "Community Signal",
    "Needs Review",
]
SOURCE_LEVELS = [
    {"value": "1", "label": "Level 1"},
    {"value": "2", "label": "Level 2"},
    {"value": "3", "label": "Level 3"},
]
DATE_PRESETS = [
    {"value": "7d", "label": "Last 7 days"},
    {"value": "30d", "label": "Last 30 days"},
    {"value": "49d", "label": "Last 49 days"},
    {"value": "60d", "label": "Last 60 days"},
    {"value": "90d", "label": "Last 90 days"},
]
HISTORY_BANDS = [
    {"value": "0-30", "label": "0-30 days"},
    {"value": "30-49", "label": "30-49 days"},
    {"value": "49-90", "label": "49-90 days"},
]
STACK_ANSWERS = {
    "question_1": "This use case should use a database. A static JSON snapshot can render one report set, but it becomes brittle once you need historical preservation, multi-run comparisons, filterable source coverage, and search across findings and sources.",
    "question_2": "SQLite is the fastest internal deployment option here. It is production-ready enough for a small internal dashboard, requires no extra infrastructure, preserves history cleanly, and keeps the ingestion pipeline simple for scheduled sweep inserts.",
    "question_3": "Yes. This build sets up the schema, seeded data flow, and an ingestion pipeline. The ingestion model inserts one sweep run plus multiple competitor-specific reports without overwriting prior runs.",
    "question_4": "The simplest production-ready stack for this repo is Flask + Jinja templates + SQLite + file storage for PDF/PNG artifacts. It fits the current application, keeps deployment light, and supports URL-driven server-rendered filtering.",
}


def _serialize_row(row):
    return dict(row) if row else None


def _parse_filters(args):
    return {
        "competitor": args.get("competitor", "").strip(),
        "preset": args.get("preset", "").strip(),
        "start_date": args.get("start_date", "").strip(),
        "end_date": args.get("end_date", "").strip(),
        "source_level": args.get("source_level", "").strip(),
        "validation_status": args.get("validation_status", "").strip(),
        "report_run_id": args.get("report_run_id", "").strip(),
        "history_band": args.get("history_band", "").strip(),
        "latest_changelog_found": args.get("latest_changelog_found", "").strip(),
        "q": args.get("q", "").strip(),
        "view": args.get("view", "table").strip() or "table",
    }


def _active_filter_chips(filters):
    chips = []
    if filters["competitor"]:
        chips.append(("Competitor", filters["competitor"]))
    if filters["preset"]:
        chips.append(("Preset", filters["preset"]))
    if filters["start_date"] or filters["end_date"]:
        chips.append(
            (
                "Custom range",
                f"{filters['start_date'] or '...'} to {filters['end_date'] or '...'}",
            )
        )
    if filters["source_level"]:
        chips.append(("Source level", f"Level {filters['source_level']}"))
    if filters["validation_status"]:
        chips.append(("Validation", filters["validation_status"]))
    if filters["report_run_id"]:
        chips.append(("Run ID", filters["report_run_id"]))
    if filters["history_band"]:
        chips.append(("History band", filters["history_band"]))
    if filters["latest_changelog_found"] in {"0", "1"}:
        label = "Found" if filters["latest_changelog_found"] == "1" else "Missing"
        chips.append(("Latest changelog", label))
    if filters["q"]:
        chips.append(("Search", filters["q"]))
    return chips


def _base_context(page_title, active_nav, filters=None):
    competitors = list_competitors()
    filters = filters or _parse_filters(request.args)
    return {
        "page_title": page_title,
        "active_nav": active_nav,
        "filters": filters,
        "active_filter_chips": _active_filter_chips(filters),
        "competitors": competitors,
        "date_presets": DATE_PRESETS,
        "history_bands": HISTORY_BANDS,
        "source_levels": SOURCE_LEVELS,
        "validation_statuses": VALIDATION_STATUSES,
        "stack_answers": STACK_ANSWERS,
        "run_rows": list_runs(),
        "now_iso": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    }


@research_bp.route("/", methods=["GET"])
def research_root():
    return redirect("/research/dashboard")


@research_bp.route("/dashboard", methods=["GET"])
def dashboard():
    filters = _parse_filters(request.args)
    data = list_reports(filters)
    artifact_index = list_artifacts_for_reports([row["id"] for row in data["rows"]])
    context = _base_context("Dashboard", "dashboard", filters)
    context.update(
        {
            "reports": data["rows"],
            "artifact_index": artifact_index,
            "report_summary": report_counts(),
            "summary_counts": data["summary_counts"],
            "run_rows": data["run_rows"],
            "saved_views": get_saved_views(),
            "view_mode": filters["view"] if filters["view"] in {"table", "cards"} else "table",
        }
    )
    return return_safe_html(render_template("research/dashboard.html", **context))


@research_bp.route("/competitors", methods=["GET"])
def competitors_index():
    context = _base_context("Competitors", "competitors")
    return return_safe_html(render_template("research/competitors.html", **context))


@research_bp.route("/competitors/<slug>", methods=["GET"])
def competitor_detail(slug):
    history = get_competitor_history(slug)
    if not history:
        abort(404)
    context = _base_context(history["competitor"]["name"], "competitors")
    context.update(history)
    return return_safe_html(render_template("research/competitor_detail.html", **context))


@research_bp.route("/runs", methods=["GET"])
def runs_index():
    context = _base_context("Runs", "runs")
    context.update({"runs": list_runs()})
    return return_safe_html(render_template("research/runs.html", **context))


@research_bp.route("/reports/<int:report_id>", methods=["GET"])
def report_detail(report_id):
    payload = get_report(report_id)
    if not payload:
        abort(404)
    context = _base_context(payload["report"]["competitor_name"], "dashboard")
    context.update(payload)
    return return_safe_html(render_template("research/report_detail.html", **context))


@research_bp.route("/findings", methods=["GET"])
def findings_index():
    filters = _parse_filters(request.args)
    context = _base_context("Findings", "findings", filters)
    context.update({"findings": list_findings(filters)})
    return return_safe_html(render_template("research/findings.html", **context))


@research_bp.route("/sources", methods=["GET"])
def sources_index():
    filters = _parse_filters(request.args)
    context = _base_context("Sources", "sources", filters)
    context.update({"sources": list_sources(filters)})
    return return_safe_html(render_template("research/sources.html", **context))


@research_bp.route("/settings", methods=["GET"])
def settings_index():
    context = _base_context("Settings", "settings")
    return return_safe_html(render_template("research/settings.html", **context))


@research_bp.route("/artifacts/<int:artifact_id>", methods=["GET"])
def artifact_download(artifact_id):
    artifact = get_artifact(artifact_id)
    if not artifact:
        abort(404)
    artifact_path = Path(artifact["file_path"])
    if not artifact_path.exists():
        abort(404)
    return send_file(
        artifact_path,
        mimetype=artifact["mime_type"],
        as_attachment=True,
        download_name=artifact_path.name,
    )


@research_bp.route("/api/reports", methods=["GET"])
def api_reports():
    filters = _parse_filters(request.args)
    data = list_reports(filters)
    return jsonify(
        {
            "reports": [_serialize_row(row) for row in data["rows"]],
            "summary_counts": [_serialize_row(row) for row in data["summary_counts"]],
            "runs": [_serialize_row(row) for row in data["run_rows"]],
            "filters": filters,
        }
    )


@research_bp.route("/api/reports/<int:report_id>", methods=["GET"])
def api_report_detail(report_id):
    payload = get_report(report_id)
    if not payload:
        abort(404)
    return jsonify(payload)


@research_bp.route("/api/findings", methods=["GET"])
def api_findings():
    filters = _parse_filters(request.args)
    return jsonify({"findings": [_serialize_row(row) for row in list_findings(filters)]})


@research_bp.route("/api/sources", methods=["GET"])
def api_sources():
    filters = _parse_filters(request.args)
    return jsonify({"sources": [_serialize_row(row) for row in list_sources(filters)]})
