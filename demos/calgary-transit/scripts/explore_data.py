"""Open the warehouse in the DuckDB UI (http://localhost:4213), read-only. Ctrl+C to stop."""

import os
import time
from pathlib import Path

import duckdb

path = os.environ.get("WAREHOUSE_PATH", str(Path(__file__).resolve().parents[1] / "data" / "warehouse.duckdb"))
con = duckdb.connect(path, read_only=True)
con.execute("install ui; load ui; call start_ui()")
print(f"DuckDB UI running at http://localhost:4213 on {path} (read-only). Ctrl+C to stop.")
try:
    while True:
        time.sleep(3600)
except KeyboardInterrupt:
    con.close()
