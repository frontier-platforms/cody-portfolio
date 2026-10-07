"use client";

import { useLiveResults } from "@/components/lab/live-results";
import type { ManifestEntry, Pipeline, RunSummary } from "@/lib/pipelines/types";
import { FreshnessBadge } from "./FreshnessBadge";

const trigger = (t: RunSummary["trigger"] | "live") =>
  t === "live" ? "Live, in your browser" : t === "github-actions" ? "Airflow on GitHub Actions" : "Local run";

/**
 * The latest run: production from manifest.json, until a live run in this tab
 * replaces it. Then the production snapshot is still named underneath.
 */
export function RunSummaryStrip({ pipeline, run }: { pipeline: Pipeline; run: ManifestEntry | undefined }) {
  const live = useLiveResults(pipeline.id)[0];
  if (!run && !live) return null;

  const latest = live
    ? {
        label: "Latest run",
        runAt: live.runAt,
        trigger: trigger("live"),
        durationMs: live.durationMs,
        rows: live.rowsIn,
        passed: live.passed,
        warned: live.warned,
        failed: live.failed,
      }
    : {
        label: "Last production run",
        runAt: run!.runAt,
        trigger: trigger(run!.trigger),
        durationMs: run!.durationMs,
        rows: run!.extract.rows,
        passed: run!.tests.filter((t) => t.status === "pass").length,
        warned: run!.tests.filter((t) => t.status === "warn").length,
        failed: run!.tests.filter((t) => t.status === "fail").length,
      };

  return (
    <div>
      <dl className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-5">
        <Cell label={latest.label}>
          <FreshnessBadge runAt={latest.runAt} slaDays={pipeline.contract.freshnessSlaDays} />
        </Cell>
        <Cell label="Trigger">{latest.trigger}</Cell>
        <Cell label="Duration">{(latest.durationMs / 1000).toFixed(1)} s</Cell>
        <Cell label={live ? "Rows extracted (changes only)" : "Rows extracted"}>
          {latest.rows.toLocaleString("en-CA")}
        </Cell>
        <Cell label="Tests">
          {latest.failed ? `${latest.failed} fail · ` : ""}
          {latest.passed} pass · {latest.warned} warn
        </Cell>
      </dl>
      {live && run && (
        <p className="meta mt-2">
          Your live run, in this tab only. The production snapshot is from{" "}
          {new Date(run.runAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}.
        </p>
      )}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-r border-border bg-surface p-4">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="num mt-1 text-sm">{children}</dd>
    </div>
  );
}

/** Production runs from manifest.json, with any live runs from this tab on top. */
export function RunHistory({ pipeline, history }: { pipeline: Pipeline["id"]; history: RunSummary[] }) {
  const live = useLiveResults(pipeline);
  const rows = [
    ...live.map((r) => ({
      key: `live-${r.runAt}`,
      runAt: r.runAt,
      trigger: "Your browser",
      rows: r.rowsIn,
      durationMs: r.durationMs,
      passed: r.passed,
      warned: r.warned,
      failed: r.failed,
    })),
    ...history.map((h) => ({
      key: h.runAt,
      runAt: h.runAt,
      trigger: h.trigger === "github-actions" ? "GitHub Actions" : "Local",
      rows: h.rows,
      durationMs: h.durationMs,
      passed: h.passed,
      warned: h.warned,
      failed: h.failed,
    })),
  ];
  if (rows.length === 0) return null;

  return (
    <section className="rounded-md border border-border bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <h3 className="text-base">Run history</h3>
        <p className="text-xs text-text-muted">
          {live.length > 0
            ? `${live.length} live run${live.length > 1 ? "s" : ""} from this tab, then production runs from manifest.json.`
            : `The last ${history.length} production runs, newest first. Kept in manifest.json.`}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-regular sm:px-6">
                Run
              </th>
              <th scope="col" className="px-4 py-2 font-regular">
                Trigger
              </th>
              <th scope="col" className="px-4 py-2 text-right font-regular">
                Rows in
              </th>
              <th scope="col" className="px-4 py-2 text-right font-regular">
                Duration
              </th>
              <th scope="col" className="px-4 py-2 text-right font-regular sm:px-6">
                Tests
              </th>
            </tr>
          </thead>
          <tbody className="num">
            {rows.map((h) => (
              <tr key={h.key} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-2 sm:px-6">
                  {new Date(h.runAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-body">{h.trigger}</td>
                <td className="px-4 py-2 text-right">{h.rows.toLocaleString("en-CA")}</td>
                <td className="px-4 py-2 text-right">{(h.durationMs / 1000).toFixed(1)} s</td>
                <td className="whitespace-nowrap px-4 py-2 text-right sm:px-6">
                  {h.failed ? `✗ ${h.failed} failed` : `✓ ${h.passed} pass`}
                  {h.warned ? ` · ! ${h.warned} warn` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
