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

const CAUGHT = [
  [
    "Complaints looked up 43% per trip.",
    "Lost Property moved into 311 in 2021. A governed flag fixed it once, for every consumer: like for like, it's 12%.",
  ],
  [
    "The first model lost to a rule of thumb.",
    "Adding recent pace and workload, and training on post-pandemic years, beat it on 2025 data it never saw.",
  ],
  [
    "The first cloud run failed.",
    "A test ran before its table existed. Tests now wait for every table they check.",
  ],
  [
    "The City's fare breakdown doesn't add up.",
    "The gap is kept as a tested “unallocated” row instead of hidden.",
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

      <section className="mt-12" aria-labelledby="caught">
        <h2 id="caught" className="text-xl font-bold">
          What review caught, and what changed
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CAUGHT.map(([found, fix]) => (
            <div key={found} className="rounded-lg border border-cgy-line p-4">
              <p className="font-semibold text-cgy-slate">{found}</p>
              <p className="mt-1 text-sm leading-relaxed">{fix}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
