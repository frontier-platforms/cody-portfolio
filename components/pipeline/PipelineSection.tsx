import type { ManifestEntry, Pipeline, RunSummary } from "@/lib/pipelines/types";
import { PipelineExplorer } from "./PipelineExplorer";
import { RunHistory, RunSummaryStrip } from "./RunStatus";

const REPO = "https://github.com/frontier-platforms/cody-portfolio";

/**
 * The pipeline behind a Lab tab: the latest run (production, or a live run in this tab),
 * an interactive DAG with a live run, test results and the data contract.
 */
export function PipelineSection({
  pipeline,
  run,
  history,
}: {
  pipeline: Pipeline;
  run: ManifestEntry | undefined;
  history: RunSummary[];
}) {
  const served = run?.outputs ?? [];

  return (
    <div className="space-y-6">
      <RunSummaryStrip pipeline={pipeline} run={run} />

      <PipelineExplorer pipeline={pipeline} run={run} />

      <RunHistory pipeline={pipeline.id} history={history} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-border bg-surface p-6 rounded-md">
          <h3 className="font-semibold">Data contract</h3>
          <p className="mt-1 text-sm text-text-muted">
            What consumers of this data can rely on. The tests above enforce every line of it.
          </p>
          <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-muted">Owner</dt>
            <dd>{pipeline.contract.owner}</dd>
            <dt className="text-text-muted">Refresh</dt>
            <dd>{pipeline.contract.cadence}</dd>
            <dt className="text-text-muted">Freshness SLA</dt>
            <dd>{pipeline.contract.freshnessSlaDays} days</dd>
            <dt className="text-text-muted">Keys</dt>
            <dd className="font-mono text-xs leading-relaxed">
              {Object.entries(pipeline.contract.primaryKeys).map(([t, k]) => (
                <span key={t} className="block">
                  {t}: {k}
                </span>
              ))}
            </dd>
            <dt className="text-text-muted">Consumers</dt>
            <dd>{pipeline.contract.consumers.join(", ")}</dd>
            <dt className="text-text-muted">Source</dt>
            <dd>
              <a href={pipeline.source.docs} className="link">
                {pipeline.source.name}
              </a>
              <span className="block text-xs text-text-muted">{pipeline.source.licence}</span>
            </dd>
          </dl>
          <ul className="prose-cc mt-4 text-sm">
            {pipeline.contract.guarantees.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>

        <section className="border border-border bg-surface p-6 rounded-md">
          <h3 className="font-semibold">Served files</h3>
          <p className="mt-1 text-sm text-text-muted">
            Gold models written as Parquet and committed, so a deploy never depends on a third-party API.
          </p>
          <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
            {served.map((o) => (
              <li key={o.file} className="py-3">
                <div className="flex justify-between gap-3">
                  <a href={`/data/${o.file}`} className="link font-mono text-xs">
                    {o.file}
                  </a>
                  <span className="num text-xs text-text-muted">
                    {o.rows.toLocaleString()} rows ·{" "}
                    {o.bytes >= 1e6 ? `${(o.bytes / 1e6).toFixed(2)} MB` : `${Math.round(o.bytes / 1e3)} KB`}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-text-muted" title={o.sha256}>
                  sha256 {o.sha256.slice(0, 16)}…
                </p>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`${REPO}/tree/main/dbt/models/${pipeline.id}`} className="link">
                dbt models, tests and contract ↗
              </a>
            </li>
            <li>
              <a href="/dbt-docs/index.html" className="link">
                dbt docs and lineage
              </a>
            </li>
            <li>
              <a href={`${REPO}/blob/main/airflow/dags/lab_refresh.py`} className="link">
                The Airflow DAG ↗
              </a>
            </li>
            <li>
              <a href={`${REPO}/actions/workflows/refresh-data.yml`} className="link">
                Weekly runs on GitHub Actions ↗
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
