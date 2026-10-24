#!/usr/bin/env bash
# Starts Airflow locally (http://localhost:8080) to browse the DAG graph, runs and task logs. Ctrl+C to stop.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export AIRFLOW_HOME="${AIRFLOW_HOME:-$ROOT/.airflow}"
export AIRFLOW__CORE__DAGS_FOLDER="$ROOT/pipeline/dags"
export AIRFLOW__CORE__LOAD_EXAMPLES=False
# Local only: skip the login screen.
export AIRFLOW__CORE__SIMPLE_AUTH_MANAGER_ALL_ADMINS=True
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export WAREHOUSE_PATH="${WAREHOUSE_PATH:-$ROOT/data/warehouse.duckdb}"
# standalone launches its components by calling `airflow` from PATH.
export PATH="$ROOT/.venv/bin:$PATH"

exec airflow standalone
