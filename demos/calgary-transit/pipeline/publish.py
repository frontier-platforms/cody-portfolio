"""Publish the gold layer to the website: one Parquet file per gold table plus a catalog for the AI agent.

Only gold leaves the warehouse. Bronze and silver are never published, so the website and the agent
physically cannot read raw or intermediate data.
"""

from __future__ import annotations

import datetime as dt
import json
import shutil
from pathlib import Path

import duckdb

from pipeline.ingestion.socrata import REPO_ROOT, warehouse_path

OUT_DIR = REPO_ROOT / "web" / "public" / "data"
MANIFEST = REPO_ROOT / "dbt" / "target" / "manifest.json"
DBT_DOCS = REPO_ROOT / "dbt" / "target" / "static_index.html"


def _dbt_docs() -> dict[str, dict]:
    manifest = json.loads(MANIFEST.read_text())
    return {
        node["name"]: node
        for node in manifest["nodes"].values()
        if node["resource_type"] == "model" and node["schema"] == "gold"
    }


def publish() -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    docs = _dbt_docs()
    tables = []

    with duckdb.connect(warehouse_path(), read_only=True) as con:
        names = [r[0] for r in con.execute(
            "select table_name from information_schema.tables where table_schema = 'gold' order by 1"
        ).fetchall()]
        for name in names:
            out = OUT_DIR / f"{name}.parquet"
            con.execute(f"copy (select * from gold.{name}) to '{out}' (format parquet, compression zstd)")
            node = docs.get(name, {})
            col_docs = node.get("columns", {})
            columns = [
                {"name": col, "type": typ, "description": col_docs.get(col, {}).get("description", "")}
                for col, typ in con.execute(
                    "select column_name, data_type from information_schema.columns "
                    "where table_schema = 'gold' and table_name = ? order by ordinal_position",
                    [name],
                ).fetchall()
            ]
            tables.append({
                "name": name,
                "file": f"{name}.parquet",
                "description": " ".join(node.get("description", "").split()),
                "row_count": con.execute(f"select count(*) from gold.{name}").fetchone()[0],
                "columns": columns,
            })

        loads = con.execute(
            "select source_table, strftime(timezone('UTC', max(finished_at)), '%Y-%m-%dT%H:%M:%SZ') "
            "from bronze._load_log group by 1 order by 1"
        ).fetchall()

    catalog = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "last_loaded": dict(loads),
        "tables": tables,
    }
    (OUT_DIR / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n")
    # The dbt docs site is served by the demo itself at /dbt-docs.html.
    if DBT_DOCS.exists():
        shutil.copyfile(DBT_DOCS, REPO_ROOT / "web" / "public" / "dbt-docs.html")
    summary = {t["name"]: t["row_count"] for t in tables}
    print(summary)
    return summary


if __name__ == "__main__":
    publish()
