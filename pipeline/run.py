"""Run the whole refresh without Airflow, using the same task functions as the DAG.

uv run python -m pipeline.run              full refresh: extract, build, test, train, publish
uv run python -m pipeline.run --cached     reuse the last extract (no API calls)
uv run python -m pipeline.run --no-publish build the warehouse only (lab.duckdb), touch nothing else
"""

from __future__ import annotations

import argparse

from pipeline import tasks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--cached", action="store_true", help="reuse the last extract instead of calling the APIs"
    )
    parser.add_argument("--no-publish", action="store_true", help="build lab.duckdb only")
    args = parser.parse_args()

    counts = {}
    for pid in tasks.PIPELINES:
        print(f"\n▶ {pid}")
        counts[pid] = tasks.extract(pid, use_cache=args.cached)
        tasks.load(pid)

    print("\n▶ dbt build")
    tasks.dbt_build()
    if args.no_publish:
        print("\n✓ lab.duckdb: every layer of every pipeline. Open it with: duckdb -ui lab.duckdb")
        return

    print("\n▶ train")
    summary = tasks.train_model()
    print("\n▶ docs")
    tasks.dbt_docs()
    print("\n▶ publish")
    tasks.publish(summary, counts)


if __name__ == "__main__":
    main()
