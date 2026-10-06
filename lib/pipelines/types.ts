/**
 * A small, dbt-shaped pipeline model. A pipeline is plain data: raw sources,
 * SQL models in medallion layers, tests and a contract. The same definition
 * runs in Node (production refresh) and in DuckDB-WASM (live runs in the
 * browser) through the engine-agnostic runner in ./runner.ts.
 */

export type Layer = "bronze" | "silver" | "gold";

export type Column = { name: string; type: string };

/** Raw (bronze) table, loaded as-is from extracted JSON. */
export type SourceTable = {
  name: string;
  description: string;
  columns: Column[];
};

export type Model = {
  name: string;
  layer: Exclude<Layer, "bronze">;
  description: string;
  /** SELECT statement. Reference other tables with {{ ref('name') }}. */
  sql: string;
  dependsOn: string[];
  /** Served to the browser as public/data/<file>. */
  served?: { file: string };
  /**
   * How an incremental batch merges into the served table: rows matching this
   * key are replaced. Unique for permits; a partition key (game) for shots.
   */
  mergeKey?: string;
};

export type Severity = "error" | "warn";

/** Tests target served (gold) tables so they can also run in the browser after a live merge. */
type TestBase = { name: string; model: string; severity: Severity; description: string };

export type Test = TestBase &
  (
    | { kind: "not_null" | "unique"; column: string }
    | { kind: "accepted_values"; column: string; values: (string | number)[] }
    /** Every row must satisfy `expression`. */
    | { kind: "expression"; expression: string }
    | { kind: "relationship"; column: string; to: { model: string; column: string } }
    | { kind: "row_count"; min: number }
    | { kind: "freshness"; column: string; maxAgeDays: number }
    /** Arbitrary SQL returning one row with a `failures` column. */
    | { kind: "custom"; sql: string }
  );

export type Contract = {
  owner: string;
  cadence: string;
  freshnessSlaDays: number;
  primaryKeys: Record<string, string>;
  consumers: string[];
  guarantees: string[];
};

export type Pipeline = {
  id: "permits" | "flames" | "housing";
  label: string;
  source: { name: string; url: string; docs: string; licence: string };
  sources: SourceTable[];
  models: Model[];
  tests: Test[];
  contract: Contract;
  /** Optional ML model trained on a gold table after the tests pass. */
  model?: { name: string; description: string; file: string; trainedOn: string };
};

export type ModelResult = {
  name: string;
  layer: Layer;
  rows: number;
  ms: number;
  columns?: { name: string; type: string; nullPct: number }[];
};

export type TestResult = {
  name: string;
  model: string;
  kind: Test["kind"];
  severity: Severity;
  status: "pass" | "warn" | "fail";
  failures: number;
  ms: number;
  sql: string;
};

export type ManifestEntry = {
  pipeline: Pipeline["id"];
  runAt: string;
  durationMs: number;
  trigger: "local" | "github-actions";
  commit: string | null;
  extract: { requests: number; rows: number; ms: number };
  models: ModelResult[];
  tests: TestResult[];
  outputs: { model: string; file: string; rows: number; bytes: number; sha256: string }[];
  /** Present when the pipeline trains a model. Metrics are on held-out rows. */
  model?: {
    file: string;
    bytes: number;
    trainMs: number;
    rows: { train: number; test: number };
    metrics: {
      model: { mae: number; mdape: number; within10: number; r2: number };
      baseline: { mae: number; mdape: number; within10: number; r2: number };
    };
    importance: { feature: string; share: number }[];
  };
};

export type Manifest = { version: 1; pipelines: Partial<Record<Pipeline["id"], ManifestEntry>> };
