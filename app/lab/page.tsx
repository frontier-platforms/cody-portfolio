import type { Metadata } from "next";
import Link from "next/link";
import { Architecture } from "@/components/lab/Architecture";
import { StackList } from "@/components/ui/StackList";
import { labs, type LabEntry } from "@/lib/lab/catalog";
import { manifest } from "@/lib/pipelines/manifest";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Three small data products on Calgary data: building permits, home values with a machine-learning model, and Flames play-by-play. Tested pipelines you can run live, in your browser.",
};

const anatomy = [
  {
    title: "Ask the data",
    body: "Plain-English questions. Claude writes the SQL, the site checks it, your browser runs it.",
  },
  {
    title: "Dashboard",
    body: "Charts that are SQL queries running in DuckDB in your browser. Every one shows its query.",
  },
  {
    title: "Tested pipeline",
    body: "Bronze, silver and gold layers with data tests and a contract. Refreshed weekly, and runnable live.",
  },
  {
    title: "Telemetry",
    body: "Every query’s latency, data downloaded, Core Web Vitals and analytics events, as they happen.",
  },
];

export default function LabIndex() {
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <p className="label">Lab</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">
        Real Calgary data, with the whole pipeline showing.
      </h1>
      <p className="mt-6 max-w-measure text-pretty text-lg text-text-muted">
        Three small data products, built the way I’d want a team to build them: tested, documented and
        observable. Everything runs in your browser, and you can run each pipeline yourself against the live
        source.
      </p>

      <ul className="mt-12 grid gap-4 lg:grid-cols-3">
        {labs.map((lab) => (
          <LabCard key={lab.href} lab={lab} />
        ))}
      </ul>

      <section aria-labelledby="anatomy" className="mt-16">
        <h2 id="anatomy" className="text-2xl sm:text-3xl">
          Every lab has the same four parts
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {anatomy.map((a, i) => (
            <li key={a.title} className="rounded-md border border-border p-4">
              <p className="num text-sm text-text-muted">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 text-base">{a.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{a.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="architecture" className="mt-16">
        <h2 id="architecture" className="text-2xl sm:text-3xl">
          How it fits together
        </h2>
        <p className="mt-2 max-w-measure text-text-muted">
          From public APIs to your browser. Most of it is static files, so it costs almost nothing to run.
        </p>
        <div className="mt-6">
          <Architecture />
        </div>
        <p className="mt-6 text-sm text-text-muted">
          The details, from the pipeline runner to the AI guardrails, are in{" "}
          <Link href="/colophon#pipelines" className="link">
            how this site is built
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

/** Headline numbers for a card, read from the last production run. */
function stats(lab: LabEntry): { value: string; label: string }[] {
  const run = manifest.pipelines[lab.dataset];
  if (!run) return [];
  const rows = run.outputs[0]?.rows ?? 0;
  // Strictly passing; warnings are real source issues and are shown inside each lab.
  const tests = `${run.tests.filter((t) => t.status === "pass").length}/${run.tests.length}`;
  if (lab.dataset === "housing" && run.model) {
    return [
      { value: `${Math.round(rows / 1000)}K`, label: "homes" },
      { value: `${(run.model.metrics.model.mdape * 100).toFixed(1)}%`, label: "median error" },
      { value: tests, label: "tests pass" },
    ];
  }
  if (lab.dataset === "flames") {
    const shots = run.outputs.find((o) => o.model === "flames_shots")?.rows ?? 0;
    return [
      { value: rows.toLocaleString(), label: "games" },
      { value: `${Math.round(shots / 1000)}K`, label: "shot attempts" },
      { value: tests, label: "tests pass" },
    ];
  }
  return [
    { value: `${Math.round(rows / 1000)}K`, label: "permits" },
    { value: tests, label: "tests pass" },
    { value: "Weekly", label: "refresh" },
  ];
}

function LabCard({ lab }: { lab: LabEntry }) {
  return (
    <li className="group relative flex flex-col border border-border bg-surface p-6 transition-colors hover:border-text rounded-md">
      <p className="label">
        <span className="text-accent">{lab.number}</span> · {lab.kicker}
      </p>
      <h2 className="mt-2 text-2xl">
        <Link href={lab.href} className="after:absolute after:inset-0 group-hover:text-accent">
          {lab.title}
        </Link>
      </h2>
      <p className="mt-3 text-base text-text-muted">{lab.lede}</p>

      <dl className="mt-6 grid grid-cols-3 border-y border-border py-3">
        {stats(lab).map((s) => (
          <div key={s.label} className="flex flex-col-reverse">
            <dt className="text-xs text-text-muted">{s.label}</dt>
            <dd className="num text-xl font-regular">{s.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm">
        <span className="font-semibold">Standout:</span> {lab.standout}.
      </p>
      <ul className="prose-cc mt-3 text-sm">
        {lab.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <StackList items={lab.stack} className="mt-6" />
      <span className="mt-auto pt-6 text-sm font-semibold text-accent">Open the lab →</span>
    </li>
  );
}
