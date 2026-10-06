"use client";

import { useRef, useState } from "react";
import { compileTest } from "@/lib/pipelines/runner";
import type { ManifestEntry, Pipeline, TestResult } from "@/lib/pipelines/types";
import type { LiveEvent } from "../lab/live-run";

type NodeStatus = "idle" | "running" | "done" | "failed";

type Node = {
  id: string;
  label: string;
  kind: string;
  description: string;
  sql?: string;
};

type LogLine = { t: number; stage: string; message: string; tone?: "muted" | "good" | "warn" | "bad" };

const statusRing: Record<NodeStatus, string> = {
  idle: "border-line",
  running: "border-accent ring-2 ring-accent/30",
  done: "border-ink",
  failed: "border-flames",
};

const toneClass = {
  muted: "text-muted",
  good: "text-[#15803d] dark:text-[#4ade80]",
  warn: "text-accent-ink",
  bad: "text-flames",
};

export function PipelineExplorer({ pipeline, run }: { pipeline: Pipeline; run: ManifestEntry | undefined }) {
  const columns: { title: string; nodes: Node[] }[] = [
    {
      title: "Source",
      nodes: [
        {
          id: "source",
          label: new URL(pipeline.source.url).host,
          kind: "API",
          description: pipeline.source.name,
        },
      ],
    },
    {
      title: "Bronze",
      nodes: pipeline.sources.map((s) => ({
        id: s.name,
        label: s.name,
        kind: "raw",
        description: s.description,
      })),
    },
    {
      title: "Silver",
      nodes: pipeline.models
        .filter((m) => m.layer === "silver")
        .map((m) => ({ id: m.name, label: m.name, kind: "model", description: m.description, sql: m.sql })),
    },
    {
      title: "Gold",
      nodes: pipeline.models
        .filter((m) => m.layer === "gold")
        .map((m) => ({
          id: m.name,
          label: m.name,
          kind: m.served ? "served" : "model",
          description: m.description,
          sql: m.sql,
        })),
    },
    {
      title: "Checks",
      nodes: [
        {
          id: "tests",
          label: `${pipeline.tests.length} tests`,
          kind: "dq",
          description: "Data quality tests. Error-level failures block the refresh.",
        },
      ],
    },
    ...(pipeline.model
      ? [
          {
            title: "Model",
            nodes: [
              {
                id: "model",
                label: pipeline.model.name,
                kind: "ml",
                description: `${pipeline.model.description} Retrained in the weekly run only; live runs refresh the data, not the model.`,
              },
            ],
          },
        ]
      : []),
    {
      title: "Browser",
      nodes: [
        {
          id: "merge",
          label: "DuckDB-WASM",
          kind: "serve",
          description:
            "Gold tables load into DuckDB in your browser. Live runs merge here on each model's merge key.",
        },
      ],
    },
  ];
  const allNodes = columns.flatMap((c) => c.nodes);

  const [selected, setSelected] = useState<string>(pipeline.models[0].name);
  const [status, setStatus] = useState<Record<string, NodeStatus>>({});
  const [log, setLog] = useState<LogLine[]>([]);
  const [liveTests, setLiveTests] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);

  async function runLive() {
    setRunning(true);
    setStatus({});
    setLog([]);
    setLiveTests([]);
    startedAt.current = performance.now();
    const { runLive } = await import("../lab/live-run");
    await runLive(pipeline.id, (e: LiveEvent) => {
      const t = performance.now() - startedAt.current;
      if (e.kind === "log") setLog((l) => [...l, { t, stage: e.stage, message: e.message, tone: e.tone }]);
      if (e.kind === "node") setStatus((s) => ({ ...s, [e.node]: e.status }));
      if (e.kind === "test") setLiveTests((ts) => [...(ts ?? []), e.result]);
    });
    setRunning(false);
  }

  const node = allNodes.find((n) => n.id === selected) ?? allNodes[0];
  const stats = run?.models.find((m) => m.name === node.id);
  const tests = liveTests && liveTests.length ? liveTests : (run?.tests ?? []);

  return (
    <div className="space-y-4">
      <section className="border border-line bg-surface">
        <header className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="font-semibold">Lineage</h3>
            <p className="text-sm text-muted">Click a node for its SQL, schema and row counts.</p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <button
              type="button"
              onClick={runLive}
              disabled={running}
              className="btn btn-primary disabled:opacity-60"
            >
              {running ? "Running…" : "Run pipeline live"}
            </button>
            <span className="text-xs text-muted">
              {pipeline.id === "permits"
                ? "Pulls changes from data.calgary.ca right now."
                : "Checks the NHL for games newer than the snapshot."}{" "}
              Changes stay in this tab.
            </span>
          </div>
        </header>

        <ol className="grid gap-3 overflow-x-auto p-4 sm:p-5 md:grid-flow-col md:auto-cols-fr">
          {columns.map((col, i) => (
            <li key={col.title} className="relative min-w-0">
              <p className="label mb-2">
                <span className="text-accent">{i + 1}</span> {col.title}
                {i < columns.length - 1 && (
                  <span aria-hidden className="float-right text-muted md:hidden">
                    ↓
                  </span>
                )}
              </p>
              <ul className="space-y-2">
                {col.nodes.map((n) => {
                  const s = status[n.id] ?? "idle";
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(n.id)}
                        aria-pressed={selected === n.id}
                        className={`w-full border bg-paper px-2.5 py-2 text-left transition-colors hover:border-ink aria-pressed:bg-accent-soft ${statusRing[s]}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-xs">{n.label}</span>
                          <StatusDot status={s} />
                        </span>
                        <span className="text-[0.7rem] text-muted">{n.kind}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {i < columns.length - 1 && (
                <span aria-hidden className="absolute -right-2.5 top-9 hidden text-muted md:block">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>

        <div className="border-t border-line px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-sm">{node.label}</p>
            {stats && (
              <p className="num text-xs text-muted">
                {stats.rows.toLocaleString()} rows{stats.ms ? ` · built in ${Math.round(stats.ms)} ms` : ""} ·
                last production run
              </p>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{node.description}</p>
          {node.id === "model" && run?.model && <ModelStats model={run.model} />}
          {node.sql && (
            <pre className="mt-3 max-h-72 overflow-auto bg-paper px-3 py-3 font-mono text-xs leading-relaxed">
              <code>{node.sql.trim()}</code>
            </pre>
          )}
          {stats?.columns && (
            <table className="mt-3 w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 font-normal">Column</th>
                  <th className="py-1 font-normal">Type</th>
                  <th className="py-1 text-right font-normal">Null %</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {stats.columns.map((c) => (
                  <tr key={c.name} className="border-t border-line">
                    <td className="py-1">{c.name}</td>
                    <td className="py-1 text-muted">{c.type}</td>
                    <td className="num py-1 text-right">{c.nullPct ? c.nullPct.toFixed(1) : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {log.length > 0 && (
        <section aria-label="Run log" className="border border-line bg-[#141311] text-[#ede9e3]">
          <p className="border-b border-white/10 px-4 py-2 font-mono text-xs text-white/60">
            run log · {pipeline.id} · live
          </p>
          <ol
            aria-live="polite"
            className="max-h-80 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
          >
            {log.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="num shrink-0 text-white/40">+{(l.t / 1000).toFixed(2)}s</span>
                <span className="w-14 shrink-0 text-[#fb8c4a]">{l.stage}</span>
                <span
                  className={
                    l.tone && l.tone !== "muted"
                      ? toneClass[l.tone]
                      : l.tone === "muted"
                        ? "text-white/60"
                        : ""
                  }
                >
                  {l.message}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="border border-line bg-surface">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <h3 className="font-semibold">Data quality tests</h3>
          <p className="text-xs text-muted">
            {liveTests && liveTests.length ? "From your live run" : "From the last production run"}. Warnings
            are real issues in the source, flagged rather than hidden.
          </p>
        </header>
        <ul className="divide-y divide-line">
          {pipeline.tests.map((test) => {
            const r = tests.find((t) => t.name === test.name);
            return (
              <li key={test.name}>
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[4.5rem_1fr_auto] items-baseline gap-3 px-4 py-2.5 text-sm sm:px-5">
                    <TestPill status={r?.status} />
                    <span>
                      {test.name}
                      <span className="ml-2 font-mono text-[0.7rem] text-muted">
                        {test.kind} · {test.model}
                      </span>
                    </span>
                    <span className="num text-xs text-muted">
                      {r ? (r.failures ? `${r.failures.toLocaleString()} rows` : "0") : "–"}
                    </span>
                  </summary>
                  <div className="space-y-2 px-4 pb-3 sm:px-5">
                    <p className="text-sm text-muted">
                      {test.description} <span className="font-mono text-xs">severity: {test.severity}</span>
                    </p>
                    <pre className="overflow-x-auto bg-paper px-3 py-2 font-mono text-xs leading-relaxed">
                      <code>{compileTest(test, "main", run?.runAt.slice(0, 10) ?? "today").trim()}</code>
                    </pre>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function StatusDot({ status }: { status: NodeStatus }) {
  if (status === "idle") return <span aria-hidden className="size-1.5 rounded-full bg-line" />;
  if (status === "running")
    return (
      <span className="relative flex size-1.5" aria-label="running">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
      </span>
    );
  return (
    <span
      className={`font-mono text-[0.7rem] ${status === "failed" ? "text-flames" : "text-ink"}`}
      aria-label={status}
    >
      {status === "failed" ? "✗" : "✓"}
    </span>
  );
}

function TestPill({ status }: { status?: TestResult["status"] }) {
  const map = {
    pass: "border-[#15803d] text-[#15803d] dark:border-[#4ade80] dark:text-[#4ade80]",
    warn: "border-accent text-accent-ink",
    fail: "border-flames text-flames",
  };
  return (
    <span
      className={`w-fit border px-1.5 py-0.5 text-center font-mono text-[0.65rem] uppercase ${status ? map[status] : "border-line text-muted"}`}
    >
      {status ?? "…"}
    </span>
  );
}

function ModelStats({ model }: { model: NonNullable<ManifestEntry["model"]> }) {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const rows = [
    ["Median error", pct(model.metrics.model.mdape), pct(model.metrics.baseline.mdape)],
    ["Within 10%", pct(model.metrics.model.within10), pct(model.metrics.baseline.within10)],
    ["R²", model.metrics.model.r2.toFixed(3), model.metrics.baseline.r2.toFixed(3)],
  ];
  return (
    <table className="mt-3 w-full text-left text-xs">
      <thead className="text-muted">
        <tr>
          <th className="py-1 font-normal">Holdout ({model.rows.test.toLocaleString()} homes)</th>
          <th className="py-1 text-right font-normal">Model</th>
          <th className="py-1 text-right font-normal">Community median</th>
        </tr>
      </thead>
      <tbody className="num">
        {rows.map(([label, m, b]) => (
          <tr key={label} className="border-t border-line">
            <td className="py-1">{label}</td>
            <td className="py-1 text-right">{m}</td>
            <td className="py-1 text-right text-muted">{b}</td>
          </tr>
        ))}
        <tr className="border-t border-line">
          <td className="py-1">Trained on</td>
          <td className="py-1 text-right" colSpan={2}>
            {model.rows.train.toLocaleString()} homes in {(model.trainMs / 1000).toFixed(1)} s ·{" "}
            {(model.bytes / 1e3).toFixed(0)} KB
          </td>
        </tr>
      </tbody>
    </table>
  );
}
