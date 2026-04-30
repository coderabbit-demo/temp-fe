import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.competitor_dashboard_db import get_db_path, ingest_payload
from services.competitor_dashboard_seed import build_seed_payloads


def main():
    parser = argparse.ArgumentParser(description="Seed the Competitor Research Dashboard.")
    parser.add_argument("--reset", action="store_true", help="Delete existing demo DB and artifacts before seeding.")
    args = parser.parse_args()

    workspace_root = ROOT.parents[2]
    artifact_root = workspace_root / "outputs" / "competitor-dashboard-artifacts"
    db_path = get_db_path()

    if args.reset:
        if db_path.exists():
            db_path.unlink()
        if artifact_root.exists():
            shutil.rmtree(artifact_root)

    payloads = build_seed_payloads(artifact_root)
    inserted = 0
    for payload in payloads:
        try:
            ingest_payload(payload)
            inserted += 1
        except ValueError:
            continue

    print(f"Seed complete. Inserted {inserted} sweep runs.")
    print(f"Database: {db_path}")
    print(f"Artifacts: {artifact_root}")


if __name__ == "__main__":
    main()
