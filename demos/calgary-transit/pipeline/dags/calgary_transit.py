"""Calgary Transit data product: Calgary open data API -> bronze -> dbt silver/gold -> website."""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from pathlib import Path

from airflow.providers.standard.operators.bash import BashOperator
from airflow.sdk import DAG, task
from cosmos import DbtTaskGroup, ExecutionConfig, ProfileConfig, ProjectConfig, RenderConfig

REPO_ROOT = Path(__file__).resolve().parents[2]
DBT_DIR = REPO_ROOT / "dbt"
DBT_BIN = os.environ.get("DBT_EXECUTABLE", str(REPO_ROOT / ".venv-dbt" / "bin" / "dbt"))
WAREHOUSE = os.environ.setdefault("WAREHOUSE_PATH", str(REPO_ROOT / "data" / "warehouse.duckdb"))
DBT_ENV = {"WAREHOUSE_PATH": WAREHOUSE, "DBT_PROFILES_DIR": str(DBT_DIR)}

with DAG(
    dag_id="calgary_transit",
    description="Calgary Transit open data into a governed bronze/silver/gold DuckDB warehouse",
    schedule="0 10 * * *",
    start_date=datetime(2026, 10, 1),
    catchup=False,
    # DuckDB allows a single writer, so tasks run one at a time.
    max_active_tasks=1,
    default_args={"retries": 2, "retry_delay": timedelta(minutes=2)},
    tags=["calgary", "transit", "dbt"],
) as dag:

    @task
    def extract_load(table: str) -> dict:
        from pipeline.ingestion.socrata import load

        return load(table)

    bronze = [
        extract_load.override(task_id=f"bronze_{t}")(t)
        for t in ["ridership_monthly", "service_hours_monthly", "service_requests_311"]
    ]

    # Tier 1 contract: a stale 311 feed fails the run, so the website keeps the last good data.
    source_freshness = BashOperator(
        task_id="check_source_freshness",
        bash_command=f"cd '{DBT_DIR}' && '{DBT_BIN}' source freshness",
        env=DBT_ENV,
        append_env=True,
    )

    transform = DbtTaskGroup(
        group_id="dbt",
        project_config=ProjectConfig(DBT_DIR, env_vars=DBT_ENV),
        profile_config=ProfileConfig(
            profile_name="calgary_transit",
            target_name="dev",
            profiles_yml_filepath=DBT_DIR / "profiles.yml",
        ),
        execution_config=ExecutionConfig(dbt_executable_path=DBT_BIN),
        # Tests spanning several models (the reconciliation test) wait for all of them, not just one parent.
        render_config=RenderConfig(group_nodes_by_folder=True, should_detach_multiple_parents_tests=True),
    )

    # Writes target/manifest.json (read by publish) and target/static_index.html (the dbt docs site).
    parse_docs = BashOperator(
        task_id="generate_dbt_docs",
        bash_command=f"cd '{DBT_DIR}' && '{DBT_BIN}' docs generate --static --quiet",
        env=DBT_ENV,
        append_env=True,
    )

    @task
    def publish_gold() -> dict:
        from pipeline.publish import publish

        return publish()

    bronze[0] >> bronze[1] >> bronze[2] >> source_freshness >> transform >> parse_docs >> publish_gold()
