"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { dataVersion, runQuery, type Row } from "./db";

type Result = { key: string; rows: Row[]; error: string | null; ms: number | null };

/**
 * Re-runs `sql` whenever it changes or a live pipeline run updates the data.
 * The last result stays on screen (dimmed via `loading`) until the new one
 * arrives, and stale results are ignored. `label` names the query in telemetry.
 */
export function useQuery(sql: string, label: string) {
  const version = useSyncExternalStore(dataVersion.subscribe, dataVersion.get, () => 0);
  const key = `${version}:${sql}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    runQuery(sql, label)
      .then(({ rows, ms }) => !cancelled && setResult({ key, rows, error: null, ms }))
      .catch((e: Error) => !cancelled && setResult({ key, rows: [], error: e.message, ms: null }));
    return () => {
      cancelled = true;
    };
  }, [key, sql, label]);

  return {
    rows: result?.rows ?? [],
    error: result?.error ?? null,
    ms: result?.ms ?? null,
    loading: result?.key !== key,
  };
}
