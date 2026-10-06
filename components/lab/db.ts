"use client";

import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import type { Engine } from "@/lib/pipelines/runner";
import { telemetry } from "@/lib/telemetry";

/**
 * One DuckDB-WASM instance per tab, created on first use. The engine loads
 * from jsDelivr, and each table is pulled from /data as Parquet only when a
 * query first needs it, so visitors who never open a demo download nothing.
 * Every query and load is recorded in the telemetry store.
 */
const TABLES = {
  permits: "/data/permits.parquet",
  flames_games: "/data/flames-games.parquet",
  flames_shots: "/data/flames-shots.parquet",
} as const;

export type TableName = keyof typeof TABLES;
export type Row = Record<string, string | number | boolean | null>;

let dbPromise: Promise<AsyncDuckDB> | null = null;
const loaded = new Map<TableName, Promise<void>>();

async function createDb() {
  const started = performance.now();
  const duckdb = await import("@duckdb/duckdb-wasm");
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  // Workers must be same-origin, so wrap the CDN script in a local blob.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }),
  );
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), new Worker(workerUrl));
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  const build = bundle.mainModule.includes("-eh") ? "WASM EH" : "WASM MVP";
  telemetry.engine(performance.now() - started, `DuckDB ${await db.getVersion()} ${build}`);
  return db;
}

export function getDb() {
  dbPromise ??= createDb();
  return dbPromise;
}

async function loadTable(name: TableName) {
  const db = await getDb();
  const fetchStarted = performance.now();
  const res = await fetch(TABLES[name]);
  if (!res.ok) throw new Error(`Could not load ${name}`);
  const buffer = new Uint8Array(await res.arrayBuffer());
  // Read the size now: registering transfers the buffer to the worker and empties it.
  const bytes = buffer.byteLength;
  const fetchMs = performance.now() - fetchStarted;
  const loadStarted = performance.now();
  await db.registerFileBuffer(`${name}.parquet`, buffer);
  const con = await db.connect();
  await con.query(`CREATE TABLE ${name} AS SELECT * FROM '${name}.parquet'`);
  await con.close();
  telemetry.load({ table: name, bytes, fetchMs, loadMs: performance.now() - loadStarted });
}

export function ensureTables(names: TableName[]) {
  return Promise.all(
    names.map((n) => {
      if (!loaded.has(n)) loaded.set(n, loadTable(n));
      return loaded.get(n)!;
    }),
  );
}

/** Tables a query references, so only those get downloaded. */
export function tablesIn(sql: string): TableName[] {
  return (Object.keys(TABLES) as TableName[]).filter((t) => new RegExp(`\\b${t}\\b`, "i").test(sql));
}

function toRows(table: { schema: { fields: { name: string }[] }; toArray(): { toJSON(): unknown }[] }) {
  const columns = table.schema.fields.map((f) => f.name);
  const rows = table.toArray().map((r) => {
    const obj = r.toJSON() as Record<string, unknown>;
    const out: Row = {};
    for (const c of columns) {
      const v = obj[c];
      out[c] =
        typeof v === "bigint"
          ? Number(v)
          : v instanceof Date
            ? v.toISOString().slice(0, 10)
            : (v as Row[string]);
    }
    return out;
  });
  return { rows, columns };
}

/** Runs a query and returns plain JSON-safe rows (BigInts become numbers). */
export async function runQuery(
  sql: string,
  label = "ad hoc",
): Promise<{ rows: Row[]; columns: string[]; ms: number }> {
  await ensureTables(tablesIn(sql));
  const db = await getDb();
  const con = await db.connect();
  const started = performance.now();
  try {
    const result = toRows(await con.query(sql));
    const ms = performance.now() - started;
    telemetry.query({ label, sql, ms, rows: result.rows.length });
    return { ...result, ms };
  } catch (e) {
    telemetry.query({ label, sql, ms: performance.now() - started, rows: 0, error: (e as Error).message });
    throw e;
  } finally {
    await con.close();
  }
}

/* ---- Data version: bumps after a live pipeline run so dashboards re-query. ---- */

let version = 0;
const versionListeners = new Set<() => void>();

export const dataVersion = {
  subscribe(listener: () => void) {
    versionListeners.add(listener);
    return () => versionListeners.delete(listener);
  },
  get: () => version,
  bump() {
    version++;
    versionListeners.forEach((l) => l());
  },
};

/** Adapter so the shared pipeline runner can drive DuckDB-WASM. */
export async function browserEngine(
  label: string,
): Promise<Engine & { registerJson(file: string, rows: unknown[]): Promise<void> }> {
  const db = await getDb();
  return {
    async exec(sql) {
      const con = await db.connect();
      const started = performance.now();
      try {
        await con.query(sql);
        telemetry.query({ label, sql, ms: performance.now() - started, rows: 0 });
      } finally {
        await con.close();
      }
    },
    async query(sql) {
      return (await runQuery(sql, label)).rows;
    },
    async registerJson(file, rows) {
      await db.registerFileText(file, JSON.stringify(rows));
    },
  };
}
