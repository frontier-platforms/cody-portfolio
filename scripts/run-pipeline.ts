/**
 * Production run for one or all pipelines:
 *
 *   extract (full) → bronze → silver → gold → tests → Parquet + manifest
 *
 * Usage: tsx scripts/run-pipeline.ts [permits|flames|all]
 *
 * A failing error-level test exits non-zero before any file is written, so a
 * bad extract never replaces the last good snapshot. GitHub Actions runs this
 * weekly (.github/workflows/refresh-data.yml).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";
import { extractFlames, seasonIds } from "../lib/pipelines/flames";
import { pipelines } from "../lib/pipelines/index";
import { extractPermits } from "../lib/pipelines/permits";
import { bronzeSql, runModels, runTests, type Engine } from "../lib/pipelines/runner";
import type { Manifest, ManifestEntry, Pipeline } from "../lib/pipelines/types";

const DATA_DIR = path.resolve("public/data");
const CACHE_DIR = path.resolve(".cache/data");
const MANIFEST = path.join(DATA_DIR, "manifest.json");
const NHL_API = "https://api-web.nhle.com/v1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function nodeEngine(): Promise<Engine & { close(): void }> {
  const instance = await DuckDBInstance.create(":memory:");
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

async function run(pipeline: Pipeline): Promise<ManifestEntry> {
  console.log(`\n▶ ${pipeline.id}`);
  const started = Date.now();
  const engine = await nodeEngine();

  const extractStarted = Date.now();
  const { tables, requests } = await extract(pipeline);
  const extractMs = Date.now() - extractStarted;
  let extracted = 0;

  for (const source of pipeline.sources) {
    const rows = tables[source.name] ?? [];
    extracted += rows.length;
    const file = path.join(CACHE_DIR, `${pipeline.id}-${source.name}.json`);
    await writeFile(file, JSON.stringify(rows));
    await engine.exec(bronzeSql(source, file, "main"));
    console.log(`  bronze   ${source.name}: ${rows.length.toLocaleString()} rows`);
  }

  const models = await runModels(engine, pipeline, {
    schema: "main",
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
    schema: "main",
    today,
    onEvent: (e) => {
      if (e.type !== "test") return;
      const mark = { pass: "✓", warn: "!", fail: "✗" }[e.result.status];
      console.log(`  test   ${mark} ${e.result.name}${e.result.failures ? ` (${e.result.failures})` : ""}`);
    },
  });

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
  engine.close();

  return {
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
  };
}

async function main() {
  const which = process.argv[2] ?? "all";
  const selected = which === "all" ? Object.values(pipelines) : [pipelines[which as Pipeline["id"]]];
  if (selected.some((p) => !p)) throw new Error(`Unknown pipeline "${which}". Use permits, flames or all.`);

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  let manifest: Manifest = { version: 1, pipelines: {} };
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8")) as Manifest;
  } catch {
    // first run
  }

  for (const pipeline of selected) {
    manifest.pipelines[pipeline.id] = await run(pipeline);
    await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
