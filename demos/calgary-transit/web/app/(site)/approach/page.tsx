import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { Architecture } from "@/components/architecture";
import { ContractTable } from "@/components/contract-table";
import dag from "@/public/images/airflow-dag.png";
import { CODE_URL, DBT_DOCS_URL } from "@/lib/paths";

export const metadata: Metadata = { title: "Approach" };

const NEEDS = [
  ["Service planning", "Is ridership back, and is service keeping up?", "Trips, boardings and service hours on one monthly grain"],
  ["311 and customer service", "What are riders contacting us about, and is it changing?", "Stable categories across reorganizations and renamed request types; like-for-like comparisons"],
  ["Fare and program policy", "Which rider groups and fare products are growing?", "A fare breakdown that always reconciles to official ridership"],
  ["Leadership and reporting", "Can I trust this number, and how current is it?", "A named owner, a freshness target and tests on every run"],
  ["Everyone", "Can I answer this myself?", "A self-serve dashboard and plain-English questions over the same tables"],
];

const DECISIONS = [
  ["Fix the data once, not every report", "Land raw data untouched, model it once in dbt, and point every consumer at the result."],
  ["Agree the contract before the charts", "Owners, freshness targets, incident tiers and accuracy rules come first, so trust is designed in."],
  ["One grain per table", "Each gold table answers one shape of question. That stops double counting, for people and for AI."],
  ["Only gold leaves the warehouse", "The dashboard and agent can't see raw or intermediate data, by construction."],
  ["Open, free tools", "Airflow, dbt and DuckDB: the same pattern as PRIME, with Snowflake swapped for a free engine."],
];

const PLAN = [
  ["Land", "Three City datasets into bronze, 311 incrementally"],
  ["Model and map", "Silver facts, plus reference tables for codes and categories"],
  ["Test", "Keys, ranges, mappings and reconciliation on every run"],
  ["Publish", "Five gold tables, one per question, to the website"],
  ["Use", "Dashboard first, then the AI agent on the same tables"],
];

const REVIEW = [
  {
    found: "The first cloud run failed.",
    detail:
      "A reconciliation test ran before one of the tables it checks existed. It passed locally only because my warehouse already had that table.",
    changed: "Tests that span several models now wait for all of them. Verified on a brand-new warehouse, as CI runs it.",
  },
  {
    found: "Rider complaints looked up 43% per trip.",
    detail: "Lost Property only moved into 311 in 2021, so most of the jump was a new channel, not unhappier riders.",
    changed:
      "A governed “comparable across years” flag on the category reference table. Like for like, feedback per trip is up 12%, and the agent is told the same rule.",
  },
  {
    found: "The City's fare breakdown doesn't add up.",
    detail: "Published fare products never sum to published ridership, and in 55 months the breakdown is larger than the total.",
    changed: "The gap is an explicit, tested “unallocated” row, and the 55 months raise a warning instead of being hidden.",
  },
  {
    found: "Adding a column broke the cached warehouse.",
    detail: "The daily run keeps its warehouse between runs, so a changed reference table no longer matched.",
    changed: "Reference tables rebuild every run. They're tiny, and schema changes can't break the pipeline.",
  },
];

const ISSUES = [
  ["One department, four codes", "311 files Calgary Transit under TRAN, OS, OSC and Tranc as the organization changed. A reference table maps every code to one department."],
  ["67 request types, 12 categories", "Request types were retired, renamed and split over 15 years. A new, unmapped type fails the build instead of disappearing from a chart."],
  ["Two measures called ridership", "June 2025: 8.1M trips and 13.6M boardings. A transfer is one trip but two boardings, so they stay separate."],
  ["Rows that look like data", "258 of 480 ridership rows hold only a date. They're dropped, and freshness is measured on real values."],
  ["Feeds at different speeds", "311 is current to yesterday; ridership lags by more than a year. Each domain has its own target."],
];

const MAPPING = [
  ["Warehouse", "Snowflake", "DuckDB (same dbt models; only the adapter changes)"],
  ["Orchestration", "Airflow", "Airflow, with dbt as tasks via Astronomer Cosmos, triggered daily by GitHub Actions"],
  ["Transformation", "dbt, 100+ tested models", "dbt, 10 models and 27 tests"],
  ["Data contract", "Targets per domain, three incident tiers, named owners", "A versioned contract, checked every run and shown on the dashboard"],
  ["Access", "PII masked at bronze; role-based access", "Only gold is published; the browser database blocks files, URLs and writes"],
  ["AI", "Grain-specific semantic models behind Stellar Insights", "Gold tables with one documented grain, read by the agent"],
];

function Section({ kicker, title, intro, children }: { kicker: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-14 first:mt-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">{kicker}</p>
      <h2 className="mt-1 text-2xl font-bold">{title}</h2>
      {intro && <p className="mt-2 max-w-3xl">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-cgy-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-cgy-mist text-cgy-navy">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-cgy-line align-top">
              {r.map((c, i) => (
                <td key={i} className={`px-3 py-2 ${i === 0 ? "font-semibold text-cgy-navy" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApproachPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The approach</p>
      <h1 className="mt-1 text-3xl font-bold">The PRIME process, applied to Calgary Transit</h1>
      <p className="mt-2 max-w-3xl">
        PRIME&apos;s data belongs to StellarAlgo&apos;s clients, so I ran the same process on City of Calgary open data:
        start from the problem and the people, agree what “right” means, then build, test and fix what review finds.
      </p>

      <Section
        kicker="The problem"
        title="The City's transit data is published, but not ready to decide with"
        intro="Ridership, service hours and 311 requests are published as separate datasets by different systems. Each is accurate on its own terms, but the definitions shift over time and nothing says how current each one is. Combining them by hand gives different answers to the same question."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Separate systems", "Three datasets, three refresh schedules, no shared month or definition to join on."],
            ["Shifting definitions", "Department codes and request types change with reorganizations and new programs."],
            ["Unknown freshness", "Nothing tells a reader that ridership is more than a year behind 311."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-lg border border-cgy-line border-l-4 border-l-cgy-red p-4">
              <p className="font-bold text-cgy-navy">{t}</p>
              <p className="mt-1 text-sm">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        kicker="Who needs it"
        title="The questions people ask, and the requirement each one creates"
        intro="These are the users I'd expect at the City. In a real engagement I'd confirm them in short interviews and by reviewing the reports each group already maintains."
      >
        <Table head={["Who", "Their question", "What the data product must do"]} rows={NEEDS} />
      </Section>

      <Section kicker="The strategy" title="Fix the data once, then make it self-serve">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DECISIONS.map(([t, b]) => (
            <div key={t} className="rounded-lg bg-cgy-paper p-4">
              <p className="font-bold text-cgy-navy">{t}</p>
              <p className="mt-1 text-sm">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        kicker="The plan"
        title="Small scope, end to end, each step usable on its own"
        intro="Three datasets and five gold tables, one for each question above. Every step was finished and tested before the next one started."
      >
        <ol className="grid gap-2 sm:grid-cols-5">
          {PLAN.map(([t, b], i) => (
            <li key={t} className="rounded-lg border border-cgy-line p-4">
              <p className="text-2xl font-bold leading-none text-cgy-red">{i + 1}</p>
              <p className="mt-2 font-bold text-cgy-navy">{t}</p>
              <p className="mt-1 text-sm">{b}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section kicker="The build" title="Airflow, dbt and DuckDB, the same shape as PRIME">
        <Architecture />
        <a href={dag.src} className="mt-6 block overflow-hidden rounded-lg border border-cgy-line bg-white">
          <Image
            src={dag}
            alt="Airflow graph of the calgary_transit DAG: bronze loads, freshness check, dbt seeds, silver and gold task groups, reconciliation test, docs and publish."
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="h-auto w-full"
          />
        </a>
        <p className="mt-2 text-xs text-cgy-grey">
          One DAG, 31 tasks: three loads into bronze, a freshness check, every dbt model as a run-and-test pair, then docs and
          publish. Select the image to open it full size.
        </p>
        <div className="mt-6">
          <Table head={["Concern", "PRIME at StellarAlgo", "This replica"]} rows={MAPPING} />
        </div>
      </Section>

      <Section
        kicker="Review and iterate"
        title="What testing and review caught, and what changed"
        intro="Every one of these was found by a test, a failed run or a second look at a number that seemed too good or too bad."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {REVIEW.map((r) => (
            <div key={r.found} className="rounded-lg border border-cgy-line bg-white p-4">
              <p className="font-bold text-cgy-navy">{r.found}</p>
              <p className="mt-1 text-sm">{r.detail}</p>
              <p className="mt-3 border-t border-cgy-line pt-3 text-sm">
                <span className="font-semibold text-cgy-green">Changed: </span>
                {r.changed}
              </p>
            </div>
          ))}
        </div>
        <h3 className="mt-8 text-lg font-bold">Handled in the model from day one</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ISSUES.map(([t, b]) => (
            <div key={t} className="rounded-lg border-l-4 border-l-cgy-teal bg-cgy-paper p-3">
              <p className="text-sm font-bold text-cgy-navy">{t}</p>
              <p className="mt-1 text-xs leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        kicker="The contract"
        title="What every consumer can rely on"
        intro={
          <>
            Read live from the gold layer. The code, the{" "}
            <a className="font-semibold text-cgy-blue underline" href={DBT_DOCS_URL}>
              dbt docs and lineage
            </a>{" "}
            and the{" "}
            <a className="font-semibold text-cgy-blue underline" href={CODE_URL}>
              repository
            </a>{" "}
            are public.
          </>
        }
      >
        <ContractTable />
      </Section>
    </div>
  );
}
