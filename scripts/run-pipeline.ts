/**
 * Production run for one or all pipelines:
 *
 *   extract (full) → bronze → silver → gold → tests → Parquet + manifest
 *
 * Usage: tsx scripts/run-pipeline.ts [permits|housing|flames|all] [--db <file>]
 *
 * A failing error-level test exits non-zero before any file is written, so a
 * bad extract never replaces the last good snapshot. GitHub Actions runs this
 * weekly (.github/workflows/refresh-data.yml).
 *
 * --db <file> is for exploring locally (npm run data:db). It runs the same
 * steps into a DuckDB file, one schema per pipeline, keeping every layer
 * (bronze, silver, gold) plus test results and lineage. It reuses the last
 * extract when one is cached and publishes nothing.
 */
import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { extractFlames, seasonIds } from "../lib/pipelines/flames";
import { pipelines } from "../lib/pipelines/index";
import { extractHousing } from "../lib/pipelines/housing";
import { extractPermits } from "../lib/pipelines/permits";
import { trainHousingModel, type HomeRow } from "../lib/ml/housing";
import { bronzeSql, render, runModels, runTests, type Engine } from "../lib/pipelines/runner";
import type {
  HighlightResult,
  Manifest,
  ManifestEntry,
  Pipeline,
  RunSummary,
  TestResult,
} from "../lib/pipelines/types";

const DATA_DIR = path.resolve("public/data");
const CACHE_DIR = path.resolve(".cache/data");
const MANIFEST = path.join(DATA_DIR, "manifest.json");
const NHL_API = "https://api-web.nhle.com/v1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function nodeEngine(file = ":memory:"): Promise<Engine & { close(): void }> {
  const instance = await DuckDBInstance.create(file);
  const con = await instance.connect();
  return {
    exec: async (sql) => void (await con.run(sql)),
    query: async (sql) => {
      const reader = await con.runAndReadAll(sql);
      return reader
        .getRowObjectsJS()
        .map((row) =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])),
        );
    },
    close: () => con.closeSync(),
  };
}

/** NHL fetch with backoff on 429s and a disk cache for finished games. */
async function nhlJson<T>(apiPath: string): Promise<T> {
  const cacheable = apiPath.startsWith("gamecenter/");
  const file = path.join(CACHE_DIR, `nhl-${apiPath.replace(/\W+/g, "-")}.json`);
  if (cacheable) {
    try {
      return JSON.parse(await readFile(file, "utf8")) as T;
    } catch {
      // not cached yet
    }
  }
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${NHL_API}/${apiPath}`);
    if (res.ok) {
      const json = (await res.json()) as T;
      if (cacheable) await writeFile(file, JSON.stringify(json));
      await sleep(250);
      return json;
    }
    if (attempt === 6) throw new Error(`NHL API ${res.status} for ${apiPath}`);
    await sleep((Number(res.headers.get("retry-after")) || 2 ** attempt) * 1000);
  }
}

async function extract(pipeline: Pipeline): Promise<{ tables: Record<string, unknown[]>; requests: number }> {
  if (pipeline.id === "permits") {
    const { rows, requests } = await extractPermits({
      onPage: ({ rows, ms }) => console.log(`  extract  page of ${rows} rows in ${ms} ms`),
    });
    return { tables: { raw_permits: rows } as Record<string, unknown[]>, requests };
  }
  if (pipeline.id === "housing") {
    return extractHousing({
      onPage: ({ rows, ms }) => console.log(`  extract  page of ${rows} rows in ${ms} ms`),
    });
  }
  return extractFlames({
    seasons: seasonIds(),
    fetchJson: nhlJson,
    onLog: (m) => console.log(`  extract  ${m}`),
  });
}

async function sha256(file: string) {
  return createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}

const bronzeFile = (pipeline: Pipeline, source: string) =>
  path.join(CACHE_DIR, `${pipeline.id}-${source}.json`);

/** The last extract, if every raw file for this pipeline is cached. */
async function cachedExtract(pipeline: Pipeline) {
  try {
    await Promise.all(pipeline.sources.map((s) => access(bronzeFile(pipeline, s.name))));
  } catch {
    return null;
  }
  const tables: Record<string, unknown[]> = {};
  for (const s of pipeline.sources)
    tables[s.name] = JSON.parse(await readFile(bronzeFile(pipeline, s.name), "utf8"));
  return { tables, requests: 0 };
}

type RunOptions = { engine?: Engine & { close(): void }; schema?: string; explore?: boolean };

async function run(
  pipeline: Pipeline,
  { engine: shared, schema = "main", explore = false }: RunOptions = {},
) {
  console.log(`\n▶ ${pipeline.id}${explore ? ` → schema ${schema}` : ""}`);
  const started = Date.now();
  const engine = shared ?? (await nodeEngine());
  if (schema !== "main") await engine.exec(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

  const extractStarted = Date.now();
  const cached = explore ? await cachedExtract(pipeline) : null;
  if (cached) console.log("  extract  reusing the last extract from .cache/data");
  const { tables, requests } = cached ?? (await extract(pipeline));
  const extractMs = Date.now() - extractStarted;
  let extracted = 0;

  for (const source of pipeline.sources) {
    const rows = tables[source.name] ?? [];
    extracted += rows.length;
    const file = bronzeFile(pipeline, source.name);
    if (!cached) await writeFile(file, JSON.stringify(rows));
    await engine.exec(bronzeSql(source, file, schema));
    console.log(`  bronze   ${source.name}: ${rows.length.toLocaleString()} rows`);
  }

  const models = await runModels(engine, pipeline, {
    schema,
    stats: true,
    onEvent: (e) =>
      e.type === "model" &&
      e.status === "done" &&
      console.log(
        `  ${e.layer.padEnd(8)} ${e.name}: ${e.rows?.toLocaleString()} rows in ${Math.round(e.ms ?? 0)} ms`,
      ),
  });

  const today = new Date().toISOString().slice(0, 10);
  const tests = await runTests(engine, pipeline, {
    schema,
    today,
    onEvent: (e) => {
      if (e.type !== "test") return;
      const mark = { pass: "✓", warn: "!", fail: "✗" }[e.result.status];
      console.log(`  test   ${mark} ${e.result.name}${e.result.failures ? ` (${e.result.failures})` : ""}`);
    },
  });

  if (explore) {
    await describe(engine, pipeline, schema, tests);
    return null;
  }

  const failed = tests.filter((t) => t.status === "fail");
  if (failed.length) {
    engine.close();
    throw new Error(`${failed.length} error-level test(s) failed in ${pipeline.id}. Snapshot not updated.`);
  }

  const outputs: ManifestEntry["outputs"] = [];
  for (const model of pipeline.models.filter((m) => m.served)) {
    const file = path.join(DATA_DIR, model.served!.file);
    await engine.exec(`COPY main.${model.name} TO '${file}' (FORMAT parquet, COMPRESSION zstd)`);
    const bytes = (await readFile(file)).byteLength;
    const rows = models.find((m) => m.name === model.name)!.rows;
    outputs.push({ model: model.name, file: model.served!.file, rows, bytes, sha256: await sha256(file) });
    console.log(`  serve    ${model.served!.file}: ${(bytes / 1e6).toFixed(2)} MB`);
  }

  const highlights = await computeHighlights(engine, pipeline, schema);
  const trained = pipeline.model ? await trainModel(engine, pipeline) : undefined;
  engine.close();

  const entry: ManifestEntry = {
    pipeline: pipeline.id,
    runAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    trigger: process.env.GITHUB_ACTIONS ? "github-actions" : "local",
    commit: process.env.GITHUB_SHA ?? null,
    extract: { requests, rows: extracted, ms: extractMs },
    models: [
      ...pipeline.sources.map((s) => ({
        name: s.name,
        layer: "bronze" as const,
        rows: (tables[s.name] ?? []).length,
        ms: 0,
      })),
      ...models,
    ],
    tests,
    outputs,
    highlights,
    model: trained,
  };
  return entry;
}

const titleCase = (s: string) =>
  s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s;

function formatHighlight(value: unknown, format: "count" | "money" | "percent" | "text") {
  const n = Number(value);
  if (format === "count") return n.toLocaleString("en-CA");
  if (format === "money") return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n / 1e3)}K`;
  if (format === "percent") return `${(n * 100).toFixed(1)}%`;
  return titleCase(String(value));
}

/** Headline findings for the lab header, computed on the gold tables after the tests pass. */
async function computeHighlights(
  engine: Engine,
  pipeline: Pipeline,
  schema: string,
): Promise<HighlightResult[]> {
  const out: HighlightResult[] = [];
  for (const h of pipeline.highlights ?? []) {
    const [row] = await engine.query(render(h.sql, schema));
    const result = {
      label: h.label,
      value: formatHighlight(row?.value, h.format),
      detail: row?.detail == null ? null : String(row.detail),
    };
    out.push(result);
    console.log(`  insight  ${h.label}: ${result.value}${result.detail ? ` (${result.detail})` : ""}`);
  }
  return out;
}

const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;

/** Explore mode: comment every table and store this run's test results next to the data. */
async function describe(engine: Engine, pipeline: Pipeline, schema: string, tests: TestResult[]) {
  const layer = (name: string) =>
    pipeline.sources.some((s) => s.name === name)
      ? "bronze"
      : pipeline.models.find((m) => m.name === name)!.layer;
  for (const t of [...pipeline.sources, ...pipeline.models]) {
    await engine.exec(
      `COMMENT ON TABLE ${schema}.${t.name} IS ${quote(`${layer(t.name)}: ${t.description}`)}`,
    );
  }
  await engine.exec(
    `CREATE OR REPLACE TABLE ${schema}._tests AS SELECT * FROM (VALUES ${tests
      .map(
        (t) =>
          `(${quote(t.name)}, ${quote(t.model)}, ${quote(t.kind)}, ${quote(t.severity)}, ${quote(t.status)}, ${t.failures}, ${quote(t.sql.replaceAll("main.", `${schema}.`))})`,
      )
      .join(", ")}) AS t(test, model, kind, severity, status, failures, sql)`,
  );
  await engine.exec(
    `COMMENT ON TABLE ${schema}._tests IS 'Data quality tests from this run, with the SQL that checks each one'`,
  );
}

/** Explore mode: one table describing how every model is built, across all pipelines. */
async function writeLineage(engine: Engine) {
  const rows = Object.values(pipelines).flatMap((p) => [
    ...p.sources.map((s) => `(${quote(p.id)}, ${quote(s.name)}, 'bronze', NULL, ${quote(s.description)})`),
    ...p.models.flatMap((m) =>
      m.dependsOn.map(
        (d) => `(${quote(p.id)}, ${quote(m.name)}, ${quote(m.layer)}, ${quote(d)}, ${quote(m.description)})`,
      ),
    ),
  ]);
  await engine.exec(
    `CREATE OR REPLACE TABLE main._lineage AS SELECT * FROM (VALUES ${rows.join(", ")}) AS t(pipeline, model, layer, depends_on, description)`,
  );
  await engine.exec(
    `COMMENT ON TABLE main._lineage IS 'Every table in every pipeline, its layer and what it is built from'`,
  );
}

/** Trains the value model on the gold table, after tests pass, and writes it next to the data. */
async function trainModel(engine: Engine, pipeline: Pipeline): Promise<ManifestEntry["model"]> {
  const spec = pipeline.model!;
  const rows = (await engine.query(
    `SELECT roll_number AS key, community, use, zoning, year_built, lot_sqft, assessed_value
     FROM main.${spec.trainedOn}
     WHERE assessed_value BETWEEN 50000 AND 20000000`,
  )) as (HomeRow & { key: number })[];
  const uses = [...new Set(rows.map((r) => r.use))].sort().map((label) => ({ code: label, label }));
  console.log(`  train    ${spec.name}: ${rows.length.toLocaleString()} homes`);

  const model = await trainHousingModel(
    rows,
    uses,
    { trees: 400, depth: 6, learningRate: 0.15 },
    (i, tr, va) => {
      if ((i + 1) % 50 === 0)
        console.log(`  train    tree ${i + 1}: rmse train ${tr.toFixed(4)}, holdout ${va?.toFixed(4)}`);
    },
  );

  const file = path.join(DATA_DIR, spec.file);
  await writeFile(file, JSON.stringify(model));
  const bytes = (await readFile(file)).byteLength;
  const m = model.metrics;
  console.log(
    `  model    holdout median error ${(m.model.mdape * 100).toFixed(1)}% (baseline ${(m.baseline.mdape * 100).toFixed(1)}%), ` +
      `within 10%: ${(m.model.within10 * 100).toFixed(1)}%, R² ${m.model.r2.toFixed(3)}, ${(bytes / 1e3).toFixed(0)} KB in ${(model.trainMs / 1000).toFixed(1)} s`,
  );
  return {
    file: spec.file,
    bytes,
    trainMs: model.trainMs,
    rows: model.rows,
    metrics: model.metrics,
    importance: model.importance,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dbIndex = args.indexOf("--db");
  const dbFile = dbIndex >= 0 ? args[dbIndex + 1] : null;
  if (dbIndex >= 0 && !dbFile) throw new Error("--db needs a file name, e.g. --db lab.duckdb");
  const which = args.find((a, i) => !a.startsWith("--") && i !== dbIndex + 1) ?? "all";
  const selected = which === "all" ? Object.values(pipelines) : [pipelines[which as Pipeline["id"]]];
  if (selected.some((p) => !p)) throw new Error(`Unknown pipeline "${which}". Use permits, flames or all.`);

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  if (dbFile) {
    await rm(dbFile, { force: true });
    await rm(`${dbFile}.wal`, { force: true });
    const engine = await nodeEngine(dbFile);
    for (const pipeline of selected) await run(pipeline, { engine, schema: pipeline.id, explore: true });
    await writeLineage(engine);
    engine.close();
    console.log(`\n✓ ${dbFile}: every layer of every pipeline. Open it with: duckdb -ui ${dbFile}`);
    return;
  }

  let manifest: Manifest = { version: 1, pipelines: {} };
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8")) as Manifest;
  } catch {
    // first run
  }

  for (const pipeline of selected) {
    const entry = (await run(pipeline))!;
    manifest.pipelines[pipeline.id] = entry;
    const summary: RunSummary = {
      runAt: entry.runAt,
      trigger: entry.trigger,
      durationMs: entry.durationMs,
      rows: entry.extract.rows,
      passed: entry.tests.filter((t) => t.status === "pass").length,
      warned: entry.tests.filter((t) => t.status === "warn").length,
      failed: entry.tests.filter((t) => t.status === "fail").length,
    };
    manifest.history ??= {};
    manifest.history[pipeline.id] = [summary, ...(manifest.history[pipeline.id] ?? [])].slice(0, 12);
    await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
