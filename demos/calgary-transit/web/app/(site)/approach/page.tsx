import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { Architecture } from "@/components/architecture";
import dag from "@/public/images/airflow-dag.png";
import { CODE_URL, DBT_DOCS_URL } from "@/lib/paths";

export const metadata: Metadata = { title: "Approach" };

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-cgy-line py-8 md:grid-cols-[220px_1fr]">
      <div>
        <p className="text-3xl font-bold leading-none text-cgy-red">{n}</p>
        <h2 className="mt-2 text-xl font-bold">{title}</h2>
      </div>
      <div className="max-w-3xl">{children}</div>
    </section>
  );
}

export default function ApproachPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The approach</p>
      <h1 className="mt-1 text-3xl font-bold">The PRIME approach, applied to Calgary Transit</h1>
      <p className="mt-2 mb-6 max-w-3xl">Six steps, from the problem to what testing caught.</p>

      <Step n={1} title="The problem">
        <p>
          Ridership, service hours and 311 requests are published separately. Definitions shift with reorganizations, and
          nothing says how current each one is. Combining them by hand gives different answers.
        </p>
      </Step>

      <Step n={2} title="Who needs it">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong className="text-cgy-slate">Service planners:</strong> is ridership back, and is service keeping up?</li>
          <li><strong className="text-cgy-slate">311 leads:</strong> what are riders contacting us about?</li>
          <li><strong className="text-cgy-slate">Leadership:</strong> can I trust this number, and how current is it?</li>
        </ul>
        <p className="mt-2 text-sm text-cgy-grey">My assumption for this demo; in a real engagement I&apos;d confirm it in interviews.</p>
      </Step>

      <Step n={3} title="Strategy">
        <p>
          Fix the data once, not every report. Agree the contract before the charts. One grain per table. Only the tested
          gold layer reaches the dashboard and the agent.
        </p>
      </Step>

      <Step n={4} title="Plan">
        <p>Three datasets and five gold tables, one per question. Land, map, test, publish, then build the dashboard and agent.</p>
      </Step>

      <Step n={5} title="Build">
        <Architecture caption={false} />
        <a href={dag.src} className="mt-4 block overflow-hidden rounded-lg border border-cgy-line bg-white">
          <Image
            src={dag}
            alt="Airflow graph of the calgary_transit DAG: bronze loads, freshness check, dbt silver and gold models with tests, docs and publish."
            sizes="(min-width: 1152px) 900px, 100vw"
            className="h-auto w-full"
          />
        </a>
        <p className="mt-2 text-sm text-cgy-grey">
          Airflow runs it daily: 32 tasks, 10 dbt models, 27 tests, then retrains an XGBoost model on the tested
          data. A failed test stops publishing.{" "}
          <a className="font-semibold text-cgy-blue underline" href={DBT_DOCS_URL}>
            dbt docs
          </a>{" "}
          ·{" "}
          <a className="font-semibold text-cgy-blue underline" href={CODE_URL}>
            code
          </a>
        </p>
      </Step>

      <Step n={6} title="Review and iterate">
        <ul className="space-y-3">
          <li>
            <strong className="text-cgy-slate">Complaints looked up 43% per trip.</strong> Lost Property moved into 311 in
            2021. A governed flag fixed it once, for the dashboard and the agent: like for like, it&apos;s 12%.
          </li>
          <li>
            <strong className="text-cgy-slate">The first model lost to a rule of thumb.</strong> Fixed features couldn&apos;t
            keep up as closure times drifted. Adding recent pace and workload, and training on post-pandemic years, beat it
            on 2025 data it never saw.
          </li>
          <li>
            <strong className="text-cgy-slate">The first cloud run failed.</strong> A test ran before its table existed.
            Tests now wait for every table they check.
          </li>
          <li>
            <strong className="text-cgy-slate">The City&apos;s fare breakdown doesn&apos;t add up.</strong> The gap is kept
            as a tested “unallocated” row instead of hidden.
          </li>
        </ul>
      </Step>
    </div>
  );
}
