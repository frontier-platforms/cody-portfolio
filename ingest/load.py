"""Load raw extracts into the warehouse as bronze tables.

Bronze table shapes come from dbt's sources.yml, so ingest, dbt and the
browser's live runs all agree on one definition of each raw table.
"""

from __future__ import annotations

import json
from pathlib import Path

import duckdb
import yaml

ROOT = Path(__file__).resolve().parent.parent
DBT_MODELS = ROOT / "dbt" / "models"
CACHE = ROOT / ".cache" / "data"
WAREHOUSE = ROOT / "lab.duckdb"


def source_columns(pipeline: str) -> dict[str, list[tuple[str, str]]]:
    """Raw table name -> [(column, type)] from dbt/models/<pipeline>/_sources.yml."""
    spec = yaml.safe_load((DBT_MODELS / pipeline / "_sources.yml").read_text())
    tables: dict[str, list[tuple[str, str]]] = {}
    for source in spec["sources"]:
        for table in source["tables"]:
            tables[table["name"]] = [(c["name"], c["data_type"].upper()) for c in table["columns"]]
    return tables


def raw_file(pipeline: str, table: str) -> Path:
    return CACHE / f"{pipeline}-{table}.json"


def write_raw(pipeline: str, tables: dict[str, list[dict]]) -> None:
    """Save extracted rows as JSON arrays, one file per raw table."""
    CACHE.mkdir(parents=True, exist_ok=True)
    for name, rows in tables.items():
        raw_file(pipeline, name).write_text(json.dumps(rows))


def load_raw(pipeline: str, warehouse: Path = WAREHOUSE) -> dict[str, int]:
    """Create or replace each bronze table from its cached JSON. Returns row counts."""
    counts: dict[str, int] = {}
    with duckdb.connect(str(warehouse)) as con:
        con.execute(f"create schema if not exists {pipeline}")
        for table, columns in source_columns(pipeline).items():
            cols = ", ".join(f"'{name}': '{dtype}'" for name, dtype in columns)
            con.execute(
                f"create or replace table {pipeline}.{table} as "
                f"select * from read_json('{raw_file(pipeline, table)}', format = 'array', columns = {{{cols}}})"
            )
            counts[table] = con.execute(f"select count(*) from {pipeline}.{table}").fetchone()[0]
    return counts
