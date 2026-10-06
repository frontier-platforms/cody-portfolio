/**
 * In-memory telemetry for the current tab: DuckDB queries, data loads,
 * analytics events, Core Web Vitals and pipeline runs. Nothing here leaves the
 * browser; it powers the Telemetry panel so visitors can see what the site is
 * doing as they use it. Immutable updates make it safe for useSyncExternalStore.
 */

export type QueryRecord = {
  id: number;
  label: string;
  sql: string;
  ms: number;
  rows: number;
  at: number;
  error?: string;
};

export type LoadRecord = { table: string; bytes: number; fetchMs: number; loadMs: number; at: number };

export type EventRecord = {
  id: number;
  name: string;
  props: Record<string, string | number | boolean>;
  at: number;
  valid: boolean;
  issues: string[];
};

export type VitalRecord = { name: string; value: number; rating: "good" | "needs-improvement" | "poor" };

export type RunRecord = {
  id: number;
  pipeline: string;
  at: number;
  ms: number;
  outcome: "success" | "failed";
  rowsIn: number;
  inserted: number;
  updated: number;
  testsFailed: number;
  testsWarned: number;
};

export type TelemetryState = {
  startedAt: number;
  engine: { initMs: number; bundle: string } | null;
  queries: QueryRecord[];
  loads: LoadRecord[];
  events: EventRecord[];
  vitals: Record<string, VitalRecord>;
  runs: RunRecord[];
};

const MAX = 500;
let nextId = 1;
let state: TelemetryState = {
  startedAt: Date.now(),
  engine: null,
  queries: [],
  loads: [],
  events: [],
  vitals: {},
  runs: [],
};
const listeners = new Set<() => void>();

function update(patch: (s: TelemetryState) => Partial<TelemetryState>) {
  state = { ...state, ...patch(state) };
  listeners.forEach((l) => l());
}

const cap = <T>(list: T[], item: T) => [...list.slice(-(MAX - 1)), item];

export const telemetry = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  engine: (initMs: number, bundle: string) => update(() => ({ engine: { initMs, bundle } })),
  query: (q: Omit<QueryRecord, "id" | "at">) =>
    update((s) => ({ queries: cap(s.queries, { ...q, id: nextId++, at: Date.now() }) })),
  load: (l: Omit<LoadRecord, "at">) => update((s) => ({ loads: cap(s.loads, { ...l, at: Date.now() }) })),
  event: (e: Omit<EventRecord, "id" | "at">) =>
    update((s) => ({ events: cap(s.events, { ...e, id: nextId++, at: Date.now() }) })),
  vital: (v: VitalRecord) => update((s) => ({ vitals: { ...s.vitals, [v.name]: v } })),
  run: (r: Omit<RunRecord, "id" | "at">) =>
    update((s) => ({ runs: cap(s.runs, { ...r, id: nextId++, at: Date.now() }) })),
};

/** Nearest-rank percentile. */
export function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}
