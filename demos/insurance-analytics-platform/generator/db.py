"""Postgres connection helper for the synthetic data generator.

Reads connection details from the project's .env - the same PG* variables
you've been passing to `psql` by hand.
"""

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv

# .env lives at the project root, two levels up from this file (generator/db.py).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def get_connection() -> psycopg.Connection:
    return psycopg.connect(
        host=os.environ["PGHOST"],
        port=os.environ.get("PGPORT", "5432"),
        dbname=os.environ["PGDATABASE"],
        user=os.environ["PGUSER"],
        password=os.environ["PGPASSWORD"],
        sslmode="require",
    )
