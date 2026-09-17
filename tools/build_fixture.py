#!/usr/bin/env python3
"""Build an isolated Travel Lite fixture from an external trip.json.

This tool intentionally keeps fixture data outside the repository. It copies the
current static runtime assets into an external output directory and replaces only
trip.json. An optional fixed clock can be injected into the *fixture copy* for
historical day-of smoke tests.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import shutil
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("trip_json", type=Path, help="External trip.json fixture")
    parser.add_argument("output_dir", type=Path, help="Output directory outside this repository")
    parser.add_argument(
        "--now",
        dest="fixed_now",
        help="Optional ISO-8601 instant used only by the fixture copy (for historical smoke tests)",
    )
    parser.add_argument("--force", action="store_true", help="Replace an existing output directory")
    return parser.parse_args()


def inside(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_trip(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, dict):
        raise ValueError("trip.json root must be an object")
    if not isinstance(data.get("trip"), dict):
        raise ValueError("trip.json must contain a trip object")
    if not data["trip"].get("id"):
        raise ValueError("trip.id is required")
    if not isinstance(data.get("days"), list):
        raise ValueError("trip.json must contain a days array")

    dates = [day.get("date") for day in data["days"] if isinstance(day, dict)]
    if any(not date for date in dates):
        raise ValueError("every trip day must have a date")
    if len(dates) != len(set(dates)):
        raise ValueError("trip day dates must be unique")
    return data


def core_assets(sw_text: str) -> list[str]:
    match = re.search(r"const CORE = \[(.*?)\]\.map\(scopeUrl\);", sw_text, flags=re.S)
    if not match:
        raise ValueError("could not find the Service Worker CORE asset list")
    assets = re.findall(r'"\./([^\"]*)"', match.group(1))
    return [asset for asset in assets if asset and asset != "trip.json"]


def fixed_clock_script(iso_value: str) -> str:
    # The value is serialized as JSON so quotes/escapes cannot break the script.
    value = json.dumps(iso_value)
    return f'''<script data-travel-lite-fixture-clock>
/* Fixture-only fixed clock. Never copy this script back into the template. */
(() => {{
  const RealDate = Date;
  const fixed = RealDate.parse({value});
  if (!Number.isFinite(fixed)) throw new Error("Invalid fixture --now value");
  class FixtureDate extends RealDate {{
    constructor(...args) {{ super(...(args.length ? args : [fixed])); }}
    static now() {{ return fixed; }}
    static parse(value) {{ return RealDate.parse(value); }}
    static UTC(...args) {{ return RealDate.UTC(...args); }}
  }}
  Date = FixtureDate;
}})();
</script>'''


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    trip_path = args.trip_json.expanduser().resolve()
    output = args.output_dir.expanduser().resolve()

    if not trip_path.is_file():
        raise FileNotFoundError(trip_path)
    validate_trip(trip_path)

    # The whole point of this workflow is to keep realistic/private fixture data
    # out of the base template and its Git history.
    if inside(output, repo_root):
        raise ValueError(
            f"Refusing to build fixture inside repository: {output}\n"
            "Choose an external path such as /tmp/travel-lite-fixture."
        )

    if output.exists():
        if not args.force:
            raise FileExistsError(f"output exists: {output} (use --force to replace it)")
        shutil.rmtree(output)
    output.mkdir(parents=True)

    sw_path = repo_root / "sw.js"
    assets = core_assets(sw_path.read_text(encoding="utf-8"))

    copied: list[str] = []
    for relative in assets:
        source = repo_root / relative
        if not source.is_file():
            raise FileNotFoundError(f"Service Worker asset is missing: {relative}")
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied.append(relative)

    # `sw.js` itself is registered by index.html but is not part of CORE.
    shutil.copy2(sw_path, output / "sw.js")
    copied.append("sw.js")

    # GitHub Pages behavior is not required locally, but retaining .nojekyll makes
    # the output safe to publish in a disposable external repository if desired.
    nojekyll = repo_root / ".nojekyll"
    if nojekyll.exists():
        shutil.copy2(nojekyll, output / ".nojekyll")
        copied.append(".nojekyll")

    shutil.copy2(trip_path, output / "trip.json")

    if args.fixed_now:
        index_path = output / "index.html"
        index = index_path.read_text(encoding="utf-8")
        marker = '<script src="./bootstrap.js" defer></script>'
        if marker not in index:
            raise ValueError("could not find bootstrap.js load point for fixture clock injection")
        index = index.replace(marker, fixed_clock_script(args.fixed_now) + "\n    " + marker, 1)
        index_path.write_text(index, encoding="utf-8")

    print(f"Fixture: {output}")
    print(f"Trip: {trip_path}")
    print(f"Days: {len(validate_trip(trip_path).get('days', []))}")
    print(f"Runtime assets copied: {len(copied)}")
    if args.fixed_now:
        print(f"Fixed fixture clock: {args.fixed_now}")
    print()
    print(f"Preview: python3 -m http.server 8000 --directory {output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # concise CLI error without a Python traceback
        print(f"fixture build failed: {error}", file=sys.stderr)
        raise SystemExit(2)
