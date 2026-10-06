import type { Metadata } from "next";
import Link from "next/link";
import { trackingPlan } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "How this site is built",
  description:
    "The stack, data pipelines, observability, analytics tracking plan, AI guardrails and design decisions behind this site.",
};

const REPO = "https://github.com/frontier-platforms/cody-portfolio";

const sections = [
  {
    id: "stack",
    title: "Stack",
    body: (
      <>
        <p>
          Next.js with the App Router and TypeScript, styled with Tailwind CSS and deployed on Vercel. Every
          page except two small API routes is generated at build time, so most of the site is plain HTML on a
          CDN.
        </p>
        <p>
          Case studies are MDX files. Each one exports typed metadata that’s validated with Zod at build time,
          so adding a case study means adding one file, and a missing field fails the build instead of
          shipping a broken page.
        </p>
      </>
    ),
  },
  {
    id: "pipelines",
    title: "Data pipelines",
    body: (
      <>
        <p>
          Each Lab dataset is a small data product with a pipeline defined once, as data: raw sources, SQL
          models in bronze, silver and gold layers, tests and a contract. Models reference each other with{" "}
          <code>{"{{ ref('name') }}"}</code>, the same way dbt does.
        </p>
        <p>
          <strong>One definition, two runtimes.</strong> A small runner takes any engine that can execute SQL.
          In production it drives DuckDB in Node; in the Lab it drives DuckDB compiled to WebAssembly in your
          browser. The models, tests and results are identical.
        </p>
        <ul>
          <li>
            <strong>Scheduled.</strong> GitHub Actions runs every pipeline weekly, then commits the new
            Parquet files and a run manifest. Vercel redeploys on the commit.
          </li>
          <li>
            <strong>Tested.</strong> Uniqueness, nulls, accepted values, ranges, referential integrity,
            freshness and row-count guards. Flames shot-level goals are reconciled against the official final
            score for every game.
          </li>
          <li>
            <strong>Contracted.</strong> An error-level failure stops the run before anything is written, so
            the last good snapshot keeps serving. Warnings are real issues in the source data, shown rather
            than hidden.
          </li>
          <li>
            <strong>Incremental.</strong> Live permit runs use the City’s <code>:updated_at</code> field as a
            watermark, so status changes on old permits are picked up, not just new applications. Changed rows
            merge on the primary key.
          </li>
        </ul>
        <p>
          <a href={`${REPO}/tree/main/lib/pipelines`} className="link">
            Read the pipeline code
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "duckdb",
    title: "Queries in your browser",
    body: (
      <>
        <p>
          The Lab runs DuckDB compiled to WebAssembly. The engine and Parquet files load only when you scroll
          to a demo, and each table downloads only when a query first needs it. After that, filters are SQL
          queries that run locally in milliseconds, with no API to wait on and no per-query cost.
        </p>
        <p>Every chart panel has a “Show SQL” toggle. If a number looks wrong, you can check it.</p>
      </>
    ),
  },
  {
    id: "observability",
    title: "Observability",
    body: (
      <>
        <p>
          The Telemetry panel (on the Lab tabs, or{" "}
          <kbd className="border border-line px-1 font-mono text-xs">⌘K</kbd> → Open telemetry) shows what
          this tab has done: Core Web Vitals measured with the web-vitals library, the DuckDB engine’s
          start-up time, every table downloaded, every query with its latency and p50 and p95, each analytics
          event, and every pipeline run.
        </p>
        <p>It’s all in memory in your browser. Nothing in the panel is sent anywhere.</p>
      </>
    ),
  },
  {
    id: "tracking",
    title: "Analytics and the tracking plan",
    body: (
      <>
        <p>
          Page views come from Vercel Web Analytics: no cookies, no cross-site tracking, no personal data.
          Product events follow a tracking plan written as code. Each event is validated against the plan
          before it’s sent, so a typo or an unplanned property is caught in development and dropped in
          production. The table below is generated from that plan.
        </p>
        <p>No free text is ever sent. Questions you type into “Ask the data” are tracked only as a length.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "The AI feature and its guardrails",
    body: (
      <>
        <p>
          “Ask the data” sends your question to Claude through a small server route. Claude replies in a fixed
          JSON shape with one SQL query, a short explanation and a chart suggestion. The guardrails, in order:
        </p>
        <ul>
          <li>
            <strong>Narrow input.</strong> Questions are capped at 300 characters, and the dataset is picked
            from a fixed list.
          </li>
          <li>
            <strong>Narrow context.</strong> Claude sees the question and the table schemas. No keys, no
            personal data, no tools, no browsing.
          </li>
          <li>
            <strong>Prompt injection is expected.</strong> The question is wrapped and labelled as untrusted
            visitor input. Off-topic requests get a short “here’s what I can answer” instead of a query.
          </li>
          <li>
            <strong>Structured output.</strong> The response must match a JSON schema, so there’s no free text
            to parse or render as HTML.
          </li>
          <li>
            <strong>SQL is checked twice.</strong> Once on the server and once in the browser: a single
            SELECT, no file, network or settings functions, and a hard 200-row cap.
          </li>
          <li>
            <strong>The blast radius is tiny by design.</strong> The query runs in your own browser against
            public data. The worst case is a slow query in your own tab.
          </li>
          <li>
            <strong>Rate limits and a spend cap.</strong> Per-visitor limits on the route, and a monthly cap
            on the API account.
          </li>
        </ul>
        <p>
          The NHL’s API doesn’t allow browser requests, so Flames live runs go through a proxy that allows
          exactly two URL shapes, caches at the edge and rate-limits each visitor.
        </p>
      </>
    ),
  },
  {
    id: "design",
    title: "Design decisions",
    body: (
      <>
        <p>
          The look borrows from a working notebook. Geist for text, Geist Mono for numbers and labels,
          fixed-width digits so figures line up, one burnt-orange accent and thin rules instead of cards and
          shadows. Flames red shows up only where it encodes Flames data.
        </p>
        <p>
          Charts are hand-written SVG and canvas, not a charting library. They do exactly what this site needs
          and keep the JavaScript small. Motion is limited to hover and focus states and turns off when your
          system asks for reduced motion. Light and dark themes follow your system until you pick one.
        </p>
      </>
    ),
  },
];

export default function ColophonPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
      <p className="label">Colophon</p>
      <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        How this site is built.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        The site is part of the portfolio. Here’s what’s under it, and why. The code is{" "}
        <a href={REPO} className="link">
          on GitHub
        </a>
        .
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[12rem_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted hover:text-ink">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 max-w-2xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="border-t border-line pb-10 pt-4">
              <h2 className="label text-ink">
                <span className="text-accent">{String(i + 1).padStart(2, "0")} / </span>
                {s.title}
              </h2>
              <div className="prose-cc mt-4">{s.body}</div>
              {s.id === "tracking" && <TrackingPlanTable />}
            </section>
          ))}
          <p className="text-sm text-muted">
            Want to see it running?{" "}
            <Link href="/lab/calgary" className="link">
              Open the Lab
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function TrackingPlanTable() {
  return (
    <div className="mt-6 overflow-x-auto border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-normal">
              Event
            </th>
            <th scope="col" className="px-3 py-2 font-normal">
              Properties
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(trackingPlan).map(([name, spec]) => (
            <tr key={name} className="border-t border-line align-top">
              <td className="px-3 py-2.5">
                <code className="font-mono text-xs">{name}</code>
                <p className="mt-1 text-xs text-muted">{spec.description}</p>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs leading-relaxed">
                {Object.entries(spec.props).length === 0 ? (
                  <span className="text-muted">none</span>
                ) : (
                  Object.entries(spec.props).map(([key, rule]) => (
                    <span key={key} className="block">
                      {key}:{" "}
                      <span className="text-muted">
                        {"values" in rule && rule.values ? rule.values.join(" | ") : rule.type}
                      </span>
                    </span>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
