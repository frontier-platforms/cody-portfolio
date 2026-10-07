"""The steps of the weekly refresh. The Airflow DAG (airflow/dags/lab_refresh.py)
and the local runner (pipeline/run.py) both call these functions, so what runs
in CI is exactly what runs on a laptop.

    extract → load raw → dbt build (models + tests + contracts) → train model → publish
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from ingest.extract import EXTRACTORS
from ingest.load import load_raw, raw_file, source_columns, write_raw

ROOT = Path(__file__).resolve().parent.parent
WAREHOUSE = Path(os.environ.get("LAB_DUCKDB", ROOT / "lab.duckdb"))
DBT_DIR = ROOT / "dbt"
PIPELINES = ["permits", "housing", "flames"]


def extract(pipeline: str, use_cache: bool = False) -> dict[str, int]:
    """Pull raw rows from the source API and save them as JSON. With use_cache, reuse the last extract."""
    tables = source_columns(pipeline)
    use_cache = use_cache or os.environ.get("LAB_EXTRACT_CACHE") == "1"
    if use_cache and all(raw_file(pipeline, t).exists() for t in tables):
        print(f"  extract  {pipeline}: reusing the last extract")
        return {t: len(json.loads(raw_file(pipeline, t).read_text())) for t in tables}
    data = EXTRACTORS[pipeline]()
    write_raw(pipeline, data)
    return {t: len(rows) for t, rows in data.items()}


def load(pipeline: str) -> dict[str, int]:
    """Load the saved JSON into bronze tables in the warehouse."""
    counts = load_raw(pipeline, WAREHOUSE)
    for table, n in counts.items():
        print(f"  bronze   {pipeline}.{table}: {n:,} rows")
    return counts


def dbt(*args: str) -> None:
    """Run a dbt command against the warehouse. A failing error-level test raises, which stops the run."""
    env = {**os.environ, "LAB_DUCKDB": str(WAREHOUSE)}
    cmd = ["dbt", *args, "--project-dir", str(DBT_DIR), "--profiles-dir", str(DBT_DIR)]
    subprocess.run(cmd, check=True, env=env, cwd=ROOT)


def dbt_build() -> None:
    dbt("build")


def dbt_docs() -> None:
    # Its own target path: docs generate rewrites run_results.json, and publish
    # needs the test results from dbt build.
    dbt("docs", "generate", "--static", "--target-path", "target/docs")


def train_model() -> dict:
    from ml.train import train_production

    return train_production(WAREHOUSE)


def publish(model_summary: dict | None, extract_counts: dict[str, dict[str, int]]) -> None:
    from pipeline.publish import publish_all

    publish_all(WAREHOUSE, model_summary, extract_counts)
