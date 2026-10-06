/**
 * Builds lab.duckdb: every served Lab table in one DuckDB file, organized by
 * pipeline schema, with table and column comments from the pipeline
 * definitions, plus the last run's tests and model stats from manifest.json.
 *
 * For local exploration only (it's gitignored and rebuilt from the Parquet
 * files). Usage: npm run data:db, then `duckdb -ui lab.duckdb`.
 */
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { pipelines } from "../lib/pipelines/index";
import type { Manifest } from "../lib/pipelines/types";

const DATA_DIR = path.resolve("public/data");
const DB_FILE = path.resolve("lab.duckdb");

const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;

async function main() {
  await rm(DB_FILE, { force: true });
  await rm(`${DB_FILE}.wal`, { force: true });
  const instance = await DuckDBInstance.create(DB_FILE);
  const con = await instance.connect();
  const manifest = JSON.parse(await readFile(path.join(DATA_DIR, "manifest.json"), "utf8")) as Manifest;

  for (const pipeline of Object.values(pipelines)) {
    const schema = pipeline.id;
    await con.run(`CREATE SCHEMA ${schema}`);

    for (const model of pipeline.models.filter((m) => m.served)) {
      const file = path.join(DATA_DIR, model.served!.file);
      await con.run(`CREATE TABLE ${schema}.${model.name} AS SELECT * FROM read_parquet(${quote(file)})`);
      await con.run(`COMMENT ON TABLE ${schema}.${model.name} IS ${quote(model.description)}`);
      const count = await con.runAndReadAll(`SELECT count(*)::INTEGER AS n FROM ${schema}.${model.name}`);
      console.log(`  ${schema}.${model.name}: ${count.getRowObjects()[0].n} rows`);
    }

    const run = manifest.pipelines[pipeline.id];
    if (!run) continue;
    const tests = run.tests.map((t) => ({ ...t, run_at: run.runAt }));
    await con.run(
      `CREATE TABLE ${schema}._tests AS SELECT * FROM (VALUES ${tests
        .map(
          (t) =>
            `(${quote(t.name)}, ${quote(t.model)}, ${quote(t.kind)}, ${quote(t.severity)}, ${quote(t.status)}, ${t.failures}, ${quote(t.sql)}, TIMESTAMP ${quote(t.run_at)})`,
        )
        .join(", ")}) AS t(test, model, kind, severity, status, failures, sql, run_at)`,
    );
    await con.run(
      `COMMENT ON TABLE ${schema}._tests IS 'Data quality test results from the last production run'`,
    );
  }

  // Lineage: what each table is built from, across every pipeline.
  const lineage = Object.values(pipelines).flatMap((p) =>
    p.models.flatMap((m) =>
      m.dependsOn.map((d) => `(${quote(p.id)}, ${quote(m.name)}, ${quote(m.layer)}, ${quote(d)})`),
    ),
  );
  await con.run(
    `CREATE TABLE main._lineage AS SELECT * FROM (VALUES ${lineage.join(", ")}) AS t(pipeline, model, layer, depends_on)`,
  );
  await con.run(
    `COMMENT ON TABLE main._lineage IS 'Model dependencies for every pipeline, bronze through gold'`,
  );

  con.closeSync();
  console.log(`\n✓ ${path.relative(process.cwd(), DB_FILE)}. Open it with: duckdb -ui lab.duckdb`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
