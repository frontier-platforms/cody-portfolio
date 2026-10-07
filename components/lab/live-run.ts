"use client";

import { track } from "@/lib/analytics";
import { extractFlames, seasonIds } from "@/lib/pipelines/flames";
import { pipelines } from "@/lib/pipelines/index";
import { extractHousing } from "@/lib/pipelines/housing";
import { extractPermits } from "@/lib/pipelines/permits";
import { bronzeSql, render, runModels, runTests, type RunEvent } from "@/lib/pipelines/runner";
import type { HighlightResult, Pipeline, TestResult } from "@/lib/pipelines/types";
import { telemetry } from "@/lib/telemetry";
import { browserEngine, dataVersion, ensureTables, runQuery, type TableName } from "./db";
import { formatHighlight, liveResults } from "./live-results";

/**
 * Runs a pipeline incrementally in the visitor's browser, using the same model
 * and test definitions as the production run:
 *
 *   1. read the watermark from the data already on the page
 *   2. extract only what changed since then, straight from the source API
 *   3. load bronze and build silver and gold into a separate `live` schema
 *   4. merge gold into the served tables on each model's merge key
 *   5. run every test against the merged result
 *   6. recompute the lab header's findings on the merged data
 *   7. bump the data version so the dashboards re-query
 *
 * Changes live only in this tab. Refreshing the page goes back to the snapshot.
 */

export type LiveStage = "extract" | "bronze" | "model" | "merge" | "test" | "done";

export type LiveEvent =
  | { kind: "log"; stage: LiveStage; message: string; tone?: "muted" | "good" | "warn" | "bad" }
  | { kind: "node"; node: string; status: "running" | "done" | "failed" }
  | { kind: "test"; result: TestResult };

export type LiveSummary = {
  outcome: "success" | "failed";
  rowsIn: number;
  inserted: number;
  updated: number;
  tests: TestResult[];
  ms: number;
};

const SCHEMA = "live";
const MAX_INCREMENTAL_ROWS = 20_000;

async function nhlViaProxy<T>(path: string): Promise<T> {
  const res = await fetch(`/api/nhl?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`NHL proxy ${res.status} for ${path}`);
  return (await res.json()) as T;
}

async function extract(pipeline: Pipeline, emit: (e: LiveEvent) => void) {
  const log = (message: string, tone?: "muted" | "good" | "warn") =>
    emit({ kind: "log", stage: "extract", message, tone });

  if (pipeline.id === "permits") {
    await ensureTables(["permits"]);
    const { rows } = await runQuery(
      "SELECT strftime(max(updated_at), '%Y-%m-%dT%H:%M:%S') AS watermark FROM permits",
      "pipeline: watermark",
    );
    const watermark = String(rows[0]?.watermark);
    log(`Watermark from snapshot: max(updated_at) = ${watermark}`);
    log(`GET data.calgary.ca … WHERE :updated_at > '${watermark}'`, "muted");
    const result = await extractPermits({
      updatedSince: watermark,
      pageSize: 10_000,
      maxRows: MAX_INCREMENTAL_ROWS,
      onPage: ({ rows, ms }) => log(`  page: ${rows.toLocaleString()} rows in ${ms} ms`, "muted"),
    });
    if (result.rows.length >= MAX_INCREMENTAL_ROWS) {
      log(
        `Capped at ${MAX_INCREMENTAL_ROWS.toLocaleString()} rows for the browser. The weekly run takes the rest.`,
        "warn",
      );
    }
    return { tables: { raw_permits: result.rows } as Record<string, unknown[]>, requests: result.requests };
  }

  if (pipeline.id === "housing") {
    await ensureTables(["housing_homes"]);
    const { rows } = await runQuery(
      "SELECT strftime(max(mod_date), '%Y-%m-%dT00:00:00') AS watermark FROM housing_homes",
      "pipeline: watermark",
    );
    const watermark = String(rows[0]?.watermark);
    log(`Watermark from snapshot: max(mod_date) = ${watermark.slice(0, 10)}`);
    log(
      "Socrata's :updated_at changes on every row nightly here, so the City's mod_date is the watermark.",
      "muted",
    );
    log(`GET data.calgary.ca … WHERE mod_date > '${watermark.slice(0, 10)}'`, "muted");
    const result = await extractHousing({
      modifiedSince: watermark,
      pageSize: 10_000,
      maxRows: MAX_INCREMENTAL_ROWS,
      onPage: ({ rows, ms }) => log(`  page: ${rows.toLocaleString()} rows in ${ms} ms`, "muted"),
    });
    return result;
  }

  await ensureTables(["flames_games"]);
  const { rows } = await runQuery("SELECT game_id FROM flames_games", "pipeline: loaded games");
  const loadedIds = new Set(rows.map((r) => Number(r.game_id)));
  const seasons = seasonIds().slice(-1);
  log(
    `${loadedIds.size} games already in the snapshot. Checking ${seasons[0].slice(0, 4)}-${seasons[0].slice(6)} for new ones.`,
  );
  const result = await extractFlames({
    seasons,
    fetchJson: nhlViaProxy,
    skipGameIds: loadedIds,
    onLog: (m) => log(m, "muted"),
  });
  return { tables: result.tables as Record<string, unknown[]>, requests: result.requests };
}

export async function runLive(id: Pipeline["id"], emit: (e: LiveEvent) => void): Promise<LiveSummary> {
  const pipeline = pipelines[id];
  const started = performance.now();
  const log = (stage: LiveStage, message: string, tone?: "muted" | "good" | "warn" | "bad") =>
    emit({ kind: "log", stage, message, tone });
  track("pipeline_run_started", { dataset: id });

  let rowsIn = 0;
  let inserted = 0;
  let updated = 0;
  let tests: TestResult[] = [];
  let highlights: HighlightResult[] | null = null;

  try {
    const engine = await browserEngine(`pipeline: ${id}`);
    await engine.exec(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);

    emit({ kind: "node", node: "source", status: "running" });
    const extractStarted = performance.now();
    const { tables, requests } = await extract(pipeline, emit);
    rowsIn = Object.values(tables).reduce((n, rows) => n + rows.length, 0);
    log(
      "extract",
      `${rowsIn.toLocaleString()} rows from ${requests} request(s) in ${Math.round(performance.now() - extractStarted)} ms`,
      "good",
    );
    emit({ kind: "node", node: "source", status: "done" });

    for (const source of pipeline.sources) {
      emit({ kind: "node", node: source.name, status: "running" });
      const file = `${SCHEMA}_${source.name}.json`;
      await engine.registerJson(file, tables[source.name] ?? []);
      await engine.exec(bronzeSql(source, file, SCHEMA));
      log("bronze", `${source.name}: ${(tables[source.name] ?? []).length.toLocaleString()} rows`);
      emit({ kind: "node", node: source.name, status: "done" });
    }

    await runModels(engine, pipeline, {
      schema: SCHEMA,
      onEvent: (e: RunEvent) => {
        if (e.type !== "model") return;
        emit({ kind: "node", node: e.name, status: e.status === "running" ? "running" : "done" });
        if (e.status === "done")
          log(
            "model",
            `${e.layer} ${e.name}: ${e.rows?.toLocaleString()} rows in ${Math.round(e.ms ?? 0)} ms`,
          );
      },
    });

    emit({ kind: "node", node: "merge", status: "running" });
    for (const model of pipeline.models.filter((m) => m.served && m.mergeKey)) {
      const key = model.mergeKey!;
      await ensureTables([model.name as TableName]);
      const [{ n: existing }] = await engine.query(
        `SELECT count(DISTINCT ${key})::INTEGER AS n FROM ${SCHEMA}.${model.name} WHERE ${key} IN (SELECT ${key} FROM main.${model.name})`,
      );
      const [{ n: total }] = await engine.query(
        `SELECT count(DISTINCT ${key})::INTEGER AS n FROM ${SCHEMA}.${model.name}`,
      );
      await engine.exec(
        `DELETE FROM main.${model.name} WHERE ${key} IN (SELECT ${key} FROM ${SCHEMA}.${model.name})`,
      );
      await engine.exec(`INSERT INTO main.${model.name} BY NAME SELECT * FROM ${SCHEMA}.${model.name}`);
      if (model.name === pipeline.models.find((m) => m.served)!.name) {
        inserted = Number(total) - Number(existing);
        updated = Number(existing);
      }
      log("merge", `${model.name}: ${Number(total) - Number(existing)} new, ${existing} replaced on ${key}`);
    }
    emit({ kind: "node", node: "merge", status: "done" });

    emit({ kind: "node", node: "tests", status: "running" });
    tests = await runTests(engine, pipeline, {
      schema: "main",
      today: new Date().toISOString().slice(0, 10),
      onEvent: (e) => e.type === "test" && emit({ kind: "test", result: e.result }),
    });
    const failed = tests.filter((t) => t.status === "fail").length;
    const warned = tests.filter((t) => t.status === "warn").length;
    log(
      "test",
      `${tests.length - failed - warned} passed, ${warned} warned, ${failed} failed`,
      failed ? "bad" : warned ? "warn" : "good",
    );
    emit({ kind: "node", node: "tests", status: failed ? "failed" : "done" });

    if (pipeline.highlights) {
      await ensureTables(pipeline.models.filter((m) => m.served).map((m) => m.name as TableName));
      const today = new Date().toISOString().slice(0, 10);
      const sql = render(pipeline.highlights.sql, "main").replaceAll("{{ today }}", `DATE '${today}'`);
      const rows = await engine.query(`SELECT * FROM (${sql}) ORDER BY sort`);
      highlights = rows.map((r) => ({
        label: String(r.label),
        value: formatHighlight(
          r.value_number == null ? null : Number(r.value_number),
          r.value_text == null ? null : String(r.value_text),
          String(r.format),
        ),
        detail: r.detail == null ? null : String(r.detail),
      }));
      log("done", `Findings recomputed: ${highlights.map((h) => `${h.label} ${h.value}`).join(" · ")}`);
    }

    // Flames re-reads the whole current schedule, so replaced games aren't changes.
    const changed = inserted + (id === "flames" ? 0 : updated);
    if (changed > 0) dataVersion.bump();
    const ms = performance.now() - started;
    const secs = (ms / 1000).toFixed(1);
    log(
      "done",
      changed > 0
        ? `Done in ${secs} s. ${changed.toLocaleString()} changed rows merged. The dashboards above now include them.`
        : `Done in ${secs} s. Nothing new since the snapshot.`,
      "good",
    );

    const summary: LiveSummary = {
      outcome: failed ? "failed" : "success",
      rowsIn,
      inserted,
      updated,
      tests,
      ms,
    };
    finish(id, summary, highlights);
    return summary;
  } catch (e) {
    log("done", `Run failed: ${(e as Error).message}`, "bad");
    const summary: LiveSummary = {
      outcome: "failed",
      rowsIn,
      inserted,
      updated,
      tests,
      ms: performance.now() - started,
    };
    finish(id, summary, highlights);
    return summary;
  }
}

function finish(id: Pipeline["id"], s: LiveSummary, highlights: HighlightResult[] | null) {
  const testsFailed = s.tests.filter((t) => t.status === "fail").length;
  const testsWarned = s.tests.filter((t) => t.status === "warn").length;
  liveResults.add({
    pipeline: id,
    runAt: new Date().toISOString(),
    durationMs: s.ms,
    outcome: s.outcome,
    rowsIn: s.rowsIn,
    inserted: s.inserted,
    updated: s.updated,
    passed: s.tests.length - testsFailed - testsWarned,
    warned: testsWarned,
    failed: testsFailed,
    highlights,
  });
  telemetry.run({
    pipeline: id,
    ms: s.ms,
    outcome: s.outcome,
    rowsIn: s.rowsIn,
    inserted: s.inserted,
    updated: s.updated,
    testsFailed,
    testsWarned,
  });
  track("pipeline_run_completed", {
    dataset: id,
    outcome: s.outcome,
    rows_in: s.rowsIn,
    tests_failed: testsFailed,
    duration_ms: Math.round(s.ms),
  });
}
