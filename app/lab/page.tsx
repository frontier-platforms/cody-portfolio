import type { Metadata } from "next";
import Link from "next/link";
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
    title: "Dashboard",
    body: "Charts that are SQL queries running in DuckDB in your browser. Every one shows its query.",
  },
  {
    title: "Ask the data",
    body: "Plain-English questions. Claude writes the SQL, the site checks it, your browser runs it.",
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
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
      <p className="label">Lab</p>
      <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Real Calgary data, with the whole pipeline showing.
      </h1>
      <p className="mt-5 max-w-2xl text-pretty text-lg text-muted">
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
        <h2 id="anatomy" className="label text-ink">
          Every lab has the same four parts
        </h2>
        <ol className="mt-4 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {anatomy.map((a, i) => (
            <li key={a.title} className="border-b border-r border-line p-5">
              <p className="num text-xs text-accent">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-1 font-semibold">{a.title}</p>
              <p className="mt-1 text-sm text-muted">{a.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
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
    <li className="group relative flex flex-col border border-line bg-surface p-6 transition-colors hover:border-ink">
      <p className="label">
        <span className="text-accent">{lab.number}</span> · {lab.kicker}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        <Link href={lab.href} className="after:absolute after:inset-0 group-hover:text-accent-ink">
          {lab.title}
        </Link>
      </h2>
      <p className="mt-3 text-[0.95rem] text-muted">{lab.lede}</p>

      <dl className="mt-5 grid grid-cols-3 border-y border-line py-3">
        {stats(lab).map((s) => (
          <div key={s.label} className="flex flex-col-reverse">
            <dt className="text-[0.7rem] text-muted">{s.label}</dt>
            <dd className="num text-xl font-medium">{s.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm">
        <span className="font-medium">Standout:</span> {lab.standout}.
      </p>
      <ul className="prose-cc mt-3 text-[0.9rem]">
        {lab.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <StackList items={lab.stack} className="mt-5" />
      <span className="mt-auto pt-6 text-sm font-medium text-accent-ink">Open the lab →</span>
    </li>
  );
}
