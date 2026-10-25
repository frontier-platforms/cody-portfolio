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
        <Label dark>Data product case study</Label>
        <h1 className="mt-4 max-w-[1000px] text-[68px] font-bold leading-[1.05] text-white">
          PRIME: one governed data layer for a multi-tenant product
        </h1>
        <p className="mt-6 max-w-[900px] text-[26px] text-white/85">
          Then the same approach, live on City of Calgary transit data.
        </p>
        <p className="mt-12 text-[22px] font-semibold text-white">Cody Chandler</p>
        <p className="text-[18px] text-white/60">Data and Business Analyst interview · The City of Calgary</p>
      </div>
    ),
    notes: [
      "[Your story: one line on who you are.] Then: 'I'll answer your six questions in order, with a live demo in the middle.'",
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
          With a 5-minute live demo on City of Calgary data after question 3.
        </p>
      </>
    ),
    notes: ["Fifteen seconds. Each slide's title is one of their questions."],
  },
  {
    id: "q1",
    section: "Question 1 of 6",
    minutes: 1.5,
    body: (
      <>
        <Title>What business problem was I solving?</Title>
        <div className="mt-6 grid flex-1 grid-cols-[0.9fr_1.1fr] gap-10">
          <div className="flex flex-col justify-center rounded-lg bg-cgy-paper p-7">
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
          <div className="flex flex-col justify-center gap-7">
            <div>
              <p className="text-[22px] font-bold text-cgy-slate">The problem</p>
              <p className="mt-1 text-[19px] leading-snug">
                A multi-tenant product kept each client&apos;s data in its own database, so internal reporting
                was stale (up to 7 days old), fragmented and unowned.
              </p>
            </div>
            <Sub letter="a" title="Why it mattered">
              Teams and clients worked from different numbers, and every cross-client question needed
              engineering.
            </Sub>
            <Sub letter="b" title="Who it affected">
              <Chips items={["Customer Success", "Product", "Clients", "Analysts", "AI assistants"]} />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "[Your story: one concrete moment where inconsistent numbers hurt.]",
      "City link: departments with their own systems face the same thing.",
    ],
  },
  {
    id: "q2",
    section: "Question 2 of 6",
    minutes: 1.25,
    body: (
      <>
        <Title>What is the data product?</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="">
            <Flow
              steps={[
                {
                  label: "Sources",
                  title: "Ticketing, accounts, apps",
                  detail: "Logs, automations, segments",
                },
                { label: "Bronze", title: "Raw", detail: "Personal data masked" },
                { label: "Silver", title: "One definition", detail: "Across every client" },
                { label: "Gold", title: "Tested tables", detail: "One grain each", highlight: true },
                { label: "Consumers", title: "BI · ML · AI", detail: "Role-based access", dark: true },
              ]}
            />
          </div>
          <div className="mt-14 grid grid-cols-2 gap-10">
            <Sub letter="a" title="What it does">
              Consolidates every client into one governed, tested layer, refreshed daily, that every
              team and tool reads from.
            </Sub>
            <Sub letter="b" title="How people use it">
              <Chips
                items={["BI dashboards", "Client data sharing", "CS platform", "Plain-English questions"]}
              />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "My role: Director of Product Innovation & Analytics; I owned PRIME from planning to general availability, working with Data Engineering and Customer Success.",
      "Plain-English example: 'How did ticket revenue trend this month?' answered from the table with the right grain.",
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
            <BigStat from="7 days" value="< 12 hrs" label="Data freshness" />
            <BigStat value="100+" label="Tested models, replacing a database per client" />
            <BigStat value="30 min" label="To flag a missed refresh" />
            <BigStat value="Self-serve" label="Routine Customer Success questions" />
          </div>
        </div>
        <p className="rounded-lg bg-cgy-slate px-7 py-6 text-[25px] font-semibold leading-snug text-white">
          When the dashboard, the client export and the AI give the same number, people stop checking and
          start deciding.
        </p>
      </>
    ),
    notes: ["[Your story: any adoption or time-saved number.]"],
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
            {["Problem", "Needs", "Strategy", "Plan", "Build", "Review and iterate"].map((s, i, all) => (
              <div key={s} className="flex flex-1 items-center">
                <div
                  className={`flex-1 rounded-lg px-3 py-6 text-center text-[21px] font-bold ${
                    i === all.length - 1 ? "bg-cgy-red text-white" : "bg-cgy-paper text-cgy-slate"
                  }`}
                >
                  {s}
                </div>
                {i < all.length - 1 && <span className="px-1.5 text-[22px] font-bold text-cgy-red">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-14 grid grid-cols-2 gap-10">
            <Sub letter="a" title="Sourcing and preparing the data">
              Six source types (ticketing, accounts, app logs, automations, segments, reference files),
              mapped client by client into one model.
            </Sub>
            <Sub letter="b" title="Methods and tools">
              <Chips
                items={[
                  "Snowflake",
                  "dbt",
                  "Airflow",
                  "AWS",
                  "Medallion layers",
                  "Data contract",
                  "Semantic layer",
                  "LLMs",
                ]}
              />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "Walk the strip in one breath: started from the problem and the people, agreed what 'right' means, then built, tested and fixed what review found.",
      "[Your story: how you gathered requirements, and the real build order.]",
      "Transition: 'Here's the same approach running on the City's data.'",
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
                "Dashboard: riders back to 95% of 2019",
                "The catch: a 43% jump that wasn't real",
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
      "LIVE (5 min). If the internet fails, these screenshots carry it.",
      "1 · Dashboard: read the ⓘ headline. Point at the 2020 drop and recovery. (1 min)",
      "2 · The 311 chart: 'My first cut said complaints per trip were up 43%. Lost Property moved into 311 in 2021. I fixed it once, in the data, so every consumer gets it right. Like for like it's 12%.' (1 min)",
      "3 · Predict: pick Advertising and Communications (usually low), then Transit Pass Programs (usually high). Recent pace matters more than the type. Tested on 2025, it catches more slow requests than the rule of thumb. (1 min)",
      "4 · Ask the data: type 'How has ridership recovered since the pandemic?' and say 'it writes SQL against the same gold tables' while it works. Read the answer, glance at the chart, open 'Show how this was answered'. Payoff: 'Same 95% as the dashboard. That's the point I made about PRIME.' (1.5 min)",
      "Back to the deck: 'So that's what PRIME looks like in practice. Here's what was hard.'",
    ],
  },
  {
    id: "q4",
    section: "Question 4 of 6",
    minutes: 1.5,
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
                  "Interested parties",
                  "Nobody owned freshness or accuracy.",
                  "A data contract with named owners, targets and tiers.",
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
      "Analytical row: one line back to the demo ('Lost Property was this problem in miniature'). Don't re-explain it.",
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
            One tested layer fed dashboards, client data and an AI assistant, with no separate pipeline
            for each. The answer you just saw is that, working.
          </p>
        </div>
      </>
    ),
    notes: [
      "30 to 45 seconds. Point back at the demo; don't re-demo it.",
      "[Your story: the first time a team trusted an AI answer without checking it.]",
    ],
  },
  {
    id: "q6",
    section: "Question 6 of 6",
    minutes: 1,
    body: (
      <>
        <Title>What would I improve with more time?</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-3 gap-5">
            {[
              ["PRIME for clients", "Take the internal CS bot to clients as Stellar Insights."],
              ["On-time performance", "Add the City's real-time feeds to measure reliability by route."],
              ["Owner sign-off", "Agree targets and definitions with the people who run the service."],
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
    notes: ["Land the closing line slowly. It's the bridge to the role."],
  },
  {
    id: "close",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <h2 className="text-[64px] font-bold text-white">Thank you. Questions?</h2>
        <div className="mt-10 grid max-w-[920px] grid-cols-[140px_1fr] gap-x-8 gap-y-3 text-[22px]">
          <p className="text-white/60">Live demo</p>
          <p className="font-semibold text-white">codychandler.ca/data-demos/calgary-transit</p>
          <p className="text-white/60">Code</p>
          <p className="font-semibold text-white">github.com/frontier-platforms/cody-portfolio</p>
        </div>
      </div>
    ),
    notes: ["Stop talking. Leave this up for questions."],
  },
];
