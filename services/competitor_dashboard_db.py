import json
import os
import sqlite3
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BASE_DIR / "instance" / "competitor_dashboard.sqlite3"

COMPETITOR_SLUGS = {
    "github-copilot": "GitHub Copilot",
    "cursor-bugbot": "Cursor / Bugbot",
    "qodo": "Qodo",
    "greptile": "Greptile",
    "gemini-code-assist": "Gemini Code Assist",
    "claude-code-anthropic": "Claude Code / Anthropic",
    "cubic": "Cubic",
}

SAVED_VIEWS = [
    {
        "slug": "last-30-days",
        "name": "Last 30 days",
        "description": "Recent sweep output from the last 30 days.",
        "query_string": "preset=30d",
    },
    {
        "slug": "30-49-days",
        "name": "30-49 days",
        "description": "Archive slice for reports 30 to 49 days old.",
        "query_string": "history_band=30-49",
    },
    {
        "slug": "49-90-days",
        "name": "49-90 days",
        "description": "Archive slice for reports 49 to 90 days old.",
        "query_string": "history_band=49-90",
    },
    {
        "slug": "missing-latest-changelog",
        "name": "Missing latest changelog",
        "description": "Reports where latest changelog movement was not found.",
        "query_string": "latest_changelog_found=0",
    },
    {
        "slug": "community-signal-only",
        "name": "Community-signal only",
        "description": "Findings that still need stronger validation.",
        "query_string": "validation_status=Community%20Signal",
    },
]


def get_db_path() -> Path:
    custom_path = os.getenv("COMPETITOR_DASHBOARD_DB")
    if custom_path:
        return Path(custom_path).expanduser().resolve()
    return DEFAULT_DB_PATH


def get_connection() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def utcnow() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def ensure_database() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS competitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sweep_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL UNIQUE,
                generated_at TEXT NOT NULL,
                report_window_label TEXT NOT NULL,
                report_window_days INTEGER,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS competitor_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_uid TEXT NOT NULL UNIQUE,
                competitor_id INTEGER NOT NULL REFERENCES competitors(id),
                sweep_run_id INTEGER NOT NULL REFERENCES sweep_runs(id),
                sweep_run_date TEXT NOT NULL,
                report_window_label TEXT NOT NULL,
                report_window_days INTEGER,
                report_window_start TEXT,
                report_window_end TEXT,
                findings_count INTEGER NOT NULL DEFAULT 0,
                newest_finding_date TEXT,
                validation_coverage TEXT,
                validation_status TEXT,
                source_level_coverage TEXT,
                latest_changelog_found INTEGER NOT NULL DEFAULT 0,
                latest_changelog_date TEXT,
                latest_changelog_summary TEXT,
                latest_release_note_url TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS findings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                finding_uid TEXT NOT NULL UNIQUE,
                competitor_report_id INTEGER NOT NULL REFERENCES competitor_reports(id),
                finding_date TEXT NOT NULL,
                finding_type TEXT NOT NULL,
                claim TEXT NOT NULL,
                supporting_details_json TEXT NOT NULL,
                why_it_matters_json TEXT NOT NULL,
                coderabbit_status TEXT NOT NULL,
                coderabbit_evidence_json TEXT NOT NULL,
                competitive_takeaway_json TEXT NOT NULL,
                suggested_positioning_json TEXT NOT NULL,
                validation_status TEXT NOT NULL,
                search_text TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                competitor_report_id INTEGER REFERENCES competitor_reports(id),
                finding_id INTEGER REFERENCES findings(id),
                source_level INTEGER NOT NULL,
                source_bucket TEXT NOT NULL,
                source_type TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                domain TEXT,
                notes TEXT,
                is_primary INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS artifacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                competitor_report_id INTEGER NOT NULL REFERENCES competitor_reports(id),
                artifact_kind TEXT NOT NULL,
                title TEXT NOT NULL,
                file_path TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS finding_tags (
                finding_id INTEGER NOT NULL REFERENCES findings(id),
                tag_id INTEGER NOT NULL REFERENCES tags(id),
                PRIMARY KEY (finding_id, tag_id)
            );

            CREATE TABLE IF NOT EXISTS validation_flags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                competitor_report_id INTEGER REFERENCES competitor_reports(id),
                finding_id INTEGER REFERENCES findings(id),
                flag_key TEXT NOT NULL,
                flag_value TEXT NOT NULL,
                note TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS saved_views (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                query_string TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_competitor_reports_competitor_id
                ON competitor_reports(competitor_id);
            CREATE INDEX IF NOT EXISTS idx_competitor_reports_sweep_run_id
                ON competitor_reports(sweep_run_id);
            CREATE INDEX IF NOT EXISTS idx_competitor_reports_sweep_run_date
                ON competitor_reports(sweep_run_date DESC);
            CREATE INDEX IF NOT EXISTS idx_competitor_reports_validation_status
                ON competitor_reports(validation_status);
            CREATE INDEX IF NOT EXISTS idx_findings_report_id ON findings(competitor_report_id);
            CREATE INDEX IF NOT EXISTS idx_findings_date ON findings(finding_date DESC);
            CREATE INDEX IF NOT EXISTS idx_findings_validation_status
                ON findings(validation_status);
            CREATE INDEX IF NOT EXISTS idx_sources_finding_id ON sources(finding_id);
            CREATE INDEX IF NOT EXISTS idx_sources_level ON sources(source_level);
            CREATE INDEX IF NOT EXISTS idx_sources_report_id ON sources(competitor_report_id);
            """
        )
        _seed_competitors(conn)
        _seed_saved_views(conn)
        conn.commit()


def _seed_competitors(conn: sqlite3.Connection) -> None:
    for slug, name in COMPETITOR_SLUGS.items():
        conn.execute(
            """
            INSERT OR IGNORE INTO competitors (slug, name)
            VALUES (?, ?)
            """,
            (slug, name),
        )


def _seed_saved_views(conn: sqlite3.Connection) -> None:
    for view in SAVED_VIEWS:
        conn.execute(
            """
            INSERT OR IGNORE INTO saved_views (slug, name, description, query_string)
            VALUES (:slug, :name, :description, :query_string)
            """,
            view,
        )


def ingest_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_database()

    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM sweep_runs WHERE run_id = ?", (payload["run_id"],)
        ).fetchone()
        if existing:
            raise ValueError(f"sweep run {payload['run_id']} already exists")

        conn.execute(
            """
            INSERT INTO sweep_runs (run_id, generated_at, report_window_label, report_window_days, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload["run_id"],
                payload["generated_at"],
                payload["report_window"]["label"],
                payload["report_window"].get("days"),
                payload.get("notes"),
            ),
        )
        sweep_run_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        inserted_reports = []
        for report in payload["reports"]:
            competitor = conn.execute(
                "SELECT id, name FROM competitors WHERE slug = ?", (report["competitor_slug"],)
            ).fetchone()
            if not competitor:
                raise ValueError(f"unknown competitor slug {report['competitor_slug']}")

            conn.execute(
                """
                INSERT INTO competitor_reports (
                    report_uid,
                    competitor_id,
                    sweep_run_id,
                    sweep_run_date,
                    report_window_label,
                    report_window_days,
                    report_window_start,
                    report_window_end,
                    findings_count,
                    newest_finding_date,
                    validation_coverage,
                    validation_status,
                    source_level_coverage,
                    latest_changelog_found,
                    latest_changelog_date,
                    latest_changelog_summary,
                    latest_release_note_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    report["report_uid"],
                    competitor["id"],
                    sweep_run_id,
                    report["sweep_run_date"],
                    report["report_window"]["label"],
                    report["report_window"].get("days"),
                    report["report_window"].get("start"),
                    report["report_window"].get("end"),
                    len(report.get("findings", [])),
                    report.get("newest_finding_date"),
                    report.get("validation_coverage"),
                    report.get("validation_status"),
                    ",".join(report.get("source_level_coverage", [])),
                    1 if report.get("latest_changelog_found") else 0,
                    report.get("latest_changelog", {}).get("date"),
                    report.get("latest_changelog", {}).get("summary"),
                    report.get("latest_changelog", {}).get("url"),
                ),
            )
            report_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            inserted_reports.append({"report_id": report_id, "report_uid": report["report_uid"]})

            for artifact in report.get("artifacts", []):
                conn.execute(
                    """
                    INSERT INTO artifacts (competitor_report_id, artifact_kind, title, file_path, mime_type)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        report_id,
                        artifact["kind"],
                        artifact["title"],
                        artifact["file_path"],
                        artifact["mime_type"],
                    ),
                )

            report_level_sources = report.get("report_sources", [])
            for source in report_level_sources:
                conn.execute(
                    """
                    INSERT INTO sources (
                        competitor_report_id,
                        source_level,
                        source_bucket,
                        source_type,
                        title,
                        url,
                        domain,
                        notes,
                        is_primary
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        report_id,
                        source["level"],
                        source["bucket"],
                        source["source_type"],
                        source["title"],
                        source["url"],
                        source.get("domain"),
                        source.get("notes"),
                        1 if source.get("is_primary") else 0,
                    ),
                )

            for flag in report.get("validation_flags", []):
                conn.execute(
                    """
                    INSERT INTO validation_flags (competitor_report_id, flag_key, flag_value, note)
                    VALUES (?, ?, ?, ?)
                    """,
                    (report_id, flag["key"], flag["value"], flag.get("note")),
                )

            for finding in report.get("findings", []):
                conn.execute(
                    """
                    INSERT INTO findings (
                        finding_uid,
                        competitor_report_id,
                        finding_date,
                        finding_type,
                        claim,
                        supporting_details_json,
                        why_it_matters_json,
                        coderabbit_status,
                        coderabbit_evidence_json,
                        competitive_takeaway_json,
                        suggested_positioning_json,
                        validation_status,
                        search_text
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        finding["finding_uid"],
                        report_id,
                        finding["finding_date"],
                        finding["finding_type"],
                        finding["claim"],
                        json.dumps(finding.get("supporting_details", [])),
                        json.dumps(finding.get("why_it_matters", [])),
                        finding["coderabbit"]["status"],
                        json.dumps(finding["coderabbit"].get("evidence", [])),
                        json.dumps(finding["coderabbit"].get("competitive_takeaway", [])),
                        json.dumps(finding.get("suggested_positioning", [])),
                        finding["validation_status"],
                        _build_search_text(finding),
                    ),
                )
                finding_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

                for source in finding.get("sources", []):
                    conn.execute(
                        """
                        INSERT INTO sources (
                            competitor_report_id,
                            finding_id,
                            source_level,
                            source_bucket,
                            source_type,
                            title,
                            url,
                            domain,
                            notes,
                            is_primary
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            report_id,
                            finding_id,
                            source["level"],
                            source["bucket"],
                            source["source_type"],
                            source["title"],
                            source["url"],
                            source.get("domain"),
                            source.get("notes"),
                            1 if source.get("is_primary") else 0,
                        ),
                    )

                for tag_name in finding.get("tags", []):
                    conn.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
                    tag_id = conn.execute(
                        "SELECT id FROM tags WHERE name = ?", (tag_name,)
                    ).fetchone()[0]
                    conn.execute(
                        "INSERT OR IGNORE INTO finding_tags (finding_id, tag_id) VALUES (?, ?)",
                        (finding_id, tag_id),
                    )

                for flag in finding.get("validation_flags", []):
                    conn.execute(
                        """
                        INSERT INTO validation_flags (competitor_report_id, finding_id, flag_key, flag_value, note)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (report_id, finding_id, flag["key"], flag["value"], flag.get("note")),
                    )

        conn.commit()

    return {"run_id": payload["run_id"], "inserted_reports": inserted_reports}


def list_competitors() -> List[sqlite3.Row]:
    ensure_database()
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT c.*, COUNT(cr.id) AS report_count, MAX(cr.sweep_run_date) AS last_report_date
            FROM competitors c
            LEFT JOIN competitor_reports cr ON cr.competitor_id = c.id
            GROUP BY c.id
            ORDER BY c.name
            """
        ).fetchall()


def get_saved_views() -> List[sqlite3.Row]:
    ensure_database()
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM saved_views ORDER BY name"
        ).fetchall()


def list_reports(filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    ensure_database()
    filters = filters or {}
    query = """
        SELECT
            cr.*,
            c.slug AS competitor_slug,
            c.name AS competitor_name,
            sr.run_id,
            sr.generated_at
        FROM competitor_reports cr
        JOIN competitors c ON c.id = cr.competitor_id
        JOIN sweep_runs sr ON sr.id = cr.sweep_run_id
    """
    where_clauses = []
    params: List[Any] = []

    if filters.get("competitor"):
        where_clauses.append("c.slug = ?")
        params.append(filters["competitor"])

    if filters.get("report_run_id"):
        where_clauses.append("sr.run_id = ?")
        params.append(filters["report_run_id"])

    if filters.get("validation_status"):
        where_clauses.append("cr.validation_status = ?")
        params.append(filters["validation_status"])

    if filters.get("source_level"):
        where_clauses.append("cr.source_level_coverage LIKE ?")
        params.append(f"%L{filters['source_level']}%")

    if filters.get("latest_changelog_found") in ("0", "1"):
        where_clauses.append("cr.latest_changelog_found = ?")
        params.append(int(filters["latest_changelog_found"]))

    date_start, date_end = _resolve_date_window(filters)
    if date_start:
        where_clauses.append("date(cr.sweep_run_date) >= date(?)")
        params.append(date_start)
    if date_end:
        where_clauses.append("date(cr.sweep_run_date) <= date(?)")
        params.append(date_end)

    search = filters.get("q")
    if search:
        where_clauses.append(
            """
            (
                lower(c.name) LIKE ?
                OR lower(sr.run_id) LIKE ?
                OR EXISTS (
                    SELECT 1 FROM findings f
                    WHERE f.competitor_report_id = cr.id
                      AND lower(f.search_text) LIKE ?
                )
                OR EXISTS (
                    SELECT 1 FROM sources s
                    WHERE s.competitor_report_id = cr.id
                      AND lower(s.title || ' ' || s.url || ' ' || IFNULL(s.notes, '')) LIKE ?
                )
            )
            """
        )
        needle = f"%{search.lower()}%"
        params.extend([needle, needle, needle, needle])

    if filters.get("history_band"):
        band_start, band_end = _resolve_history_band(filters["history_band"])
        if band_start is not None and band_end is not None:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=band_end)
            end_date = today - timedelta(days=band_start)
            where_clauses.append("date(cr.sweep_run_date) BETWEEN date(?) AND date(?)")
            params.extend([start_date.isoformat(), end_date.isoformat()])

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    query += " ORDER BY datetime(cr.sweep_run_date) DESC, c.name ASC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        counts = conn.execute(
            "SELECT validation_status, COUNT(*) AS count FROM competitor_reports GROUP BY validation_status"
        ).fetchall()
        run_rows = conn.execute(
            "SELECT run_id, generated_at FROM sweep_runs ORDER BY generated_at DESC"
        ).fetchall()

    return {
        "rows": rows,
        "summary_counts": counts,
        "run_rows": run_rows,
        "date_start": date_start,
        "date_end": date_end,
    }


def get_report(report_id: int) -> Optional[Dict[str, Any]]:
    ensure_database()
    with get_connection() as conn:
        report = conn.execute(
            """
            SELECT
                cr.*,
                c.slug AS competitor_slug,
                c.name AS competitor_name,
                sr.run_id,
                sr.generated_at AS report_generated_at,
                sr.report_window_label AS sweep_window_label
            FROM competitor_reports cr
            JOIN competitors c ON c.id = cr.competitor_id
            JOIN sweep_runs sr ON sr.id = cr.sweep_run_id
            WHERE cr.id = ?
            """,
            (report_id,),
        ).fetchone()
        if not report:
            return None

        findings = conn.execute(
            """
            SELECT * FROM findings
            WHERE competitor_report_id = ?
            ORDER BY date(finding_date) DESC, id DESC
            """,
            (report_id,),
        ).fetchall()
        artifacts = conn.execute(
            "SELECT * FROM artifacts WHERE competitor_report_id = ? ORDER BY artifact_kind, id",
            (report_id,),
        ).fetchall()
        sources = conn.execute(
            """
            SELECT * FROM sources
            WHERE competitor_report_id = ?
            ORDER BY source_level, is_primary DESC, id ASC
            """,
            (report_id,),
        ).fetchall()
        flags = conn.execute(
            """
            SELECT * FROM validation_flags
            WHERE competitor_report_id = ?
            ORDER BY finding_id, id
            """,
            (report_id,),
        ).fetchall()

    grouped_sources = defaultdict(list)
    for source in sources:
        grouped_sources[source["finding_id"]].append(dict(source))

    grouped_flags = defaultdict(list)
    for flag in flags:
        grouped_flags[flag["finding_id"]].append(dict(flag))

    findings_payload = []
    for finding in findings:
        findings_payload.append(
            {
                **dict(finding),
                "supporting_details": json.loads(finding["supporting_details_json"]),
                "why_it_matters": json.loads(finding["why_it_matters_json"]),
                "coderabbit_evidence": json.loads(finding["coderabbit_evidence_json"]),
                "competitive_takeaway": json.loads(
                    finding["competitive_takeaway_json"]
                ),
                "suggested_positioning": json.loads(
                    finding["suggested_positioning_json"]
                ),
                "sources_by_level": _group_sources_by_level(grouped_sources.get(finding["id"], [])),
                "validation_flags": grouped_flags.get(finding["id"], []),
            }
        )

    report_sources = [src for src in sources if src["finding_id"] is None]
    return {
        "report": dict(report),
        "findings": findings_payload,
        "artifacts": [dict(artifact) for artifact in artifacts],
        "report_sources_by_level": _group_sources_by_level([dict(src) for src in report_sources]),
        "report_validation_flags": grouped_flags.get(None, []),
    }


def list_runs() -> List[sqlite3.Row]:
    ensure_database()
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT
                sr.*,
                COUNT(cr.id) AS competitor_report_count,
                SUM(cr.findings_count) AS total_findings
            FROM sweep_runs sr
            LEFT JOIN competitor_reports cr ON cr.sweep_run_id = sr.id
            GROUP BY sr.id
            ORDER BY datetime(sr.generated_at) DESC
            """
        ).fetchall()


def list_findings(filters: Optional[Dict[str, Any]] = None) -> List[sqlite3.Row]:
    ensure_database()
    filters = filters or {}
    query = """
        SELECT
            f.*,
            c.name AS competitor_name,
            c.slug AS competitor_slug,
            cr.report_uid,
            sr.run_id
        FROM findings f
        JOIN competitor_reports cr ON cr.id = f.competitor_report_id
        JOIN competitors c ON c.id = cr.competitor_id
        JOIN sweep_runs sr ON sr.id = cr.sweep_run_id
    """
    where = []
    params: List[Any] = []

    if filters.get("competitor"):
        where.append("c.slug = ?")
        params.append(filters["competitor"])
    if filters.get("validation_status"):
        where.append("f.validation_status = ?")
        params.append(filters["validation_status"])
    if filters.get("report_run_id"):
        where.append("sr.run_id = ?")
        params.append(filters["report_run_id"])
    if filters.get("source_level"):
        where.append(
            """
            EXISTS (
                SELECT 1 FROM sources s
                WHERE s.finding_id = f.id
                  AND s.source_level = ?
            )
            """
        )
        params.append(int(filters["source_level"]))

    date_start, date_end = _resolve_date_window(filters)
    if date_start:
        where.append("date(cr.sweep_run_date) >= date(?)")
        params.append(date_start)
    if date_end:
        where.append("date(cr.sweep_run_date) <= date(?)")
        params.append(date_end)

    if filters.get("history_band"):
        band_start, band_end = _resolve_history_band(filters["history_band"])
        if band_start is not None and band_end is not None:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=band_end)
            end_date = today - timedelta(days=band_start)
            where.append("date(cr.sweep_run_date) BETWEEN date(?) AND date(?)")
            params.extend([start_date.isoformat(), end_date.isoformat()])
    if filters.get("q"):
        where.append("lower(f.search_text) LIKE ?")
        params.append(f"%{filters['q'].lower()}%")

    if where:
        query += " WHERE " + " AND ".join(where)
    query += " ORDER BY date(f.finding_date) DESC, f.id DESC"

    with get_connection() as conn:
        return conn.execute(query, params).fetchall()


def list_sources(filters: Optional[Dict[str, Any]] = None) -> List[sqlite3.Row]:
    ensure_database()
    filters = filters or {}
    query = """
        SELECT
            s.*,
            c.name AS competitor_name,
            c.slug AS competitor_slug,
            sr.run_id,
            COALESCE(f.validation_status, cr.validation_status) AS validation_status
        FROM sources s
        JOIN competitor_reports cr ON cr.id = s.competitor_report_id
        JOIN competitors c ON c.id = cr.competitor_id
        JOIN sweep_runs sr ON sr.id = cr.sweep_run_id
        LEFT JOIN findings f ON f.id = s.finding_id
    """
    where = []
    params: List[Any] = []
    if filters.get("competitor"):
        where.append("c.slug = ?")
        params.append(filters["competitor"])
    if filters.get("source_level"):
        where.append("s.source_level = ?")
        params.append(int(filters["source_level"]))
    if filters.get("validation_status"):
        where.append("COALESCE(f.validation_status, cr.validation_status) = ?")
        params.append(filters["validation_status"])
    if filters.get("report_run_id"):
        where.append("sr.run_id = ?")
        params.append(filters["report_run_id"])

    date_start, date_end = _resolve_date_window(filters)
    if date_start:
        where.append("date(cr.sweep_run_date) >= date(?)")
        params.append(date_start)
    if date_end:
        where.append("date(cr.sweep_run_date) <= date(?)")
        params.append(date_end)

    if filters.get("history_band"):
        band_start, band_end = _resolve_history_band(filters["history_band"])
        if band_start is not None and band_end is not None:
            today = datetime.utcnow().date()
            start_date = today - timedelta(days=band_end)
            end_date = today - timedelta(days=band_start)
            where.append("date(cr.sweep_run_date) BETWEEN date(?) AND date(?)")
            params.extend([start_date.isoformat(), end_date.isoformat()])
    if filters.get("q"):
        where.append("lower(s.title || ' ' || s.url || ' ' || IFNULL(s.notes, '')) LIKE ?")
        params.append(f"%{filters['q'].lower()}%")
    if where:
        query += " WHERE " + " AND ".join(where)
    query += " ORDER BY s.source_level ASC, s.id DESC"

    with get_connection() as conn:
        return conn.execute(query, params).fetchall()


def get_artifact(artifact_id: int) -> Optional[sqlite3.Row]:
    ensure_database()
    with get_connection() as conn:
        return conn.execute("SELECT * FROM artifacts WHERE id = ?", (artifact_id,)).fetchone()


def list_artifacts_for_reports(report_ids: List[int]) -> Dict[int, List[Dict[str, Any]]]:
    ensure_database()
    if not report_ids:
        return {}

    placeholders = ",".join("?" for _ in report_ids)
    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT * FROM artifacts
            WHERE competitor_report_id IN ({placeholders})
            ORDER BY competitor_report_id, artifact_kind, id
            """,
            report_ids,
        ).fetchall()

    grouped: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["competitor_report_id"]].append(dict(row))
    return grouped


def get_competitor_history(slug: str) -> Optional[Dict[str, Any]]:
    ensure_database()
    with get_connection() as conn:
        competitor = conn.execute(
            "SELECT * FROM competitors WHERE slug = ?", (slug,)
        ).fetchone()
        if not competitor:
            return None

        reports = conn.execute(
            """
            SELECT cr.*, sr.run_id, sr.generated_at
            FROM competitor_reports cr
            JOIN sweep_runs sr ON sr.id = cr.sweep_run_id
            WHERE cr.competitor_id = ?
            ORDER BY datetime(cr.sweep_run_date) DESC
            """,
            (competitor["id"],),
        ).fetchall()

        counts = conn.execute(
            """
            SELECT validation_status, COUNT(*) AS count
            FROM competitor_reports
            WHERE competitor_id = ?
            GROUP BY validation_status
            """,
            (competitor["id"],),
        ).fetchall()

    artifact_index = list_artifacts_for_reports([report["id"] for report in reports])
    return {
        "competitor": dict(competitor),
        "reports": reports,
        "counts": counts,
        "artifact_index": artifact_index,
    }


def report_counts() -> Dict[str, Any]:
    ensure_database()
    with get_connection() as conn:
        overview = conn.execute(
            """
            SELECT
                COUNT(*) AS report_count,
                COUNT(DISTINCT competitor_id) AS competitor_count,
                COUNT(DISTINCT sweep_run_id) AS run_count,
                SUM(findings_count) AS finding_count,
                MAX(updated_at) AS last_updated
            FROM competitor_reports
            """
        ).fetchone()
        artifacts = conn.execute("SELECT COUNT(*) AS count FROM artifacts").fetchone()

    return {"overview": overview, "artifacts": artifacts["count"]}


def _build_search_text(finding: Dict[str, Any]) -> str:
    parts = [
        finding["claim"],
        " ".join(finding.get("supporting_details", [])),
        " ".join(finding.get("why_it_matters", [])),
        " ".join(finding.get("suggested_positioning", [])),
    ]
    for source in finding.get("sources", []):
        parts.extend([source.get("title", ""), source.get("url", ""), source.get("notes", "")])
    return " ".join(part for part in parts if part)


def _group_sources_by_level(sources: Iterable[Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
    grouped: Dict[int, List[Dict[str, Any]]] = {1: [], 2: [], 3: []}
    for source in sources:
        grouped.setdefault(int(source["source_level"]), []).append(source)
    return grouped


def _resolve_date_window(filters: Dict[str, Any]) -> (Optional[str], Optional[str]):
    today = datetime.utcnow().date()
    preset = filters.get("preset")
    if preset in {"7d", "30d", "49d", "60d", "90d"}:
        days = int(preset[:-1])
        start_date = today - timedelta(days=days)
        return start_date.isoformat(), today.isoformat()

    custom_start = filters.get("start_date")
    custom_end = filters.get("end_date")
    return custom_start or None, custom_end or None


def _resolve_history_band(band: str) -> (Optional[int], Optional[int]):
    mapping = {
        "0-30": (0, 30),
        "30-49": (30, 49),
        "49-90": (49, 90),
    }
    return mapping.get(band, (None, None))
