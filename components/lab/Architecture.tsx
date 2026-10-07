const REPO = "https://github.com/frontier-platforms/cody-portfolio";

type Stage = {
  name: string;
  where: string;
  marker: string;
  items: string[];
  link: { href: string; label: string };
};

// Stage markers use the data palette: BRAND.md section 8 allows simple diagrams in data colors.
const stages: Stage[] = [
  {
    name: "Sources",
    where: "Public APIs",
    marker: "bg-data-4",
    items: ["City of Calgary: permits, assessments, use codes", "NHL: schedules and play-by-play"],
    link: { href: `${REPO}/tree/main/ingest`, label: "Python extract code" },
  },
  {
    name: "Weekly run",
    where: "Airflow on GitHub Actions",
    marker: "bg-data-1",
    items: [
      "dbt on DuckDB builds raw, cleaned and business-ready layers",
      "dbt tests and contracts gate the run",
      "XGBoost retrains the value model after tests pass",
    ],
    link: { href: `${REPO}/blob/main/airflow/dags/lab_refresh.py`, label: "Airflow DAG" },
  },
  {
    name: "Published",
    where: "Repo and CDN",
    marker: "bg-data-3",
    items: ["Parquet files and the model, committed", "A manifest of every run", "dbt docs with lineage"],
    link: { href: "/dbt-docs/index.html", label: "dbt docs" },
  },
  {
    name: "In your browser",
    where: "DuckDB-WASM",
    marker: "bg-data-2",
    items: [
      "Loads only the tables a page needs",
      "Runs every chart query locally",
      "Live runs of dbt’s compiled SQL",
      "Model training in Python, through Pyodide",
    ],
    link: { href: `${REPO}/blob/main/lib/pipelines/runner.ts`, label: "Browser runner" },
  },
];

const edges = [
  {
    name: "Ask the data",
    detail: "Your question and the schemas go to Claude. SQL comes back and runs in your browser.",
  },
  { name: "NHL proxy", detail: "Two allowed URL shapes, cached at the edge and rate limited." },
  { name: "Analytics", detail: "Typed events go to Vercel Analytics. Telemetry stays in your tab." },
];

/** How the Lab fits together, from source API to your browser. */
export function Architecture() {
  return (
    <div className="space-y-4">
      <ol className="grid gap-4 lg:grid-cols-4">
        {stages.map((s, i) => (
          <li key={s.name} className="relative flex flex-col rounded-md border border-border bg-surface p-4">
            <span aria-hidden className={`h-1 w-8 rounded-full ${s.marker}`} />
            <p className="meta mt-3">
              {String(i + 1).padStart(2, "0")} · {s.where}
            </p>
            <h3 className="mt-1 text-base">{s.name}</h3>
            <ul className="prose-cc mt-2 text-sm">
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            <a href={s.link.href} className="link mt-auto inline-flex min-h-11 items-center pt-2 text-sm">
              {s.link.label}
            </a>
            {i < stages.length - 1 && (
              <span aria-hidden className="absolute -right-3 top-6 hidden text-text-muted lg:block">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <ul className="grid gap-4 lg:grid-cols-3">
        {edges.map((e) => (
          <li key={e.name} className="rounded-md border border-dashed border-border p-4 text-sm">
            <p className="font-semibold">{e.name}</p>
            <p className="mt-1 text-text-muted">{e.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
