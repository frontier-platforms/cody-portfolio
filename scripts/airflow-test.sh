#!/bin/sh
# Runs the lab_refresh DAG once with `airflow dags test`: a real Airflow run,
# with a throwaway SQLite metadata database and no scheduler or webserver.
# GitHub Actions runs this weekly (.github/workflows/refresh-data.yml).
set -e
export AIRFLOW_HOME="${AIRFLOW_HOME:-$PWD/.cache/airflow}"
export AIRFLOW__CORE__DAGS_FOLDER="$PWD/airflow/dags"
export AIRFLOW__CORE__LOAD_EXAMPLES=False
uv run --group airflow airflow db migrate > /dev/null
uv run --group airflow airflow dags test lab_refresh
