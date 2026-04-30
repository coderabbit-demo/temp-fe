import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.competitor_dashboard_db import ingest_payload


def main():
    parser = argparse.ArgumentParser(description="Ingest one competitor sweep JSON payload.")
    parser.add_argument("payload_path", help="Path to the JSON payload to ingest.")
    args = parser.parse_args()

    payload_file = Path(args.payload_path).expanduser().resolve()
    with payload_file.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    result = ingest_payload(payload)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
