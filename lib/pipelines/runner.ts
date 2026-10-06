import type { Model, ModelResult, Pipeline, SourceTable, Test, TestResult } from "./types";

/**
 * The only thing the runner needs from a database. Implemented by
 * @duckdb/node-api in scripts/run-pipeline.ts and by DuckDB-WASM in the Lab.
 */
export interface Engine {
  exec(sql: string): Promise<void>;
  query(sql: string): Promise<Record<string, unknown>[]>;
}

export type RunEvent =
  | {
      type: "model";
      name: string;
      layer: Model["layer"];
      status: "running" | "done";
      rows?: number;
      ms?: number;
    }
  | { type: "test"; result: TestResult };

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Resolves {{ ref('x') }} to a schema-qualified table name, dbt style. */
export function render(sql: string, schema: string) {
  return sql.replace(/\{\{\s*ref\('([a-z_]+)'\)\s*\}\}/g, (_, name: string) => `${schema}.${name}`);
}

/** Loads one raw JSON array file into a typed bronze table. */
export function bronzeSql(source: SourceTable, file: string, schema: string) {
  const columns = source.columns.map((c) => `'${c.name}': '${c.type}'`).join(", ");
  return `CREATE OR REPLACE TABLE ${schema}.${source.name} AS
SELECT * FROM read_json('${file}', format = 'array', columns = {${columns}})`;
}

/** Runs models in declared order, failing fast if a dependency hasn't run yet. */
export async function runModels(
  engine: Engine,
  pipeline: Pipeline,
  { schema, stats = false, onEvent }: { schema: string; stats?: boolean; onEvent?: (e: RunEvent) => void },
): Promise<ModelResult[]> {
  const built = new Set(pipeline.sources.map((s) => s.name));
  const results: ModelResult[] = [];

  for (const model of pipeline.models) {
    const missing = model.dependsOn.filter((d) => !built.has(d));
    if (missing.length) throw new Error(`${model.name} depends on ${missing.join(", ")}, which hasn't run`);

    onEvent?.({ type: "model", name: model.name, layer: model.layer, status: "running" });
    const started = now();
    await engine.exec(`CREATE OR REPLACE TABLE ${schema}.${model.name} AS ${render(model.sql, schema)}`);
    const [{ n }] = await engine.query(`SELECT count(*)::INTEGER AS n FROM ${schema}.${model.name}`);
    const result: ModelResult = {
      name: model.name,
      layer: model.layer,
      rows: Number(n),
      ms: now() - started,
    };

    if (stats) {
      const summary = await engine.query(`SUMMARIZE ${schema}.${model.name}`);
      result.columns = summary.map((c) => ({
        name: String(c.column_name),
        type: String(c.column_type),
        nullPct: Number(String(c.null_percentage).replace("%", "")),
      }));
    }

    built.add(model.name);
    results.push(result);
    onEvent?.({
      type: "model",
      name: model.name,
      layer: model.layer,
      status: "done",
      rows: result.rows,
      ms: result.ms,
    });
  }
  return results;
}

/** Compiles a declarative test to SQL returning one row: `failures`. */
export function compileTest(test: Test, schema: string, today: string): string {
  const t = `${schema}.${test.model}`;
  switch (test.kind) {
    case "not_null":
      return `SELECT count(*) AS failures FROM ${t} WHERE ${test.column} IS NULL`;
    case "unique":
      return `SELECT count(*) AS failures FROM (SELECT ${test.column} FROM ${t} GROUP BY 1 HAVING count(*) > 1)`;
    case "accepted_values": {
      const list = test.values.map((v) => (typeof v === "number" ? v : `'${v}'`)).join(", ");
      return `SELECT count(*) AS failures FROM ${t} WHERE ${test.column} NOT IN (${list})`;
    }
    case "expression":
      return `SELECT count(*) AS failures FROM ${t} WHERE NOT (${test.expression})`;
    case "relationship":
      return `SELECT count(*) AS failures FROM ${t} c
WHERE c.${test.column} IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ${schema}.${test.to.model} p WHERE p.${test.to.column} = c.${test.column})`;
    case "row_count":
      return `SELECT CASE WHEN count(*) >= ${test.min} THEN 0 ELSE 1 END AS failures FROM ${t}`;
    case "freshness":
      return `SELECT CASE WHEN max(${test.column}) >= DATE '${today}' - INTERVAL ${test.maxAgeDays} DAY THEN 0 ELSE 1 END AS failures FROM ${t}`;
    case "custom":
      return render(test.sql, schema);
  }
}

export async function runTests(
  engine: Engine,
  pipeline: Pipeline,
  { schema, today, onEvent }: { schema: string; today: string; onEvent?: (e: RunEvent) => void },
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const test of pipeline.tests) {
    const sql = compileTest(test, schema, today);
    const started = now();
    const [row] = await engine.query(sql);
    const failures = Number(row?.failures ?? 0);
    const result: TestResult = {
      name: test.name,
      model: test.model,
      kind: test.kind,
      severity: test.severity,
      status: failures === 0 ? "pass" : test.severity === "error" ? "fail" : "warn",
      failures,
      ms: now() - started,
      sql: compileTest(test, "main", today),
    };
    results.push(result);
    onEvent?.({ type: "test", result });
  }
  return results;
}
