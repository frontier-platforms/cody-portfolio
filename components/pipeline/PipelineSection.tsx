import type { ManifestEntry, Pipeline, RunSummary } from "@/lib/pipelines/types";
import { FreshnessBadge } from "./FreshnessBadge";
import { PipelineExplorer } from "./PipelineExplorer";

const REPO = "https://github.com/frontier-platforms/cody-portfolio";

/**
 * The pipeline behind a Lab tab: last production run (from manifest.json),
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
  const passed = run?.tests.filter((t) => t.status === "pass").length ?? 0;
  const warned = run?.tests.filter((t) => t.status === "warn").length ?? 0;

  return (
    <div className="space-y-6">
      {run && (
        <dl className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-5">
          <Cell label="Last production run">
            <FreshnessBadge runAt={run.runAt} slaDays={pipeline.contract.freshnessSlaDays} />
          </Cell>
          <Cell label="Trigger">
            {run.trigger === "github-actions" ? "Airflow on GitHub Actions" : "Local run"}
          </Cell>
          <Cell label="Duration">{(run.durationMs / 1000).toFixed(1)} s</Cell>
          <Cell label="Rows extracted">{run.extract.rows.toLocaleString()}</Cell>
          <Cell label="Tests">
            {passed} pass · {warned} warn
          </Cell>
        </dl>
      )}

      <PipelineExplorer pipeline={pipeline} run={run} />

      {history.length > 0 && <RunHistory history={history} />}

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

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-r border-border bg-surface p-4">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="num mt-1 text-sm">{children}</dd>
    </div>
  );
}

/** Recent production runs, newest first, from manifest.json. */
function RunHistory({ history }: { history: RunSummary[] }) {
  return (
    <section className="rounded-md border border-border bg-surface">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <h3 className="text-base">Production runs</h3>
        <p className="text-xs text-text-muted">
          The last {history.length}, newest first. Kept in manifest.json.
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
            {history.map((h) => (
              <tr key={h.runAt} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-2 sm:px-6">
                  {new Date(h.runAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-body">
                  {h.trigger === "github-actions" ? "GitHub Actions" : "Local"}
                </td>
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
