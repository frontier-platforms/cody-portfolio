import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { Type, type Table } from "apache-arrow";
import { withBase } from "@/lib/paths";

export const GOLD_TABLES = [
  "transit_monthly_kpis",
  "ridership_by_fare_product",
  "service_requests_monthly",
  "service_requests_by_community",
  "data_contract_status",
] as const;

export type Row = Record<string, string | number | boolean | null>;
export type QueryResult = { columns: string[]; rows: Row[] };

let ready: Promise<AsyncDuckDBConnection> | null = null;

async function init(): Promise<AsyncDuckDBConnection> {
  const duckdb = await import("@duckdb/duckdb-wasm");
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }),
  );
  const db: AsyncDuckDB = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), new Worker(workerUrl));
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  // sum() returns HUGEINT; return plain JS numbers instead of Arrow BigInt / Decimal values.
  await db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } });

  const conn = await db.connect();
  for (const name of GOLD_TABLES) {
    await db.registerFileURL(
      `${name}.parquet`,
      `${window.location.origin}${withBase(`/data/${name}.parquet`)}`,
      duckdb.DuckDBDataProtocol.HTTP,
      false,
    );
    await conn.query(`create table ${name} as select * from read_parquet('${name}.parquet')`);
  }
  // The gold tables are now in memory; nothing else (files, URLs, extensions) is reachable.
  await conn.query("set enable_external_access = false");
  await conn.query("set lock_configuration = true");
  return conn;
}

export function getConnection(): Promise<AsyncDuckDBConnection> {
  ready ??= init().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

function toPlain(value: unknown, typeId: Type): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return Number(value);
  if (typeId === Type.Date || typeId === Type.Timestamp) {
    const ms = value instanceof Date ? value.getTime() : Number(value);
    const iso = new Date(ms).toISOString();
    return typeId === Type.Date ? iso.slice(0, 10) : iso.slice(0, 19).replace("T", " ");
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") return value;
  return String(value);
}

export function tableToRows(table: Table): QueryResult {
  const fields = table.schema.fields;
  const columns = fields.map((f) => f.name);
  const rows: Row[] = [];
  for (let i = 0; i < table.numRows; i++) {
    const record = table.get(i);
    const row: Row = {};
    fields.forEach((f) => {
      row[f.name] = toPlain(record?.[f.name], f.type.typeId);
    });
    rows.push(row);
  }
  return { columns, rows };
}

export async function query(sql: string): Promise<QueryResult> {
  const conn = await getConnection();
  return tableToRows(await conn.query(sql));
}
