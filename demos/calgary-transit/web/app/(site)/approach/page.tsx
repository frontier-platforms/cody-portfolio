import type { Metadata } from "next";
import { LineageGraph } from "@/components/lineage-graph";
import { CODE_URL, DBT_DOCS_URL } from "@/lib/paths";

export const metadata: Metadata = { title: "Approach" };

const STEPS = [
  [
    "The problem",
    "Ridership, service hours and 311 are published separately, with no shared view of freshness.",
  ],
  ["Who needs it", "Planners, 311 leads and leadership: one trusted, current number."],
  ["Strategy", "Fix the data once, not every report. Only tested gold is used."],
  ["Plan", "Three datasets, five gold tables, one per question."],
  ["Build", "Airflow, dbt and DuckDB, daily: 10 models, 27 tests, an XGBoost model."],
  ["Review and iterate", "Tests caught a misleading trend, a failed first run and a weak first model."],
];

export default function ApproachPage() {
  return (
    // On laptops and up, the page fills the window and the lineage graph scales to the space left.
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:flex lg:h-[calc(100dvh-60px)] lg:min-h-[600px] lg:flex-col lg:pb-5 lg:pt-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The approach</p>
      <h1 className="mt-1 text-3xl font-bold">The same approach, applied to Calgary Transit</h1>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-4 lg:grid-cols-6">
        {STEPS.map(([title, body], i) => (
          <li
            key={title}
            className={`rounded-lg p-5 lg:p-4 tall:p-5 ${i === STEPS.length - 1 ? "border-2 border-cgy-red bg-white" : "bg-cgy-paper"}`}
          >
            <p className="flex items-baseline gap-3 lg:gap-2">
              <span className="text-2xl font-bold leading-none text-cgy-red lg:text-xl tall:text-2xl">{i + 1}</span>
              <span className="text-lg font-bold leading-tight text-cgy-slate lg:text-base tall:text-lg">{title}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed lg:leading-snug tall:text-base">{body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12 lg:mt-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col" aria-labelledby="lineage">
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
        <div className="mt-4 rounded-lg border border-cgy-line bg-white p-4 lg:mt-3 lg:min-h-0 lg:flex-1">
          <LineageGraph />
        </div>
      </section>
    </div>
  );
}
