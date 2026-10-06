import Image from "next/image";
import Link from "next/link";
import { KpiStrip } from "@/components/home/KpiStrip";
import { WorkList } from "@/components/home/WorkList";
import { Section } from "@/components/ui/Section";
import { StackList } from "@/components/ui/StackList";
import { visibleKpis } from "@/lib/kpis";
import { site } from "@/lib/site";
import { getAllWork } from "@/lib/work";

const stack = {
  Data: ["Snowflake", "Databricks", "dbt", "Microsoft Fabric", "SQL", "Python", "DuckDB", "Power BI"],
  "Growth and revenue": [
    "Attribution",
    "CAC and LTV",
    "Pricing and forecasting",
    "Salesforce",
    "HubSpot",
    "Hightouch",
  ],
  Product: ["Next.js", "TypeScript", "React Native", "Supabase", "Stripe Connect", "Vercel"],
  AI: ["Claude API", "MCP", "LLM features on governed data"],
};

export default async function Home() {
  const work = await getAllWork();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-24">
        <div className="flex items-center gap-3">
          <Image
            src="/media/cody.jpg"
            alt=""
            width={40}
            height={40}
            priority
            className="size-10 border border-line object-cover"
          />
          <p className="label">
            {site.name} · {site.location}
          </p>
        </div>
        <h1 className="mt-5 max-w-4xl text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          I connect the data stack to the revenue it’s meant to drive.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-muted sm:text-xl">
          Data, product and growth leader with 10+ years across pro sports, fintech and city government.
          Director of Product at StellarAlgo. Before that, marketing analytics at Neo Financial and business
          intelligence at Canucks Sports & Entertainment. I still build: this site, its live demos and the AI
          behind them are mine.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <KpiStrip items={visibleKpis()} />
      </div>

      <section
        aria-label="Two ways in"
        className="mx-auto mt-16 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2"
      >
        <div className="flex flex-col border border-line bg-surface p-6 sm:p-8">
          <p className="label text-accent-ink">Hiring?</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Senior data, product and strategy roles.
          </h2>
          <p className="mt-3 text-muted">
            I’ve run product, analytics and marketing operations teams, and I can still open the SQL. The case
            studies show how I work. The resume has the rest.
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <Link
              href="/work"
              className="btn btn-primary"
              data-track="cta_clicked"
              data-track-cta="case_studies"
              data-track-location="home"
            >
              Read the case studies
            </Link>
            <a
              href={site.resume}
              className="btn"
              data-track="cta_clicked"
              data-track-cta="resume"
              data-track-location="home"
            >
              Resume (PDF)
            </a>
          </div>
        </div>
        <div className="flex flex-col border border-line bg-surface p-6 sm:p-8">
          <p className="label text-accent-ink">Work with me</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Got a problem that sounds familiar?</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {work.map((w) => (
              <li key={w.slug}>
                <Link
                  href={`/work/${w.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-2.5 text-[0.95rem]"
                >
                  <span>“{w.problem}.”</span>
                  <span className="shrink-0 font-mono text-xs text-muted group-hover:text-accent-ink">
                    {w.company.split(" ")[0]} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <Link href="/about#contact" className="btn btn-primary">
              Start a conversation
            </Link>
          </div>
        </div>
      </section>

      <Section index="01" label="Selected work" className="mt-24">
        <WorkList items={work} />
      </Section>

      <Section index="02" label="Lab: live data, running in your browser" className="mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/lab/calgary",
              kicker: "City of Calgary open data",
              title: "Where Calgary is building",
              body: "235,000 building permits since 2015. Housing units, time to permit, and the communities growing fastest.",
            },
            {
              href: "/lab/flames",
              kicker: "NHL play-by-play",
              title: "Flames shot map",
              body: "Every shot attempt since 2021-22, including this season. Where the Flames shoot from, and where the goals come from.",
            },
            {
              href: "/lab/calgary#pipeline",
              kicker: "Pipeline · tests · AI",
              title: "Run the pipeline yourself",
              body: "Each dataset ships with a tested pipeline you can run live, a data contract, telemetry, and an AI that writes the SQL.",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col border border-line p-6 transition-colors hover:border-ink"
            >
              <span className="label">{card.kicker}</span>
              <span className="mt-3 text-xl font-semibold tracking-tight group-hover:text-accent-ink">
                {card.title}
              </span>
              <span className="mt-2 text-sm text-muted">{card.body}</span>
              <span className="mt-6 font-mono text-xs text-muted">Open →</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section index="03" label="What I work with" className="mt-24">
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stack).map(([group, items]) => (
            <div key={group}>
              <dt className="mb-3 text-sm font-semibold">{group}</dt>
              <dd>
                <StackList items={items} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-muted">
          Curious how this site is put together?{" "}
          <Link href="/colophon" className="link">
            Here’s the build
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
