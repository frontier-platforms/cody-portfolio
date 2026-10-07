/**
 * Pipeline types for the site. The pipelines themselves are defined in dbt
 * (dbt/models) and built by the Airflow DAG. pipeline/publish.py turns dbt's
 * manifest into lib/pipelines/generated/<id>.json: bronze shapes, the SQL dbt
 * compiled for each model and test, and the contract. The site renders those,
 * and the browser's live runs execute that same compiled SQL in DuckDB-WASM.
 */

export type Layer = "bronze" | "silver" | "gold";

export type Column = { name: string; type: string };

/** Raw (bronze) table, from dbt's sources.yml. */
export type SourceTable = {
  name: string;
  description: string;
  columns: Column[];
};

export type Model = {
  name: string;
  layer: Exclude<Layer, "bronze">;
  description: string;
  /** dbt-compiled SELECT. Other tables appear as {{ ref('name') }}. */
  sql: string;
  dependsOn: string[];
  /** Served to the browser as public/data/<file>. */
  served?: { file: string };
  /**
   * How an incremental batch merges into the served table: rows matching this
   * key are replaced. Unique for permits; a partition key (game) for shots.
   */
  mergeKey?: string;
  /** dbt enforces this model's column names and types. */
  contract: boolean;
  /** Source file in the repo, e.g. dbt/models/permits/stg_permits.sql. */
  path: string;
};

export type Severity = "error" | "warn";

/** A dbt test, compiled. `sql` returns one row with a `failures` count. */
export type Test = {
  name: string;
  model: string;
  /** dbt test name (unique, not_null, accepted_values, relationships, ...) or "singular". */
  kind: string;
  severity: Severity;
  description: string;
  sql: string;
};

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
  /** ML model trained on a gold table after the tests pass. */
  model?: { name: string; description: string; file: string; trainedOn: string; path: string };
};

export type HighlightResult = { label: string; value: string; detail: string | null };

export type RunSummary = {
  runAt: string;
  trigger: ManifestEntry["trigger"];
  durationMs: number;
  rows: number;
  passed: number;
  warned: number;
  failed: number;
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
  kind: string;
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
  orchestrator?: string;
  commit: string | null;
  extract: { requests: number; rows: number; ms: number };
  models: ModelResult[];
  tests: TestResult[];
  outputs: { model: string; file: string; rows: number; bytes: number; sha256: string }[];
  highlights?: HighlightResult[];
  /** Present when the pipeline trains a model. Metrics are on held-out rows. */
  model?: {
    file: string;
    bytes: number;
    trainMs: number;
    library?: string;
    rows: { train: number; test: number };
    metrics: {
      model: { mae: number; mdape: number; within10: number; r2: number };
      baseline: { mae: number; mdape: number; within10: number; r2: number };
    };
    importance: { feature: string; share: number }[];
  };
};

export type Manifest = {
  version: 1;
  pipelines: Partial<Record<Pipeline["id"], ManifestEntry>>;
  /** The most recent production runs per pipeline, newest first. */
  history?: Partial<Record<Pipeline["id"], RunSummary[]>>;
};
