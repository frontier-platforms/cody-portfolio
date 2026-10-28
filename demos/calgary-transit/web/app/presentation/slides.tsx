import Image from "next/image";
import type { ReactNode } from "react";
import dashboardShot from "@/public/images/slide-dashboard.png";
import predictShot from "@/public/images/slide-predict.png";
import { BigStat, Flow, Title, type Slide } from "./slide-kit";

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`text-[15px] font-bold uppercase tracking-wide ${dark ? "text-white/60" : "text-cgy-grey"}`}
    >
      {children}
    </p>
  );
}

function Letter({ children, big }: { children: string; big?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-cgy-red font-bold text-white ${
        big ? "h-12 w-12 text-[24px]" : "h-9 w-9 text-[18px]"
      }`}
    >
      {children}
    </span>
  );
}

/** A lettered sub-answer, matching the panel's a, b, c. */
function Sub({ letter, title, children }: { letter: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <Letter>{letter}</Letter>
      <div>
        <p className="text-[22px] font-bold leading-tight text-cgy-slate">{title}</p>
        <div className="mt-1 text-[19px] leading-snug">{children}</div>
      </div>
    </div>
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

/** The one-line takeaway at the foot of a slide. */
function Banner({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-cgy-slate px-7 py-6 text-[25px] font-semibold leading-snug text-white">
      {children}
    </p>
  );
}

/** A 24px line icon, drawn inline so the deck needs no icon library. */
function Icon({ paths }: { paths: string[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Who reads the governed layer, on the product slide. */
const CONSUMERS = [
  {
    title: "BI dashboards",
    detail: "Internal reporting",
    icon: ["M3 3v18h18", "M8 17v-4", "M13 17V7", "M18 17v-8"],
  },
  {
    title: "Client data",
    detail: "Shared with each client",
    icon: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  {
    title: "AI assistant",
    detail: "Plain-English questions",
    icon: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", "M8 9h8", "M8 13h5"],
  },
  {
    title: "ML models",
    detail: "Trained on tested data",
    icon: [
      "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      "M9 9h6v6H9z",
      "M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3",
    ],
  },
];

const QUESTIONS = [
  "What business problem was I solving?",
  "What is the data product?",
  "How did I approach it?",
  "What challenges came up?",
  "What am I most proud of?",
  "What would I improve with more time?",
];

export const SLIDES: Slide[] = [
  {
    id: "title",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <Label dark>Data product case study · StellarAlgo</Label>
        <h1 className="mt-4 max-w-[1000px] text-[68px] font-bold leading-[1.05] text-white">
          One source of truth for a multi-tenant product
        </h1>
        <p className="mt-6 max-w-[900px] text-[26px] text-white/85">
          How I made internal reporting consistent and reliable, at scale.
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
        <ol className="mt-8 grid flex-1 grid-cols-2 grid-rows-3 gap-x-8 gap-y-5">
          {QUESTIONS.map((q, i) => (
            <li key={q} className="flex items-center gap-6 rounded-lg bg-cgy-paper px-8">
              <span className="w-8 shrink-0 text-[48px] font-bold leading-none text-cgy-red">{i + 1}</span>
              <span className="text-[28px] font-semibold leading-tight text-cgy-slate">{q}</span>
            </li>
          ))}
        </ol>
      </>
    ),
    notes: [
      "Fifteen seconds. Every slide title is one of their questions.",
      "Say: 'Then five minutes live, on City of Calgary open data.'",
    ],
  },
  {
    id: "q1",
    section: "Question 1 of 6",
    minutes: 1.5,
    body: (
      <>
        <Title>What business problem was I solving?</Title>
        <div className="mt-5">
          <Banner>
            The problem to solve: no single analytical source of truth, so reporting couldn&apos;t be
            consistent or reliable at scale.
          </Banner>
        </div>
        <div className="grid flex-1 grid-cols-[0.85fr_1.15fr] items-center gap-12">
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
            <p className="mt-5 text-center text-[21px] text-cgy-red">↓ manual SQL, ad hoc analysis ↓</p>
            <p className="mt-5 text-center text-[18px] text-cgy-grey">Same question, different answers</p>
            <p className="mt-1 text-center text-[27px] font-bold text-cgy-slate">No trust in the numbers</p>
          </div>
          <div className="flex flex-col gap-7">
            <p className="text-[22px] leading-snug">
              Each client&apos;s data lived in its own database, so accurate internal reporting was hard.
              Reports were up to <b className="text-cgy-red">7 days old</b> and nobody owned the numbers.
            </p>
            <Sub letter="a" title="Why it mattered">
              Every cross-client question meant manual SQL scripts and ad hoc analysis, and teams still ended
              up with different numbers.
            </Sub>
            <Sub letter="b" title="Users and interested parties">
              <Chips items={["Customer Success", "Product", "Clients", "Analysts"]} />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "Keep it to the business pain, not the tech.",
      "My role: Director, Product Innovation & Analytics. I owned the product from planning to general availability.",
      "[Your story: one concrete moment when inconsistent numbers hurt.]",
    ],
  },
  {
    id: "q2-architecture",
    section: "Question 2 of 6",
    minutes: 1.25,
    body: (
      <>
        <Title>What is the data product?</Title>
        <div className="mt-5 flex items-center gap-4">
          <Letter>a</Letter>
          <p className="text-[26px] font-semibold leading-snug text-cgy-slate">
            One governed, tested layer for every client&apos;s data, refreshed daily.
          </p>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-10">
          <Flow
            large
            steps={[
              { label: "Sources", title: "Three systems", detail: "Every client's data" },
              { label: "Bronze", title: "Raw", detail: "Personal data masked" },
              { label: "Silver", title: "One definition", detail: "Across every client" },
              { label: "Gold", title: "Tested tables", detail: "One grain each", highlight: true },
              { label: "Semantic layer", title: "Shared metrics", detail: "For people and AI", dark: true },
            ]}
          />
          <div>
            <div className="flex items-center gap-4">
              <Letter>b</Letter>
              <span className="text-[22px] font-bold text-cgy-slate">Used by</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              {CONSUMERS.map(({ title, detail, icon }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-lg bg-cgy-slate px-5 py-4 text-white"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cgy-red">
                    <Icon paths={icon} />
                  </span>
                  <span>
                    <span className="block text-[21px] font-bold leading-tight">{title}</span>
                    <span className="mt-0.5 block text-[15px] text-white/80">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    ),
    notes: [
      "Left to right, once: three sources, transformed once, one set of shared metrics, every consumer.",
      "Governance is built in: personal data masked on landing, access by role, and a data contract.",
    ],
  },
  {
    id: "q2-semantic",
    section: "Question 2 of 6",
    minutes: 1,
    body: (
      <>
        <div className="flex items-center gap-4">
          <Letter big>b</Letter>
          <Title>How people use it: ask in plain English</Title>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <Flow
            steps={[
              {
                label: "Question",
                title: "“How did revenue trend this month?”",
                detail: "Asked in plain English",
              },
              {
                label: "Semantic layer",
                title: "Pick the right model",
                detail: "Each has one grain",
                highlight: true,
              },
              { label: "Gold", title: "Governed SQL", detail: "Within the user's role" },
              { label: "Answer", title: "Same as the dashboard", detail: "With the SQL shown", dark: true },
            ]}
          />
        </div>
        <Banner>
          Each model has one grain, so the AI can&apos;t double count. It reads the same truth as BI.
        </Banner>
      </>
    ),
    notes: [
      "The technical heart: 'An AI that guesses the grain double counts. One grain per model means it can't.'",
      "Shipped first as an internal Customer Success bot; I led discovery for the client-facing version.",
      "The example question is illustrative. [Your story: a real question the bot answered.]",
    ],
  },
  {
    id: "q2-value",
    section: "Question 2 of 6",
    minutes: 0.75,
    body: (
      <>
        <div className="flex items-center gap-4">
          <Letter big>c</Letter>
          <Title>What value it delivered</Title>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-[1fr_1fr_1fr_1.3fr] gap-4 [&>div]:h-full">
            <BigStat from="7 days" value="< 12 hrs" label="Data freshness" />
            <BigStat from="Per client" value="1 layer" label="Governed source of truth for every client" />
            <BigStat value="30 min" label="To flag a missed refresh, before a client notices" />
            <BigStat value={"Self\u2011serve"} label="Routine Customer Success questions" />
          </div>
        </div>
        <Banner>Every team now reports from one source of truth, on a schedule they can rely on.</Banner>
      </>
    ),
    notes: [
      "Ten seconds per number. The banner is the answer to question 1.",
      "[Your story: an adoption or time-saved number.]",
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
              ["Strategy", "Fix the data once, not every report."],
              ["Plan", "Bronze, silver, gold. One grain per table."],
              ["Build", "Airflow and dbt, daily instead of weekly."],
              ["Review and iterate", "Monitor, find issues, fix them once."],
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
                  <p className="mt-2 text-[17px] leading-snug">{b}</p>
                </div>
                {i < all.length - 1 && (
                  <span className="self-center px-2 text-[26px] font-bold text-cgy-red">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-14 grid grid-cols-2 gap-10">
            <Sub letter="a" title="Sourcing and preparing the data">
              Three source systems, mapped client by client into one model, then tested.
            </Sub>
            <Sub letter="b" title="Methods and tools">
              <Chips items={["Snowflake", "dbt", "Airflow", "AWS", "Semantic layer", "LLMs"]} />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "One breath across the strip. The why matters more than the stack.",
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
                ["Technical", "Every client system had its own shape.", "One model all clients map into."],
                [
                  "Analytical",
                  "The same metric meant different things to different teams.",
                  "One definition, one documented grain per table.",
                ],
                [
                  "People",
                  "Nobody owned freshness or accuracy.",
                  "A data contract I wrote: owners, targets and incident tiers.",
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
      "Spend most of the time on the People row. It's the one the City will relate to.",
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
            Dashboards, client data and the AI all read from one source of truth, so they all give the same
            answer.
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
              ["Measure from day one", "Baseline hours and escalations before launch, so value is a number."],
              ["Take it to clients", "Offer the internal AI assistant to clients, on the same layer."],
              ["Cover more of the business", "More semantic models, each with one grain."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-lg bg-cgy-paper p-6">
                <p className="text-[26px] font-bold leading-tight text-cgy-slate">{t}</p>
                <p className="mt-2 text-[20px] leading-snug">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <Banner>
          The same work at the City: find where numbers disagree, agree one definition with the owners, and
          make it self-serve.
        </Banner>
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
                "Predict: a live machine learning model",
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
        <p className="mt-4 text-[17px] text-cgy-grey">codychandler.ca/data-demos/calgary-transit</p>
      </>
    ),
    notes: [
      "LIVE (5 min). Open the site before the interview. If the internet fails, these screenshots carry it.",
      "1 · Approach page, lineage graph: 'Same layers as StellarAlgo: three City datasets, tested in dbt, run daily by Airflow.' (45 s)",
      "2 · Dashboard: read the ⓘ headline. Then the 311 chart: 'My first cut said complaints per trip were up 43%. Lost Property moved into 311 in 2021. I fixed it once, in the data, so every consumer gets it right. Like for like it's 12%.' (1.25 min)",
      "3 · Predict: Advertising and Communications (usually low), then Transit Pass Programs (usually high). 'Tested on 2025, a year it never saw, it catches more slow requests than the rule of thumb.' (1 min)",
      "4 · Ask: 'How has ridership recovered since the pandemic?' While it works: 'it writes SQL against the same gold tables.' Read the answer, glance at the chart, open 'Show how this was answered'. Payoff: 'Same number as the dashboard. One source of truth.' (1.5 min)",
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
        <p className="mt-10 text-[22px] text-white/60">Live demo</p>
        <p className="text-[24px] font-semibold text-white">codychandler.ca/data-demos/calgary-transit</p>
      </div>
    ),
    notes: ["Stop talking. Leave this up for questions."],
  },
];
