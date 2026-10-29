import type { Metadata } from "next";
import { LineageGraph } from "@/components/lineage-graph";
import { CODE_URL, DBT_DOCS_URL } from "@/lib/paths";

export const metadata: Metadata = { title: "Approach" };

const STEPS = [
  ["The problem", "Data published as separate datasets, with no single source of truth for reporting."],
  ["Requirements", "What planners, 311 leads and leadership need to trust a number."],
  ["Strategy", "Fix the data in one place, not in every report."],
  ["Plan", "Medallion layers, a data contract, one grain per table."],
  ["Build", "dbt models in DuckDB, orchestrated by Airflow, tested on every run."],
  ["Review & iterate", "Review caught a misleading trend, and the fix went in at the source."],
];

export default function ApproachPage() {
  return (
    // On laptops and up, the page fills the window and the lineage graph scales to the space left.
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:flex lg:h-[calc(100dvh-60px)] lg:min-h-[600px] lg:flex-col lg:pb-5 lg:pt-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The approach</p>
      <h1 className="mt-1 text-3xl font-bold">The same approach, applied to Calgary Transit</h1>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-4 lg:grid-cols-6">
        {STEPS.map(([title, body], i) => {
          // The problem sits first and unnumbered; the five steps match the presentation's numbering.
          const problem = i === 0;
          const last = i === STEPS.length - 1;
          return (
            <li
              key={title}
              className={`rounded-lg p-5 lg:p-4 tall:p-5 ${
                problem ? "bg-cgy-slate text-white" : last ? "bg-cgy-red text-white" : "bg-cgy-paper"
              }`}
            >
              <p className="flex items-baseline gap-3 lg:gap-2">
                {!problem && (
                  <span
                    className={`text-2xl font-bold leading-none lg:text-xl tall:text-2xl ${last ? "" : "text-cgy-red"}`}
                  >
                    {i}
                  </span>
                )}
                <span
                  className={`text-lg font-bold leading-tight lg:text-base tall:text-lg ${
                    problem || last ? "" : "text-cgy-slate"
                  }`}
                >
                  {title}
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed lg:leading-snug tall:text-base">{body}</p>
            </li>
          );
        })}
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
