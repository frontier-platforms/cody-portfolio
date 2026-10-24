#!/usr/bin/env bash
# Creates the two virtual environments: Airflow and dbt are kept apart so their dependencies can't conflict.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
CONSTRAINTS="https://raw.githubusercontent.com/apache/airflow/constraints-3.3.2/constraints-3.12.txt"

uv venv -q --allow-existing -p 3.12 .venv
uv venv -q --allow-existing -p 3.12 .venv-dbt
VIRTUAL_ENV=.venv-dbt uv pip install -q -r requirements-dbt.txt
VIRTUAL_ENV=.venv uv pip install -q -r requirements-airflow.txt -c "$CONSTRAINTS"
(cd dbt && ../.venv-dbt/bin/dbt deps --quiet)
echo "Environments ready."
