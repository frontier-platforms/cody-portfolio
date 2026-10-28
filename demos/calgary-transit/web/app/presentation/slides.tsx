import type { ReactNode } from "react";
import { Flow, Title, type Slide } from "./slide-kit";

function Label({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`text-[15px] font-bold uppercase tracking-wide ${dark ? "text-white/60" : "text-cgy-grey"}`}
    >
      {children}
    </p>
  );
}

function Letter({ children, big, muted }: { children: string; big?: boolean; muted?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
        muted ? "bg-cgy-slate" : "bg-cgy-red"
      } ${big ? "h-12 w-12 text-[24px]" : "h-9 w-9 text-[18px]"}`}
    >
      {children}
    </span>
  );
}

/** A lettered sub-answer, matching the panel's a, b, c. */
function Sub({
  letter,
  title,
  children,
  muted,
}: {
  letter: string;
  title: string;
  children: ReactNode;
  /** A grey marker, for context that isn't one of the panel's lettered parts. */
  muted?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <Letter muted={muted}>{letter}</Letter>
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

/** How stakeholders reach the governed layer, on the Q2b slide. */
const CHANNELS = [
  {
    title: "BI dashboards",
    body: "Self-serve reporting on the tested gold tables.",
    tag: "Leadership, Product, Customer Success",
    icon: ["M3 3v18h18", "M8 17v-4", "M13 17V7", "M18 17v-8"],
  },
  {
    title: "AI assistant",
    body: "Ask in plain English. The semantic layer picks the model with the right grain.",
    tag: "“How did revenue trend this month?”",
    icon: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", "M8 9h8", "M8 13h5"],
  },
  {
    title: "In the CRM",
    body: "Customer Success and account managers see the data inside the CRM they already use.",
    tag: "Includes ML results",
    icon: ["M22 2 11 13", "M22 2 15 22l-4-9-9-4 20-7z"],
  },
];

/** The one-line answer under every question title: lettered for the panel's a, b, c, or a red bar. */
function Lead({ letter, children }: { letter?: string; children: ReactNode }) {
  return (
    <div className="mt-5 flex items-center gap-4">
      {letter ? <Letter>{letter}</Letter> : <span className="h-9 w-2 shrink-0 rounded-full bg-cgy-red" />}
      <p className="text-[26px] font-semibold leading-snug text-cgy-slate">{children}</p>
    </div>
  );
}

const Arrow = () => <span className="shrink-0 text-[30px] font-bold leading-none text-cgy-red">→</span>;

/** The value slide: each card answers a need from question 1. */
const VALUE = [
  {
    need: "Fresh",
    from: "Weekly, by hand",
    value: "4× a day",
    label: "Refreshes run automatically, on a set schedule.",
    icon: [
      "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
      "M21 3v5h-5",
      "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
      "M8 16H3v5",
    ],
  },
  {
    need: "Consistent",
    from: "Different answers",
    value: "One number",
    label: "Every report, dashboard and tool uses the same definitions.",
    icon: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
  },
  {
    need: "Observable",
    from: "Found by clients",
    value: "Monitored",
    label: "We check freshness, tests, pipeline errors and cost on every run.",
    icon: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  },
  {
    need: "Self-serve",
    from: "Engineering tickets",
    value: "Self\u2011serve",
    label: "Customer Success answers routine questions without engineering.",
    icon: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
  },
];

/** Q3b: what each tool did, so the stack reads as decisions, not a logo list. */
const STACK = [
  ["Built in", "dbt"],
  ["Stored in", "Snowflake"],
  ["Orchestrated by", "Airflow on AWS"],
  ["Versioned in", "GitHub"],
  ["Documented in", "dbt docs, Confluence"],
  ["Served through", "Semantic layer, QuickSight, Claude"],
];

/** Q3: the approach, step by step. */
const APPROACH = [
  ["Requirements", "The questions each team couldn't answer, and the numbers they disputed."],
  ["Strategy", "Fix the data in one place, not in every report."],
  ["Plan", "Medallion layers, a data contract, one grain per table."],
  ["Build", "dbt models in Snowflake, orchestrated by Airflow."],
  ["Review & iterate", "Tests and monitoring catch issues, and we fix them at the source."],
];

/** Q6: what I'd do next. */
const IMPROVE = [
  {
    title: "Measure from day one",
    body: "Track hours and escalations before launch, so I could show the impact in numbers.",
    icon: [
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
      "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
      "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    ],
  },
  {
    title: "Take it to clients",
    body: "Offer the internal AI assistant to clients, on the same layer.",
    icon: [
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
      "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
      "M22 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
  {
    title: "Cover more domains",
    body: "Add semantic models for more of the business, so the AI can answer more.",
    icon: ["m12 2 10 5-10 5L2 7l10-5z", "m2 17 10 5 10-5", "m2 12 10 5 10-5"],
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
          How I brought every client&apos;s data into one layer that reporting, AI and our CRM could trust.
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
            The problem: we had no single source of truth, so reporting and analysis couldn&apos;t stay
            consistent or reliable as we grew.
          </Banner>
        </div>
        <div className="mt-8 grid min-h-0 flex-1 grid-cols-[1fr_1.15fr] gap-14">
          <div className="flex flex-col justify-center rounded-lg bg-cgy-paper px-7 py-6">
            <Label>Before</Label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {["Client A", "Client B", "Client C"].map((c) => (
                <div
                  key={c}
                  className="rounded border-2 border-cgy-silver bg-white py-3 text-center text-[18px] font-semibold text-cgy-slate"
                >
                  {c}
                  <span className="block text-[13px] font-normal text-cgy-grey">own database</span>
                </div>
              ))}
            </div>
            <p className="py-2 text-center text-[22px] leading-none text-cgy-red">↓</p>
            <p className="mx-auto w-fit rounded-full border-2 border-cgy-red bg-white px-4 py-1.5 text-[17px] font-semibold text-cgy-red">
              Manual SQL · ad hoc analysis
            </p>
            <p className="py-2 text-center text-[22px] leading-none text-cgy-red">↓</p>
            <div className="rounded-lg border-l-[6px] border-cgy-red bg-white px-5 py-3 text-center">
              <p className="text-[16px] text-cgy-grey">Same question, different answers</p>
              <p className="text-[26px] font-bold leading-tight text-cgy-slate">No trust in the numbers</p>
            </div>
          </div>
          <div className="flex flex-col justify-between py-3">
            <Sub letter="!" title="What was happening" muted>
              Each client&apos;s data lived in its own database. Reports were up to{" "}
              <b className="text-cgy-red">7 days old</b>, and nobody owned the numbers.
            </Sub>
            <Sub letter="a" title="Why it mattered">
              Every cross-client question meant manual SQL and ad hoc analysis, and teams still ended up with
              different numbers.
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
        <Lead letter="a">
          One governed, tested layer for every client&apos;s data, refreshed four times a day.
        </Lead>
        <div className="flex flex-1 flex-col justify-center gap-8">
          <Flow
            large
            steps={[
              {
                label: "Sources",
                title: "3+ systems",
                detail: "Product analytics, customer data, client config",
              },
              { label: "Bronze", title: "Raw", detail: "Personal data masked" },
              { label: "Silver", title: "One definition", detail: "Across every client" },
              { label: "Gold", title: "Tested tables", detail: "One grain each", highlight: true },
              { label: "Semantic layer", title: "Shared metrics", detail: "For people and AI", dark: true },
            ]}
          />
          <div className="flex items-center gap-3 rounded-lg bg-cgy-paper px-6 py-4">
            <span className="mr-2 text-[15px] font-bold uppercase tracking-wide text-cgy-grey">
              Governed throughout
            </span>
            {["Role-based access", "Data contract", "Freshness monitoring", "Tested every run"].map((g) => (
              <span
                key={g}
                className="rounded-full bg-white px-4 py-1.5 text-[17px] font-semibold text-cgy-slate"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
        <Banner>The data is transformed once, and every team and tool uses the same tables.</Banner>
      </>
    ),
    notes: [
      "Left to right, once: product analytics, customer data (ticketing, acquisition) and client config, transformed once, one set of shared metrics, every consumer.",
      "Governance is built in: personal data masked on landing, access by role, and a data contract.",
    ],
  },
  {
    id: "q2-semantic",
    section: "Question 2 of 6",
    minutes: 1,
    body: (
      <>
        <Title>What is the data product?</Title>
        <Lead letter="b">How people use it.</Lead>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-3 gap-5">
            {CHANNELS.map(({ title, body, tag, icon }) => (
              <div key={title} className="flex flex-col rounded-lg border-2 border-cgy-line p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cgy-red text-white">
                  <Icon paths={icon} />
                </span>
                <p className="mt-4 text-[25px] font-bold leading-tight text-cgy-slate">{title}</p>
                <p className="mt-2 flex-1 text-[19px] leading-snug">{body}</p>
                <p className="mt-4 rounded bg-cgy-paper px-3 py-2 text-[15px] font-semibold text-cgy-slate">
                  {tag}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Banner>All three read the same tables, so the numbers match.</Banner>
      </>
    ),
    notes: [
      "Three ways in, one source of truth. Most people never open a new tool: the data comes to the CRM.",
      "The technical point on AI: 'An AI that guesses the grain double counts. One grain per model means it can't.'",
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
        <Title>What is the data product?</Title>
        <Lead letter="c">The value it delivered.</Lead>
        <div className="my-auto grid grid-cols-4 gap-5">
          {VALUE.map(({ need, value, from, label, icon }) => (
            <div key={need} className="flex flex-col rounded-lg bg-cgy-paper p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cgy-red text-white">
                  <Icon paths={icon} />
                </span>
                <span className="text-[16px] font-bold uppercase tracking-wide text-cgy-grey">{need}</span>
              </div>
              <div className="mt-8">
                {from && (
                  <p className="text-[17px] font-semibold text-cgy-grey line-through decoration-cgy-red decoration-2">
                    {from}
                  </p>
                )}
                <p className="whitespace-nowrap text-[36px] font-bold leading-tight text-cgy-red">{value}</p>
                <p className="mt-2 text-[18px] leading-snug text-cgy-slate">{label}</p>
              </div>
            </div>
          ))}
        </div>
        <Banner>Teams now work from the same numbers, and they trust them.</Banner>
      </>
    ),
    notes: [
      "Ten seconds per card. The banner is the answer to question 1.",
      "Observable: freshness checked against each domain's target, dbt tests on every run, AI-written digests of pipeline errors, and cost tracked per model.",
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
        <Lead>I started with what people needed, then fixed the data at the source.</Lead>
        <div className="mt-8 grid grid-cols-5 gap-3">
          {APPROACH.map(([t, b], i) => (
            <div
              key={t}
              className={`rounded-lg p-4 ${i === APPROACH.length - 1 ? "bg-cgy-red text-white" : "bg-cgy-paper"}`}
            >
              <p className="flex items-baseline gap-2">
                <span className={`text-[22px] font-bold ${i === APPROACH.length - 1 ? "" : "text-cgy-red"}`}>
                  {i + 1}
                </span>
                <span
                  className={`text-[20px] font-bold leading-tight ${i === APPROACH.length - 1 ? "" : "text-cgy-slate"}`}
                >
                  {t}
                </span>
              </p>
              <p className="mt-2 text-[16px] leading-snug">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid min-h-0 flex-1 grid-cols-[1fr_1.25fr] gap-6">
          <div className="flex flex-col rounded-lg border-2 border-cgy-line p-5">
            <div className="flex items-center gap-3">
              <Letter>a</Letter>
              <p className="text-[22px] font-bold text-cgy-slate">Sourcing and preparing the data</p>
            </div>
            <p className="mt-3 text-[17px] leading-snug">
              Product analytics, customer data and client config.
            </p>
            <div className="my-auto grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-2 pt-4">
              {[
                ["Land", "Raw, personal data masked"],
                ["Map", "Client by client, into one model"],
                ["Test", "On every run, before use"],
              ].flatMap(([t, d], i) => [
                ...(i > 0
                  ? [
                      <span key={`arrow-${t}`} className="self-center text-[20px] font-bold text-cgy-red">
                        →
                      </span>,
                    ]
                  : []),
                <div key={t} className="rounded-lg bg-cgy-paper px-3 py-3 text-center">
                  <p className="text-[17px] font-bold text-cgy-slate">{t}</p>
                  <p className="mt-0.5 text-[14px] leading-snug">{d}</p>
                </div>,
              ])}
            </div>
          </div>
          <div className="flex flex-col rounded-lg border-2 border-cgy-line p-5">
            <div className="flex items-center gap-3">
              <Letter>b</Letter>
              <p className="text-[22px] font-bold text-cgy-slate">Methods and tools</p>
            </div>
            <div className="my-auto grid grid-cols-3 gap-2 pt-4">
              {STACK.map(([verb, tool]) => (
                <div key={verb} className="rounded-lg bg-cgy-paper px-3 py-2.5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-cgy-grey">{verb}</p>
                  <p className="text-[16px] font-bold leading-tight text-cgy-slate">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    ),
    notes: [
      "One breath across the strip. The why matters more than the stack.",
      "On b, say it plainly: 'Modelled in dbt, stored in Snowflake, orchestrated in Airflow, every change versioned in GitHub and documented in dbt docs and Confluence.'",
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
        <Lead>What got in the way, and what I did about it.</Lead>
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
        <Banner>Each fix went into the shared layer, so every report picked it up.</Banner>
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
        <Lead>The AI gives the same answer as the dashboards.</Lead>
        <div className="flex flex-1 items-center gap-4">
          <div className="w-[250px] shrink-0 rounded-lg bg-cgy-paper p-5">
            <Label>Question</Label>
            <p className="mt-2 text-[22px] font-semibold leading-snug text-cgy-slate">
              &ldquo;How did ticket revenue trend this month?&rdquo;
            </p>
          </div>
          <Arrow />
          <div className="flex-1 rounded-lg border-2 border-cgy-slate p-5">
            <Label>Semantic layer: route to the right grain</Label>
            <div className="mt-3 space-y-2.5">
              {[
                ["Property by day", "One row per property, per day", true],
                ["Campaign", "One row per campaign", false],
                ["Other models", "Each with one documented grain", false],
              ].map(([m, g, on]) => (
                <div
                  key={m as string}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                    on ? "bg-cgy-red text-white" : "bg-cgy-paper text-cgy-slate"
                  }`}
                >
                  <span className="text-[20px] font-bold">{m}</span>
                  <span className={`text-[16px] ${on ? "text-white/90" : "text-cgy-grey"}`}>
                    {g}
                    {on && " ✓"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Arrow />
          <div className="w-[230px] shrink-0 rounded-lg bg-cgy-slate p-5 text-white">
            <Label dark>Answer</Label>
            <p className="mt-2 text-[22px] font-bold leading-snug">Same number as the dashboard</p>
            <p className="mt-2 text-[16px] text-white/80">SQL shown, within the user&apos;s role</p>
          </div>
        </div>
        <Banner>The governance work is what made self-serve possible.</Banner>
      </>
    ),
    notes: [
      "Trace the route once: 'An AI that guesses the grain double counts. The semantic layer sends each question to the model with the right grain, so it matches BI.'",
      "Then land the banner slowly. It's the line to remember.",
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
        <Lead>What I&apos;d do next.</Lead>
        <div className="my-auto grid grid-cols-3 gap-5">
          {IMPROVE.map(({ title, body, icon }) => (
            <div key={title} className="rounded-lg bg-cgy-paper p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cgy-red text-white">
                <Icon paths={icon} />
              </span>
              <p className="mt-6 text-[26px] font-bold leading-tight text-cgy-slate">{title}</p>
              <p className="mt-2 text-[19px] leading-snug">{body}</p>
            </div>
          ))}
        </div>
        <Banner>
          At the City I&apos;d do the same: find where the numbers disagree, agree on definitions with the
          owners, and make the data easy to use.
        </Banner>
      </>
    ),
    notes: ["[Your story: swap in whatever you'd genuinely do differently.]"],
  },
  {
    id: "close",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <h2 className="text-[64px] font-bold text-white">Thank you.</h2>
        <p className="mt-6 max-w-[950px] text-[30px] leading-snug text-white/85">
          I can&apos;t show you StellarAlgo&apos;s data, so I rebuilt the same approach on City of Calgary
          open data. Let&apos;s look at it live.
        </p>
        <p className="mt-12 text-[20px] font-semibold uppercase tracking-wide text-white/60">Live demo</p>
        <p className="mt-1 text-[26px] font-semibold text-white">
          codychandler.ca/data-demos/calgary-transit
        </p>
      </div>
    ),
    notes: [
      "Read the line on the slide, then switch to the browser.",
      "LIVE DEMO (5 min). Have codychandler.ca/data-demos/calgary-transit open in a tab. Backup if the internet fails: the local copy (npm run dev).",
      "1 · Approach page, lineage graph: 'Same layers as StellarAlgo: three City datasets, tested in dbt, run daily by Airflow.' (45 s)",
      "2 · Dashboard: read the ⓘ headline. Then the 311 chart: 'My first cut said complaints per trip were up 43%. Lost Property moved into 311 in 2021. I fixed it once, in the data, so every consumer gets it right. Like for like it's 12%.' (1.25 min)",
      "3 · Predict: Advertising and Communications (usually low), then Transit Pass Programs (usually high). 'Tested on 2025, a year it never saw, it catches more slow requests than the rule of thumb.' (1 min)",
      "4 · Ask: 'How has ridership recovered since the pandemic?' While it works: 'it writes SQL against the same gold tables.' Read the answer, glance at the chart, open 'Show how this was answered'. Payoff: 'Same number as the dashboard. One source of truth.' (1.5 min)",
      "Close: 'That's the work I'd bring to the City.' Then: 'Happy to take questions.'",
    ],
  },
];
