"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { HighlightResult, Pipeline } from "@/lib/pipelines/types";

/**
 * Live runs from this tab, newest first. The run summary, run history and the
 * lab header read from here, so a live run shows up everywhere the production
 * run does. Nothing persists: a refresh goes back to the production snapshot.
 */
export type LiveResult = {
  pipeline: Pipeline["id"];
  runAt: string;
  durationMs: number;
  outcome: "success" | "failed";
  rowsIn: number;
  inserted: number;
  updated: number;
  passed: number;
  warned: number;
  failed: number;
  /** Lab header findings recomputed on the merged data. Null if the run failed first. */
  highlights: HighlightResult[] | null;
};

const EMPTY: LiveResult[] = [];
let results: LiveResult[] = EMPTY;
const listeners = new Set<() => void>();

export const liveResults = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => results,
  add(result: LiveResult) {
    results = [result, ...results];
    listeners.forEach((l) => l());
  },
};

export function useLiveResults(pipeline: Pipeline["id"]) {
  const all = useSyncExternalStore(liveResults.subscribe, liveResults.get, () => EMPTY);
  return useMemo(() => all.filter((r) => r.pipeline === pipeline), [all, pipeline]);
}

/** Same rules as _format in pipeline/publish.py, so live and production findings read alike. */
export function formatHighlight(
  valueNumber: number | null,
  valueText: string | null,
  format: string,
): string {
  if (format === "count") return Math.trunc(valueNumber ?? 0).toLocaleString("en-CA");
  if (format === "money") {
    const v = valueNumber ?? 0;
    return v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.floor(v / 1e3 + 0.5)}K`;
  }
  if (format === "percent") return `${((valueNumber ?? 0) * 100).toFixed(1)}%`;
  const text = String(valueText ?? "");
  return text === text.toUpperCase() && /[A-Z]/.test(text)
    ? text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : text;
}
