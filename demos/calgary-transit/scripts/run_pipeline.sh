#!/usr/bin/env bash
# Runs the calgary_transit Airflow DAG once, end to end, without a long-running Airflow server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export AIRFLOW_HOME="${AIRFLOW_HOME:-$ROOT/.airflow}"
export AIRFLOW__CORE__DAGS_FOLDER="$ROOT/pipeline/dags"
export AIRFLOW__CORE__LOAD_EXAMPLES=False
export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
export WAREHOUSE_PATH="${WAREHOUSE_PATH:-$ROOT/data/warehouse.duckdb}"
mkdir -p "$ROOT/data"

"$ROOT/.venv/bin/airflow" db migrate > /dev/null
"$ROOT/.venv/bin/airflow" dags test calgary_transit "$(date -u +%Y-%m-%dT%H:%M:%S)"
