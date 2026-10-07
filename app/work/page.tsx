import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { StackList } from "@/components/ui/StackList";
import { ProjectGrid } from "@/components/work/ProjectCard";
import { getAllWork } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies in data platforms, attribution, BI and AI products, plus the projects I build on the side.",
};

const projects = [
  {
    name: "Signl List",
    kicker: "iPhone app · TestFlight beta",
    body: "A day-by-day to-do list built around one question each morning: what would make today a win?",
    points: [
      "Priorities are your signal. Insights shows how much time went to them.",
      "Unfinished tasks carry forward. After three moves it asks if they still matter.",
      "Recovery days and streaks reward rest instead of punishing it.",
    ],
    stack: ["Expo", "React Native", "TypeScript"],
    href: "https://www.frontier-platforms.com/signl-list",
    linkLabel: "Product page",
  },
  {
    name: "The Lab",
    kicker: "Live data products · This site",
    body: "Three small data products on Calgary data, with tested pipelines you can run in your browser.",
    points: [
      "One pipeline definition runs weekly on GitHub Actions and live in the browser.",
      "Data tests and a contract block bad refreshes.",
      "A home value model, written from scratch, that you can retrain.",
    ],
    stack: ["DuckDB", "Parquet", "SQL", "Machine learning", "Claude API"],
    href: "/lab",
    linkLabel: "Open the Lab",
  },
];

export default async function WorkIndex() {
  const work = await getAllWork();
  return (
    <>
      <header className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-20">
        <p className="label">Work</p>
        <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">What I changed, and how.</h1>
        <p className="mt-6 max-w-measure text-lg text-text-muted">
          Each case study leads with the result. The detail is underneath for anyone who wants it.
        </p>
      </header>

      <Section index="01" label="Case studies" className="mt-16">
        <ProjectGrid items={work} />
      </Section>

      <Section index="02" label="Projects" id="projects" className="mt-24">
        <ul className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <li key={p.name} className="flex flex-col rounded-md border border-border p-6">
              <p className="meta">{p.kicker}</p>
              <h3 className="mt-3 text-xl">{p.name}</h3>
              <p className="mt-2 text-text-muted">{p.body}</p>
              <ul className="prose-cc mt-4">
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
              <StackList items={p.stack} className="mt-6" />
              <p className="mt-auto pt-6">
                {p.href.startsWith("/") ? (
                  <Link href={p.href} className="link inline-flex min-h-11 items-center">
                    {p.linkLabel}
                  </Link>
                ) : (
                  <a href={p.href} className="link inline-flex min-h-11 items-center">
                    {p.linkLabel}
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
