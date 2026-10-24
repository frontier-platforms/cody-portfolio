"use client";

import { useEffect, useState } from "react";
import { query, type Row } from "@/lib/duckdb";

type State = { rows: Row[] | null; error: string | null };

export function useQuery<T extends Row = Row>(sql: string) {
  const [state, setState] = useState<State>({ rows: null, error: null });

  useEffect(() => {
    let cancelled = false;
    query(sql)
      .then((r) => !cancelled && setState({ rows: r.rows, error: null }))
      .catch((e: unknown) => !cancelled && setState({ rows: null, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      cancelled = true;
    };
  }, [sql]);

  return { rows: state.rows as T[] | null, error: state.error, loading: state.rows === null && state.error === null };
}
