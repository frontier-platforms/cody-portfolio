import type { Metadata } from "next";
import { LineageGraph } from "@/components/lineage-graph";
import { CODE_URL, DBT_DOCS_URL } from "@/lib/paths";

export const metadata: Metadata = { title: "Approach" };

const STEPS = [
  [
    "The problem",
    "Ridership, service hours and 311 are published separately, with shifting codes and no shared view of how current each is.",
  ],
  [
    "Who needs it",
    "Service planners, 311 leads and leadership: one trusted trips number, comparable trends, known freshness.",
  ],
  [
    "Strategy",
    "Fix the data once, not every report. Contract before charts. One grain per table. Only tested gold is used.",
  ],
  [
    "Plan",
    "Three datasets, five gold tables, one per question. Land, map, test, publish, then the dashboard, model and agent.",
  ],
  [
    "Build",
    "Airflow, dbt and DuckDB, run daily: 32 tasks, 10 models, 27 tests, then an XGBoost model retrained on the tested data.",
  ],
  [
    "Review and iterate",
    "Tests and second looks caught a misleading trend, a failed first run and a model that lost to a rule of thumb.",
  ],
];

export default function ApproachPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The approach</p>
      <h1 className="mt-1 text-3xl font-bold">The same approach, applied to Calgary Transit</h1>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <li
            key={title}
            className={`rounded-lg p-5 ${i === STEPS.length - 1 ? "border-2 border-cgy-red bg-white" : "bg-cgy-paper"}`}
          >
            <p className="flex items-baseline gap-3">
              <span className="text-2xl font-bold leading-none text-cgy-red">{i + 1}</span>
              <span className="text-lg font-bold text-cgy-slate">{title}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12" aria-labelledby="lineage">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="lineage" className="text-xl font-bold">
            How the data flows
          </h2>
          <p className="text-sm text-cgy-grey">
            Generated from the dbt project on every run ·{" "}
            <a className="font-semibold text-cgy-blue underline" href={DBT_DOCS_URL}>
              dbt docs
            </a>{" "}
            ·{" "}
            <a className="font-semibold text-cgy-blue underline" href={CODE_URL}>
              code
            </a>
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-cgy-line bg-white p-4">
          <LineageGraph />
        </div>
      </section>
    </div>
  );
}
