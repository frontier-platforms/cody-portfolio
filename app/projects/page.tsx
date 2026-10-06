import type { Metadata } from "next";
import Link from "next/link";
import { StackList } from "@/components/ui/StackList";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I build outside the day job: Signl List, Valve and the live data Lab.",
};

const projects = [
  {
    name: "Signl List",
    kicker: "iPhone app · TestFlight beta",
    body: "A day-by-day to-do list built around one question each morning: what would make today a win? You pick a few priorities, your signal, and Insights shows how much of your time actually went to them. Unfinished tasks carry forward on their own; routines repeat and never pile up.",
    points: [
      "Priorities as signal, everything else as noise, with a weekly signal vs noise view",
      "Carry-over that asks “Still important?” after three moves instead of letting a list rot",
      "Routines, recovery days and streaks that reward rest instead of punishing it",
    ],
    stack: ["Expo", "React Native", "TypeScript", "Expo Router", "EAS"],
    links: [{ href: "https://www.frontier-platforms.com/signl-list", label: "Product page" }],
  },
  {
    name: "Valve",
    kicker: "Field service SaaS · Co-founder",
    body: "Software for trades businesses to run jobs, quotes, invoices, scheduling and payments in one place, with an AI assistant and an MCP server so AI tools can work with the business’s own data.",
    points: [
      "Web app on Next.js and Supabase, crew app on React Native",
      "Stripe Connect so each business is paid directly",
      "Claude-powered assistant and an MCP server",
    ],
    stack: ["Next.js", "Supabase", "Vercel", "React Native", "Stripe Connect", "Claude API", "MCP"],
    links: [
      { href: "/work/valve", label: "Case study" },
      { href: "https://www.frontier-platforms.com/valve", label: "Product page" },
    ],
  },
  {
    name: "The Lab",
    kicker: "Live data demos · This site",
    body: "Three small data products on Calgary data: building permits, home values and Flames play-by-play. Each has a tested medallion pipeline you can run live, a dashboard, an AI that writes SQL, and telemetry on all of it. Home values add a machine-learning model you can retrain in the browser.",
    points: [
      "One pipeline definition that runs on GitHub Actions weekly and in your browser on demand",
      "dbt-style tests and a data contract that block bad refreshes",
      "Gradient-boosted value model, written from scratch, with explained estimates and a model card",
      "Query telemetry, Core Web Vitals and a typed analytics tracking plan",
    ],
    stack: [
      "DuckDB",
      "DuckDB-WASM",
      "Parquet",
      "SQL",
      "GitHub Actions",
      "Machine learning",
      "Claude API",
      "TypeScript",
    ],
    links: [
      { href: "/lab/calgary", label: "Open the Lab" },
      { href: "/colophon", label: "How it’s built" },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
      <p className="label">Projects</p>
      <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Things I build because I want them to exist.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Leading teams is the job. Building is how I keep my judgment honest about what’s hard, what’s fast,
        and what a team is actually up against.
      </p>

      <ul className="mt-12 grid gap-4 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.name} className="flex flex-col border border-line bg-surface p-6">
            <p className="label">{p.kicker}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{p.name}</h2>
            <p className="mt-3 text-[0.95rem] text-muted">{p.body}</p>
            <ul className="prose-cc mt-4 text-[0.9rem]">
              {p.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
            <StackList items={p.stack} className="mt-5" />
            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-6 text-sm">
              {p.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link key={l.href} href={l.href} className="link">
                    {l.label} →
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} className="link">
                    {l.label} ↗
                  </a>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
