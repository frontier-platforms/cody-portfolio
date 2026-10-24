"""Extract City of Calgary open data (Socrata SODA API) into the bronze layer of the DuckDB warehouse."""

from __future__ import annotations

import datetime as dt
import json
import os
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path

import duckdb
import requests

BASE_URL = "https://data.calgary.ca/resource"
PAGE_SIZE = 50_000
INCREMENTAL_LOOKBACK_DAYS = 7
REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Dataset:
    table: str
    resource_id: str
    order_by: str
    where: str | None = None
    incremental_column: str | None = None


DATASETS = {
    d.table: d
    for d in [
        Dataset("ridership_monthly", "iema-jbc4", order_by="date"),
        Dataset("service_hours_monthly", "64iy-rpqq", order_by="date"),
        Dataset(
            "service_requests_311",
            "iahh-g8bj",
            order_by="service_request_id",
            # 311 covers every City department; only the transit slice is landed.
            where="agency_responsible like '%Calgary Transit%' OR upper(service_name) like '%TRANSIT%'",
            incremental_column="updated_date",
        ),
    ]
}


def warehouse_path() -> str:
    return os.environ.get("WAREHOUSE_PATH", str(REPO_ROOT / "data" / "warehouse.duckdb"))


def _ensure_bronze(con: duckdb.DuckDBPyConnection, table: str) -> None:
    con.execute("create schema if not exists bronze")
    con.execute(
        f"""
        create table if not exists bronze.{table} (
            _batch_id varchar not null,
            _loaded_at timestamptz not null,
            _load_mode varchar not null,
            record json not null
        )
        """
    )
    con.execute(
        """
        create table if not exists bronze._load_log (
            batch_id varchar primary key,
            source_table varchar not null,
            resource_id varchar not null,
            load_mode varchar not null,
            watermark varchar,
            rows_loaded integer not null,
            started_at timestamptz not null,
            finished_at timestamptz not null
        )
        """
    )


def _watermark(con: duckdb.DuckDBPyConnection, ds: Dataset) -> str | None:
    if not ds.incremental_column or os.environ.get("FULL_REFRESH") == "1":
        return None
    latest = con.execute(
        f"select max(record->>'{ds.incremental_column}') from bronze.{ds.table}"
    ).fetchone()[0]
    if latest is None:
        return None
    since = dt.datetime.fromisoformat(latest) - dt.timedelta(days=INCREMENTAL_LOOKBACK_DAYS)
    return since.strftime("%Y-%m-%dT%H:%M:%S")


def _fetch(ds: Dataset, watermark: str | None, out_file) -> int:
    clauses = [f"({ds.where})"] if ds.where else []
    if watermark:
        clauses.append(f"{ds.incremental_column} >= '{watermark}'")
    params = {"$order": ds.order_by, "$limit": PAGE_SIZE}
    if clauses:
        params["$where"] = " AND ".join(clauses)
    headers = {"X-App-Token": os.environ["SOCRATA_APP_TOKEN"]} if os.environ.get("SOCRATA_APP_TOKEN") else {}

    total, offset = 0, 0
    with requests.Session() as s:
        while True:
            resp = s.get(
                f"{BASE_URL}/{ds.resource_id}.json",
                params={**params, "$offset": offset},
                headers=headers,
                timeout=120,
            )
            resp.raise_for_status()
            page = resp.json()
            for row in page:
                out_file.write(json.dumps(row) + "\n")
            total += len(page)
            if len(page) < PAGE_SIZE:
                return total
            offset += PAGE_SIZE


def load(table: str) -> dict:
    ds = DATASETS[table]
    started = dt.datetime.now(dt.timezone.utc)
    batch_id = f"{table}_{started:%Y%m%dT%H%M%S}_{uuid.uuid4().hex[:6]}"

    with duckdb.connect(warehouse_path()) as con:
        _ensure_bronze(con, table)
        watermark = _watermark(con, ds)

    mode = "incremental" if watermark else "full"
    with tempfile.NamedTemporaryFile("w", suffix=".ndjson", delete=False) as f:
        rows = _fetch(ds, watermark, f)
        tmp_path = f.name

    try:
        with duckdb.connect(warehouse_path()) as con:
            con.execute("begin")
            if mode == "full":
                con.execute(f"delete from bronze.{ds.table}")
            if rows:
                con.execute(
                    f"""
                    insert into bronze.{ds.table}
                    select ?, ?, ?, json
                    from read_json_objects(?, format = 'newline_delimited')
                    """,
                    [batch_id, started, mode, tmp_path],
                )
            con.execute(
                "insert into bronze._load_log values (?, ?, ?, ?, ?, ?, ?, ?)",
                [batch_id, ds.table, ds.resource_id, mode, watermark, rows, started,
                 dt.datetime.now(dt.timezone.utc)],
            )
            con.execute("commit")
    finally:
        os.unlink(tmp_path)

    result = {"table": ds.table, "batch_id": batch_id, "mode": mode, "watermark": watermark, "rows": rows}
    print(result)
    return result


if __name__ == "__main__":
    import sys

    for name in sys.argv[1:] or DATASETS:
        load(name)
