"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { percentile, telemetry, type TelemetryState, type VitalRecord } from "@/lib/telemetry";
import { OPEN_EVENT } from "./open";

const TABS = ["Overview", "Queries", "Events", "Runs"] as const;
type Tab = (typeof TABS)[number];

const serverSnapshot: TelemetryState = {
  startedAt: 0,
  engine: null,
  queries: [],
  loads: [],
  events: [],
  vitals: {},
  runs: [],
};

/**
 * Slide-over showing what this tab has done: Core Web Vitals, DuckDB engine
 * start-up, data downloaded, every query with its latency, every analytics
 * event (and whether it matched the tracking plan), and pipeline runs.
 */
export function TelemetryPanel() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const state = useSyncExternalStore(telemetry.subscribe, telemetry.getSnapshot, () => serverSnapshot);

  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label="Telemetry"
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      className="ml-auto mr-0 h-dvh max-h-dvh w-[min(34rem,100vw)] max-w-none border-l border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="label text-accent-ink">Telemetry</p>
            <p className="mt-1 text-sm text-muted">This tab only. Nothing here leaves your browser.</p>
          </div>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="px-2 py-1 font-mono text-xs text-muted hover:text-ink"
          >
            Close ✕
          </button>
        </header>
        <div role="tablist" aria-label="Telemetry views" className="flex border-b border-line px-3">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="border-b-2 border-transparent px-2 py-2.5 text-sm text-muted aria-selected:border-accent aria-selected:text-ink"
            >
              {t}
              <span className="num ml-1 text-xs text-muted">
                {t === "Queries"
                  ? state.queries.length
                  : t === "Events"
                    ? state.events.length
                    : t === "Runs"
                      ? state.runs.length
                      : ""}
              </span>
            </button>
          ))}
        </div>
        <div role="tabpanel" className="flex-1 overflow-y-auto px-5 py-5">
          {tab === "Overview" && <Overview state={state} />}
          {tab === "Queries" && <Queries state={state} />}
          {tab === "Events" && <Events state={state} />}
          {tab === "Runs" && <Runs state={state} />}
        </div>
      </div>
    </dialog>
  );
}

const VITALS: { name: string; label: string; unit: "ms" | "" }[] = [
  { name: "LCP", label: "Largest Contentful Paint", unit: "ms" },
  { name: "INP", label: "Interaction to Next Paint", unit: "ms" },
  { name: "CLS", label: "Cumulative Layout Shift", unit: "" },
  { name: "FCP", label: "First Contentful Paint", unit: "ms" },
  { name: "TTFB", label: "Time to First Byte", unit: "ms" },
];

const formatBytes = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`;

const ratingColor: Record<VitalRecord["rating"], string> = {
  good: "text-[#15803d] dark:text-[#4ade80]",
  "needs-improvement": "text-accent-ink",
  poor: "text-flames",
};

function Overview({ state }: { state: TelemetryState }) {
  const ms = state.queries.filter((q) => !q.error).map((q) => q.ms);
  const bytes = state.loads.reduce((n, l) => n + l.bytes, 0);
  const recent = state.queries.slice(-40);
  const maxMs = Math.max(...recent.map((q) => q.ms), 1);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="label mb-3 text-ink">Core Web Vitals</h3>
        <dl className="grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-5">
          {VITALS.map((v) => {
            const m = state.vitals[v.name];
            return (
              <div key={v.name} className="bg-surface p-3">
                <dt className="font-mono text-xs text-muted" title={v.label}>
                  {v.name}
                </dt>
                <dd className={`num mt-1 text-xl ${m ? ratingColor[m.rating] : "text-muted"}`}>
                  {m ? (v.unit ? `${Math.round(m.value)} ms` : m.value.toFixed(3)) : "…"}
                </dd>
                <dd className="text-[0.7rem] text-muted">{m ? m.rating.replace("-", " ") : "waiting"}</dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-2 text-xs text-muted">
          Measured in this browser with the web-vitals library. INP appears after you interact.
        </p>
      </section>

      <section>
        <h3 className="label mb-3 text-ink">Query engine</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Metric label="Engine" value={state.engine?.bundle ?? "Not started"} />
          <Metric label="Start-up" value={state.engine ? `${Math.round(state.engine.initMs)} ms` : "–"} />
          <Metric label="Data downloaded" value={bytes ? formatBytes(bytes) : "–"} />
          <Metric label="Tables loaded" value={state.loads.map((l) => l.table).join(", ") || "–"} />
          <Metric label="Queries run" value={String(state.queries.length)} />
          <Metric label="Errors" value={String(state.queries.filter((q) => q.error).length)} />
          <Metric label="p50 latency" value={ms.length ? `${percentile(ms, 50).toFixed(1)} ms` : "–"} />
          <Metric label="p95 latency" value={ms.length ? `${percentile(ms, 95).toFixed(1)} ms` : "–"} />
        </dl>
        {recent.length > 0 && (
          <figure className="mt-4">
            <div
              className="flex h-16 items-end gap-px"
              role="img"
              aria-label="Latency of the last 40 queries"
            >
              {recent.map((q) => (
                <div
                  key={q.id}
                  title={`${q.label}: ${q.ms.toFixed(1)} ms`}
                  className={q.error ? "bg-flames" : "bg-accent"}
                  style={{ height: `${Math.max(4, (q.ms / maxMs) * 100)}%`, flex: 1 }}
                />
              ))}
            </div>
            <figcaption className="mt-1 text-xs text-muted">
              Last {recent.length} queries, by latency.
            </figcaption>
          </figure>
        )}
        {state.loads.length > 0 && (
          <table className="mt-5 w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-normal">Table</th>
                <th className="py-1 text-right font-normal">Size</th>
                <th className="py-1 text-right font-normal">Download</th>
                <th className="py-1 text-right font-normal">Load</th>
              </tr>
            </thead>
            <tbody className="num">
              {state.loads.map((l) => (
                <tr key={l.table} className="border-t border-line">
                  <td className="py-1.5">{l.table}</td>
                  <td className="py-1.5 text-right">{formatBytes(l.bytes)}</td>
                  <td className="py-1.5 text-right">{Math.round(l.fetchMs)} ms</td>
                  <td className="py-1.5 text-right">{Math.round(l.loadMs)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num truncate">{value}</dd>
    </div>
  );
}

const time = (at: number) =>
  new Date(at).toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

function Queries({ state }: { state: TelemetryState }) {
  if (!state.queries.length) return <Empty>No queries yet. Open a Lab tab and they’ll show up here.</Empty>;
  return (
    <ol className="space-y-2">
      {[...state.queries].reverse().map((q) => (
        <li key={q.id} className="border border-line">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 px-3 py-2 text-sm">
              <span className="truncate">{q.label}</span>
              <span className="num shrink-0 text-xs text-muted">
                {q.error ? <span className="text-flames">error</span> : `${q.rows} rows`} · {q.ms.toFixed(1)}{" "}
                ms · {time(q.at)}
              </span>
            </summary>
            <pre className="overflow-x-auto border-t border-line bg-paper px-3 py-2 font-mono text-[0.7rem] leading-relaxed">
              {q.error ? `${q.error}\n\n` : ""}
              {q.sql.trim()}
            </pre>
          </details>
        </li>
      ))}
    </ol>
  );
}

function Events({ state }: { state: TelemetryState }) {
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Product analytics events, checked against the{" "}
        <Link href="/colophon#tracking" className="link">
          tracking plan
        </Link>
        . Valid events go to Vercel Analytics. Invalid ones are dropped and shown here in red.
      </p>
      {!state.events.length ? (
        <Empty>No events yet. Change a filter or open some SQL.</Empty>
      ) : (
        <ol className="space-y-2">
          {[...state.events].reverse().map((e) => (
            <li key={e.id} className="border border-line px-3 py-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`font-mono ${e.valid ? "" : "text-flames"}`}>
                  {e.valid ? "✓" : "✗"} {e.name}
                </span>
                <span className="num text-xs text-muted">{time(e.at)}</span>
              </div>
              {Object.keys(e.props).length > 0 && (
                <p className="mt-1 break-all font-mono text-[0.7rem] text-muted">
                  {Object.entries(e.props)
                    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                    .join("  ")}
                </p>
              )}
              {!e.valid && <p className="mt-1 text-xs text-flames">{e.issues.join("; ")}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Runs({ state }: { state: TelemetryState }) {
  if (!state.runs.length) return <Empty>No pipeline runs yet. Try “Run pipeline live” on a Lab tab.</Empty>;
  return (
    <ol className="space-y-2">
      {[...state.runs].reverse().map((r) => (
        <li key={r.id} className="border border-line px-3 py-2 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="font-mono">
              {r.outcome === "success" ? "✓" : "✗"} {r.pipeline}
            </span>
            <span className="num text-xs text-muted">
              {(r.ms / 1000).toFixed(1)} s · {time(r.at)}
            </span>
          </div>
          <p className="num mt-1 text-xs text-muted">
            {r.rowsIn.toLocaleString()} rows in · {r.inserted} new · {r.updated} replaced · {r.testsWarned}{" "}
            warn · {r.testsFailed} failed
          </p>
        </li>
      ))}
    </ol>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>
  );
}
