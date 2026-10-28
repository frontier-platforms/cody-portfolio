import Image from "next/image";
import type { ReactNode } from "react";
import dashboardShot from "@/public/images/slide-dashboard.png";
import predictShot from "@/public/images/slide-predict.png";
import { BigStat, Title, type Slide } from "./slide-kit";

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`text-[15px] font-bold uppercase tracking-wide ${dark ? "text-white/60" : "text-cgy-grey"}`}
    >
      {children}
    </p>
  );
}

/** A lettered sub-answer, matching the panel's a, b, c. */
function Sub({ letter, title, children }: { letter: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cgy-red text-[18px] font-bold text-white">
        {letter}
      </span>
      <div>
        <p className="text-[22px] font-bold leading-tight text-cgy-slate">{title}</p>
        <div className="mt-1 text-[19px] leading-snug">{children}</div>
      </div>
    </div>
  );
}

/** Just the lettered circle, for marking part of a diagram. */
function Letter({ children }: { children: string }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cgy-red text-[15px] font-bold text-white">
      {children}
    </span>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((c) => (
        <span
          key={c}
          className="rounded-full bg-cgy-paper px-3 py-1.5 text-[17px] font-semibold text-cgy-slate"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

const Arrow = ({ down }: { down?: boolean }) => (
  <span className="self-center px-2 text-[26px] font-bold leading-none text-cgy-red">{down ? "↓" : "→"}</span>
);

const QUESTIONS = [
  "What business problem was I solving?",
  "What is the data product?",
  "How did I approach it?",
  "What challenges came up?",
  "What am I most proud of?",
  "What would I improve with more time?",
];

/** Set in Q1 and checked off in Q2c, so the value answers the need. */
const NEEDS = ["Trusted", "Fresh", "Owned", "Safe", "Self-serve"];

export const SLIDES: Slide[] = [
  {
    id: "title",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <Label dark>Data product case study · StellarAlgo</Label>
        <h1 className="mt-4 max-w-[1000px] text-[68px] font-bold leading-[1.05] text-white">
          PRIME: one governed data layer for a multi-tenant product
        </h1>
        <p className="mt-6 max-w-[900px] text-[26px] text-white/85">
          From week-old, disputed numbers to one layer every team, dashboard and AI reads from.
        </p>
        <p className="mt-12 text-[22px] font-semibold text-white">Cody Chandler</p>
        <p className="text-[18px] text-white/60">Data and Business Analyst interview · The City of Calgary</p>
      </div>
    ),
    notes: [
      "[Your story: one line on who you are.] Then: 'I'll answer your six questions in order, then show it live.'",
    ],
  },
  {
    id: "agenda",
    section: "Your six questions",
    minutes: 0.25,
    body: (
      <>
        <Title>I&apos;ll answer them in order</Title>
        <ol className="mt-8 grid flex-1 grid-cols-2 content-center gap-x-10 gap-y-5">
          {QUESTIONS.map((q, i) => (
            <li key={q} className="flex items-center gap-5 rounded-lg bg-cgy-paper px-6 py-5">
              <span className="text-[40px] font-bold leading-none text-cgy-red">{i + 1}</span>
              <span className="text-[25px] font-semibold leading-tight text-cgy-slate">{q}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[20px] text-cgy-grey">
          Then five minutes live: the same approach, rebuilt on City of Calgary open data.
        </p>
      </>
    ),
    notes: ["Fifteen seconds. Every slide title is one of their questions."],
  },
  {
    id: "q1",
    section: "Question 1 of 6",
    minutes: 1.5,
    body: (
      <>
        <Title>What business problem was I solving?</Title>
        <div className="mt-5 grid flex-1 grid-cols-[0.85fr_1.15fr] items-center gap-10">
          <div className="rounded-lg bg-cgy-paper px-7 py-10">
            <div className="grid grid-cols-3 gap-3">
              {["Client A", "Client B", "Client C"].map((c) => (
                <div
                  key={c}
                  className="rounded border-2 border-cgy-silver bg-white py-4 text-center text-[18px] font-semibold text-cgy-slate"
                >
                  {c}
                  <span className="block text-[13px] font-normal text-cgy-grey">own database</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-[21px] text-cgy-red">↓ manual weekly refresh ↓</p>
            <p className="mt-5 text-center text-[25px] font-bold text-cgy-slate">
              Same question, different answers
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-[21px] leading-snug">
              Our multi-tenant product kept each client&apos;s data in its own database. Internal reporting
              was up to <b className="text-cgy-red">7 days old</b>, a cross-client question meant visiting
              every system, and nobody owned the numbers.
            </p>
            <Sub letter="a" title="Why it mattered">
              Teams and clients worked from different numbers, and every cross-client question needed
              engineering.
            </Sub>
            <Sub letter="b" title="Users and interested parties">
              <Chips items={["Customer Success", "Product", "Clients", "Analysts", "Data Engineering"]} />
            </Sub>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4 rounded-lg border-2 border-cgy-line px-6 py-4">
          <span className="text-[17px] font-bold uppercase tracking-wide text-cgy-grey">
            They needed data that was
          </span>
          {NEEDS.map((n) => (
            <span key={n} className="text-[22px] font-bold text-cgy-red">
              {n}
            </span>
          ))}
        </div>
      </>
    ),
    notes: [
      "Situation, then what people needed. Keep it to the business pain, not the tech.",
      "My role: Director, Product Innovation & Analytics. I owned PRIME's product management from planning to general availability.",
      "[Your story: one concrete moment when inconsistent numbers hurt, and how you gathered what people needed.]",
      "Say: 'Hold on to those five words. They're how I'll measure the result.'",
    ],
  },
  {
    id: "q2-architecture",
    section: "Question 2 of 6",
    minutes: 1.5,
    body: (
      <>
        <Title>What is the data product?</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-stretch">
            <div className="flex w-[150px] shrink-0 flex-col justify-center gap-2">
              <Label>Sources</Label>
              {["Ticketing", "Accounts", "Apps"].map((s) => (
                <div
                  key={s}
                  className="rounded border-2 border-cgy-line bg-cgy-paper px-3 py-2 text-[17px] font-semibold text-cgy-slate"
                >
                  {s}
                </div>
              ))}
            </div>
            <Arrow />
            <div className="flex-1 rounded-lg border-2 border-cgy-slate p-4">
              <p className="text-[17px] font-bold text-cgy-slate">
                Snowflake{" "}
                <span className="font-semibold text-cgy-grey">
                  · modelled in dbt · run by Airflow on AWS
                </span>
              </p>
              <div className="mt-3 flex">
                {[
                  ["Bronze", "Raw, as landed", "Personal data masked"],
                  ["Silver", "One definition", "Across every client"],
                  ["Gold", "100+ tested models", "One grain each"],
                ].map(([l, t, d], i) => (
                  <div key={l} className="flex flex-1">
                    <div
                      className={`flex-1 rounded-lg p-3 ${i === 2 ? "border-2 border-cgy-red bg-white" : "bg-cgy-paper"}`}
                    >
                      <p
                        className={`text-[13px] font-bold uppercase tracking-wide ${i === 2 ? "text-cgy-red" : "text-cgy-grey"}`}
                      >
                        {l}
                      </p>
                      <p className="mt-1 text-[18px] font-bold leading-tight text-cgy-slate">{t}</p>
                      <p className="mt-1 text-[14px] leading-snug">{d}</p>
                    </div>
                    {i < 2 && <Arrow />}
                  </div>
                ))}
              </div>
            </div>
            <Arrow />
            <div className="flex w-[150px] shrink-0 flex-col justify-center rounded-lg bg-cgy-red p-4 text-white">
              <p className="text-[13px] font-bold uppercase tracking-wide text-white/80">Semantic layer</p>
              <p className="mt-1 text-[18px] font-bold leading-tight">Shared metrics</p>
              <p className="mt-1 text-[14px] leading-snug text-white/90">Defined once, for people and AI</p>
            </div>
            <Arrow />
            <div className="flex w-[190px] shrink-0 flex-col justify-center gap-2">
              <p className="flex items-center gap-2">
                <Letter>b</Letter>
                <Label>Used by</Label>
              </p>
              {["BI dashboards", "Client data sharing", "Customer Success bot", "ML models"].map((s) => (
                <div key={s} className="rounded bg-cgy-slate px-3 py-2 text-[16px] font-semibold text-white">
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-cgy-paper px-4 py-3">
            <span className="mr-2 text-[14px] font-bold uppercase tracking-wide text-cgy-grey">
              Governed throughout
            </span>
            {[
              "Role-based access",
              "Data contract",
              "Freshness checked every 30 min",
              "Hourly AI error digests",
              "Cost per model",
            ].map((g) => (
              <span
                key={g}
                className="rounded-full bg-white px-3 py-1 text-[15px] font-semibold text-cgy-slate"
              >
                {g}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <Sub letter="a" title="What it does">
              Consolidates every client&apos;s data into one governed, tested layer, refreshed daily, that any
              approved team or tool can use.
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "Walk it left to right once: three sources, transformed once, one semantic layer, every consumer.",
      "Then the band: 'Governance isn't a separate project. It's built into every layer.'",
      "Check the source names match what you'd say. Three source systems feed it.",
    ],
  },
  {
    id: "q2-semantic",
    section: "Question 2 of 6",
    minutes: 1,
    body: (
      <>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cgy-red text-[24px] font-bold text-white">
            b
          </span>
          <Title>How people use it: ask in plain English</Title>
        </div>
        <div className="mt-6 grid flex-1 grid-cols-[1.15fr_1fr] items-center gap-10">
          <div>
            <Label>Semantic layer: one grain per model</Label>
            <div className="mt-3 space-y-3">
              {[
                ["Property by day", "One row per property, per day", "e.g. ticket revenue, attendance", true],
                ["Campaign", "One row per campaign", "e.g. sends, conversions", false],
                [
                  "More models",
                  "Each with one documented grain",
                  "Same definitions as the dashboards",
                  false,
                ],
              ].map(([m, g, e, on]) => (
                <div
                  key={m as string}
                  className={`rounded-lg border-2 px-5 py-3 ${on ? "border-cgy-red bg-white" : "border-cgy-line bg-cgy-paper"}`}
                >
                  <p className={`text-[21px] font-bold ${on ? "text-cgy-red" : "text-cgy-slate"}`}>{m}</p>
                  <p className="text-[17px] text-cgy-slate">{g}</p>
                  <p className="text-[15px] text-cgy-grey">{e}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-stretch">
            {[
              ["Question", "“How did ticket revenue trend this month?”", "bg-cgy-paper text-cgy-slate"],
              ["Route", "Pick the model whose grain fits", "bg-white border-2 border-cgy-red text-cgy-slate"],
              ["Query", "Governed SQL on gold, within the user's role", "bg-cgy-paper text-cgy-slate"],
              ["Answer", "Matches the dashboard, with the SQL shown", "bg-cgy-slate text-white"],
            ].map(([l, t, c], i) => (
              <div key={l} className="flex flex-col">
                {i > 0 && <Arrow down />}
                <div className={`rounded-lg px-5 py-3 ${c}`}>
                  <p className="text-[13px] font-bold uppercase tracking-wide opacity-70">{l}</p>
                  <p className="text-[19px] font-semibold leading-snug">{t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[18px] text-cgy-grey">
          Shipped first as an internal Customer Success bot. I led discovery for Stellar Insights, the
          client-facing version.
        </p>
      </>
    ),
    notes: [
      "This is the technical heart. 'An AI that guesses the grain double counts. Each semantic model has one grain, so it can't.'",
      "The example question and measures are illustrative. [Your story: a real question the CS bot answered.]",
    ],
  },
  {
    id: "q2-value",
    section: "Question 2 of 6",
    minutes: 0.75,
    body: (
      <>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cgy-red text-[24px] font-bold text-white">
            c
          </span>
          <Title>What value it delivered</Title>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["Fresh", <BigStat key="f" from="7 days" value="< 12 hrs" label="Data freshness" />],
              [
                "Trusted",
                <BigStat key="t" value="100+" label="Tested models, replacing a database per client" />,
              ],
              [
                "Owned",
                <BigStat key="o" value="30 min" label="To flag a missed refresh, before a client notices" />,
              ],
              [
                "Self-serve",
                <BigStat key="s" value="No ticket" label="For routine Customer Success questions" />,
              ],
            ].map(([need, stat]) => (
              <div key={need as string} className="flex flex-col">
                <p className="mb-2 text-[16px] font-bold uppercase tracking-wide text-cgy-red">✓ {need}</p>
                <div className="flex-1 [&>div]:h-full">{stat}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[19px]">
            <span className="font-bold uppercase tracking-wide text-cgy-red">✓ Safe</span>
            <span className="ml-3">
              Personal data masked on landing; every person and tool sees only what their role allows.
            </span>
          </p>
        </div>
        <p className="rounded-lg bg-cgy-slate px-7 py-6 text-[25px] font-semibold leading-snug text-white">
          Customer Success, Product and clients now work from the same numbers, on a schedule they can rely
          on.
        </p>
      </>
    ),
    notes: [
      "Check off the five needs from question 1. Don't read every label.",
      "[Your story: an adoption or time-saved number. A real number beats 'no ticket'.]",
    ],
  },
  {
    id: "q3",
    section: "Question 3 of 6",
    minutes: 1.25,
    body: (
      <>
        <Title>How did I approach it?</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-stretch">
            {[
              ["Requirements", "What each team needed to trust a number."],
              ["Strategy", "Fix the data once, not every report. Contract before charts."],
              ["Plan", "Bronze, silver, gold. One grain per gold table."],
              ["Build", "Airflow and dbt replaced the manual weekly refresh."],
              ["Review and iterate", "Monitoring finds issues; fix them in the layer, once."],
            ].map(([t, b], i, all) => (
              <div key={t} className="flex flex-1 items-stretch">
                <div
                  className={`flex-1 rounded-lg p-4 ${i === all.length - 1 ? "bg-cgy-red text-white" : "bg-cgy-paper"}`}
                >
                  <p
                    className={`text-[20px] font-bold leading-tight ${i === all.length - 1 ? "" : "text-cgy-slate"}`}
                  >
                    {t}
                  </p>
                  <p className="mt-2 text-[16px] leading-snug">{b}</p>
                </div>
                {i < all.length - 1 && <Arrow />}
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-10">
            <Sub letter="a" title="Sourcing and preparing the data">
              Three source systems, landed raw with personal data masked, then mapped client by client into
              one dimensional model and tested.
            </Sub>
            <Sub letter="b" title="Methods and tools">
              <Chips
                items={[
                  "Snowflake",
                  "dbt",
                  "Airflow",
                  "AWS",
                  "Medallion layers",
                  "Semantic layer",
                  "Data contract",
                  "LLMs",
                ]}
              />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "One breath across the strip. The panel cares more about the why than the stack.",
      "[Your story: how you ran requirements, and the real build order.]",
    ],
  },
  {
    id: "q4",
    section: "Question 4 of 6",
    minutes: 1.25,
    body: (
      <>
        <Title>What challenges came up, and how did I handle them?</Title>
        <div className="flex flex-1 flex-col justify-center">
          <table className="w-full text-left text-[22px]">
            <thead>
              <tr className="border-b-2 border-cgy-slate text-cgy-slate">
                <th className="w-[18%] py-3 pr-4">Type</th>
                <th className="w-[38%] py-3 pr-4">Challenge</th>
                <th className="py-3">How I solved it</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Technical",
                  "Every client system had its own shape.",
                  "One dimensional model all clients map into.",
                ],
                [
                  "Analytical",
                  "The same metric meant different things to different teams.",
                  "One definition in silver, one documented grain per gold table.",
                ],
                [
                  "People",
                  "Nobody owned freshness or accuracy.",
                  "A data contract I wrote: owners, targets per domain, three incident tiers.",
                ],
              ].map(([t, c, s]) => (
                <tr key={t} className="border-b border-cgy-line align-top">
                  <td className="py-6 pr-4 font-bold text-cgy-red">{t}</td>
                  <td className="py-6 pr-4 text-cgy-slate">{c}</td>
                  <td className="py-6">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
    notes: [
      "Spend most of the time on the People row. It's the one an analyst at the City will relate to.",
      "[Your story: the conversation that got the data contract agreed. Who pushed back, and what changed their mind?]",
    ],
  },
  {
    id: "q5",
    section: "Question 5 of 6",
    minutes: 0.75,
    body: (
      <>
        <Title>What am I most proud of?</Title>
        <div className="my-auto border-l-8 border-cgy-red py-2 pl-10">
          <p className="max-w-[1000px] text-[44px] font-bold leading-tight text-cgy-slate">
            Governance stopped being overhead and became the reason people could self-serve.
          </p>
          <p className="mt-8 max-w-[900px] text-[24px] leading-snug">
            One tested layer feeds dashboards, client data and the AI, with no separate pipeline for each.
            That&apos;s why the AI&apos;s answers match the dashboards.
          </p>
        </div>
      </>
    ),
    notes: [
      "Slow down. This is the line to remember.",
      "[Your story: the first time a team trusted an answer without double-checking it.]",
    ],
  },
  {
    id: "q6",
    section: "Question 6 of 6",
    minutes: 0.75,
    body: (
      <>
        <Title>What would I improve with more time?</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-3 gap-5">
            {[
              [
                "Measure from day one",
                "Baseline escalations and Customer Success hours before launch, so the value is a number.",
              ],
              [
                "Insights for clients",
                "Take the internal bot to clients as Stellar Insights, on the same layer.",
              ],
              ["More semantic models", "Cover more domains, each with one grain, so the AI can answer more."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-lg bg-cgy-paper p-6">
                <p className="text-[26px] font-bold leading-tight text-cgy-slate">{t}</p>
                <p className="mt-2 text-[20px] leading-snug">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="rounded-lg bg-cgy-slate px-7 py-6 text-[25px] font-semibold leading-snug text-white">
          The same work at the City: find where numbers disagree, agree one definition with the owners, and
          make it self-serve.
        </p>
      </>
    ),
    notes: [
      "[Your story: swap in whatever you'd genuinely do differently.]",
      "Transition: 'I can't show you StellarAlgo's data, so I rebuilt the same approach on the City's open data.'",
    ],
  },
  {
    id: "demo",
    section: "Live demo",
    minutes: 5,
    body: (
      <>
        <Title>The same approach, live on City of Calgary data</Title>
        <div className="mt-5 grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-6">
          <div className="relative overflow-hidden rounded-lg border border-cgy-line">
            <Image
              src={dashboardShot}
              alt="The Calgary Transit dashboard: trips, service hours and rider feedback, with two charts"
              className="h-full w-full bg-white object-contain object-top"
              sizes="700px"
            />
          </div>
          <div className="flex min-h-0 flex-col gap-4">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-cgy-line">
              <Image
                src={predictShot}
                alt="The live 311 prediction with what moved it"
                className="h-full w-full bg-white object-contain object-top"
                sizes="540px"
              />
            </div>
            <ol className="space-y-1.5 text-[19px]">
              {[
                "Approach: the pipeline and its lineage",
                "Dashboard: a 43% jump that wasn't real",
                "Predict: a live XGBoost model",
                "Ask the data: plain English, with its working",
              ].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="font-bold text-cgy-red">{i + 1}</span>
                  <span className="text-cgy-slate">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-4 text-[17px] text-cgy-grey">
          Airflow · dbt · DuckDB · 27 tests · XGBoost · AI agent · codychandler.ca/data-demos/calgary-transit
        </p>
      </>
    ),
    notes: [
      "LIVE (5 min). Open the site before the interview. If the internet fails, these screenshots carry it.",
      "1 · Approach page, lineage graph: 'Same medallion layers as PRIME: three City datasets, tested in dbt, run daily by Airflow.' (45 s)",
      "2 · Dashboard: read the ⓘ headline. Then the 311 chart: 'My first cut said complaints per trip were up 43%. Lost Property moved into 311 in 2021. I fixed it once, in the data, so every consumer gets it right. Like for like it's 12%.' (1.25 min)",
      "3 · Predict: Advertising and Communications (usually low), then Transit Pass Programs (usually high). 'Tested on 2025, a year it never saw, it catches more slow requests than the rule of thumb.' (1 min)",
      "4 · Ask: 'How has ridership recovered since the pandemic?' While it works: 'it writes SQL against the same gold tables.' Read the answer, glance at the chart, open 'Show how this was answered'. Payoff: 'Same number as the dashboard. That's PRIME's point.' (1.5 min)",
      "Close: 'That's the work I'd bring to the City.' Then the last slide.",
    ],
  },
  {
    id: "close",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <h2 className="text-[64px] font-bold text-white">Thank you. Questions?</h2>
        <div className="mt-10 grid max-w-[920px] grid-cols-[140px_1fr] gap-x-8 gap-y-3 text-[22px]">
          <p className="text-white/60">Case study</p>
          <p className="font-semibold text-white">codychandler.ca/work/stellaralgo-prime</p>
          <p className="text-white/60">Live demo</p>
          <p className="font-semibold text-white">codychandler.ca/data-demos/calgary-transit</p>
        </div>
      </div>
    ),
    notes: ["Stop talking. Leave this up for questions."],
  },
];
