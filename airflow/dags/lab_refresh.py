"""
### Lab refresh

Weekly refresh of the three Lab datasets on cody-portfolio.

1. **Extract** each source API to JSON (in parallel).
2. **Load** the JSON into bronze tables in the DuckDB warehouse (one at a time; DuckDB has one writer).
3. **dbt build**: silver and gold models, data tests and enforced contracts. An error-level test fails the task, and nothing downstream runs.
4. **Train** the scikit-learn value model on the gold housing table.
5. **dbt docs** for the lineage site.
6. **Publish** Parquet, the run manifest and dbt-compiled SQL for the website.

Runs in GitHub Actions with `airflow dags test lab_refresh`, so there's no Airflow server to host.
The same DAG would run unchanged on any Airflow deployment.
"""

from __future__ import annotations

import sys
from datetime import timedelta
from itertools import pairwise
from pathlib import Path

import pendulum
from airflow.sdk import dag, task

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO))

from pipeline import tasks as steps

DEFAULT_ARGS = {"owner": "cody", "retries": 2, "retry_delay": timedelta(minutes=2)}


@dag(
    dag_id="lab_refresh",
    schedule="0 10 * * 1",  # Mondays 10:00 UTC
    start_date=pendulum.datetime(2026, 10, 1, tz="UTC"),
    catchup=False,
    max_active_runs=1,
    default_args=DEFAULT_ARGS,
    doc_md=__doc__,
    tags=["lab", "dbt", "duckdb", "ml"],
)
def lab_refresh():
    @task
    def extract(pipeline: str) -> dict[str, int]:
        return steps.extract(pipeline)

    @task
    def load(pipeline: str, extracted: dict[str, int]) -> dict[str, int]:
        return steps.load(pipeline)

    @task(retries=0)
    def dbt_build() -> None:
        steps.dbt_build()

    @task
    def train_value_model() -> dict:
        return steps.train_model()

    @task
    def dbt_docs() -> None:
        steps.dbt_docs()

    @task(retries=0)
    def publish(model_summary: dict, permits: dict, housing: dict, flames: dict) -> None:
        steps.publish(model_summary, {"permits": permits, "housing": housing, "flames": flames})

    extracted = {p: extract.override(task_id=f"extract_{p}")(p) for p in steps.PIPELINES}

    # DuckDB allows one writer, so loads run one after another.
    loads = [load.override(task_id=f"load_{p}")(p, extracted[p]) for p in steps.PIPELINES]
    for upstream, downstream in pairwise(loads):
        upstream >> downstream

    build = dbt_build()
    loads[-1] >> build
    model = train_value_model()
    docs = dbt_docs()
    build >> [model, docs]
    done = publish(model, **extracted)
    docs >> done


lab_refresh()
