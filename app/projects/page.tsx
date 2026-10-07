import type { Metadata } from "next";
import Link from "next/link";
import { StackList } from "@/components/ui/StackList";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I build outside the day job: Signl List, Valve and the live data Lab.",
};

type Project = {
  name: string;
  kicker: string;
  body: string;
  points: string[];
  stack: string[];
  links: { href: string; label: string }[];
};

const projects: Project[] = [
  {
    name: "Signl List",
    kicker: "iPhone app · TestFlight beta",
    body: "A day-by-day to-do list built around one question each morning: what would make today a win?",
    points: [
      "Priorities are your signal. Insights shows how much time went to them.",
      "Unfinished tasks carry forward. After three moves it asks if they still matter.",
      "Recovery days and streaks reward rest instead of punishing it.",
    ],
    stack: ["Expo", "React Native", "TypeScript", "EAS"],
    links: [{ href: "https://www.frontier-platforms.com/signl-list", label: "Product page" }],
  },
  {
    name: "Valve",
    kicker: "Field service SaaS · Co-founder",
    body: "Software for trades businesses to run jobs, quotes, invoices, scheduling and payments in one place.",
    points: [
      "Web app on Next.js and Supabase, and a React Native app for crews.",
      "Stripe Connect, so each business is paid directly.",
      "A Claude-powered assistant and an MCP server for AI tools.",
    ],
    stack: ["Next.js", "Supabase", "React Native", "Stripe Connect", "Claude API", "MCP"],
    links: [
      { href: "/work/valve", label: "Case study" },
      { href: "https://www.frontier-platforms.com/valve", label: "Product page" },
    ],
  },
  {
    name: "The Lab",
    kicker: "Live data products · This site",
    body: "Three small data products on Calgary data, with tested pipelines you can run in your browser.",
    points: [
      "dbt models and tests, run weekly by an Airflow DAG on GitHub Actions.",
      "Data tests and a contract block bad refreshes.",
      "A scikit-learn value model that you can retrain in Python, in your browser.",
    ],
    stack: ["dbt", "Airflow", "DuckDB", "Python", "scikit-learn", "Claude API"],
    links: [
      { href: "/lab", label: "Open the Lab" },
      { href: "/colophon", label: "How it’s built" },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <p className="label">Projects</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">
        Things I build because I want them to exist.
      </h1>
      <p className="mt-6 max-w-measure text-lg text-text-muted">
        Leading teams is the job. Building keeps my judgment honest about what’s hard and what’s fast.
      </p>

      <ul className="mt-12 grid gap-4 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.name} className="flex flex-col rounded-md border border-border bg-surface p-6">
            <p className="meta">{p.kicker}</p>
            <h2 className="mt-3 text-2xl">{p.name}</h2>
            <p className="mt-2 text-text-muted">{p.body}</p>
            <ul className="prose-cc mt-4">
              {p.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
            <StackList items={p.stack} className="mt-6" />
            <div className="mt-auto flex flex-wrap gap-x-6 pt-6">
              {p.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link key={l.href} href={l.href} className="link inline-flex min-h-11 items-center">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} className="link inline-flex min-h-11 items-center">
                    {l.label}
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
