import type { ReactNode } from "react";
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

const STAR = [
  ["S", "Situation", ["Q1 · The problem and why it mattered"]],
  ["T", "Task", ["Q1 · Who needed it, and what I owned"]],
  ["A", "Action", ["Q2 · The product", "Q3 · The approach", "Q4 · The challenges"]],
  ["R", "Result", ["Q2 · The value", "Q5 · What I'm proud of", "Q6 · What I'd improve"]],
] as const;

/** The requirements set in Task; Result answers each one. */
const NEEDS = [
  ["Trusted", "One definition per metric, across every client."],
  ["Fresh", "Daily, not weekly."],
  ["Owned", "Named owners, targets and incident tiers."],
  ["Safe", "Personal data masked, access by role."],
  ["Self-serve", "Routine questions without an engineering ticket."],
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
      "[Your story: one line on who you are.]",
      "Then: 'I'll tell this as a STAR story. Each part answers your questions in order.'",
    ],
  },
  {
    id: "map",
    section: "The plan for the next 15 minutes",
    minutes: 0.5,
    body: (
      <>
        <Title>One story, your six questions</Title>
        <div className="mt-8 grid flex-1 grid-cols-4 content-center gap-5">
          {STAR.map(([letter, name, qs]) => (
            <div key={letter} className="flex flex-col rounded-lg bg-cgy-paper p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-cgy-red text-[32px] font-bold text-white">
                {letter}
              </span>
              <p className="mt-4 text-[28px] font-bold text-cgy-slate">{name}</p>
              <ul className="mt-3 space-y-2 text-[18px] leading-snug">
                {qs.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[20px] text-cgy-grey">
          The letters in each slide&apos;s corner show where we are.
        </p>
      </>
    ),
    notes: ["Thirty seconds. Don't read the boxes; just point at the letters."],
  },
  {
    id: "situation",
    star: "S",
    section: "Situation",
    answers: "Q1a",
    minutes: 1.5,
    body: (
      <>
        <Title>Every client lived in its own database</Title>
        <div className="mt-6 grid flex-1 grid-cols-[0.9fr_1.1fr] items-center gap-10">
          <div className="flex flex-col justify-center rounded-lg bg-cgy-paper px-7 py-12">
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
          <div className="flex flex-col justify-center gap-6">
            {[
              ["Up to 7 days old", "A key refresh ran weekly, by hand."],
              ["One system per client", "A question across clients meant visiting each one in turn."],
              ["No clear owner", "Ownership was split across teams, with no agreed service levels."],
            ].map(([t, b]) => (
              <div key={t} className="border-l-4 border-cgy-red pl-5">
                <p className="text-[24px] font-bold text-cgy-slate">{t}</p>
                <p className="text-[19px] leading-snug">{b}</p>
              </div>
            ))}
            <Sub letter="a" title="Why it mattered">
              Teams and clients worked from different numbers, and internal reporting couldn&apos;t be
              trusted.
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "The multi-tenant design was right for the product, but it made internal reporting hard.",
      "[Your story: one concrete moment when inconsistent numbers hurt: a client call, a leadership report.]",
    ],
  },
  {
    id: "task",
    star: "T",
    section: "Task",
    answers: "Q1b",
    minutes: 1.5,
    body: (
      <>
        <Title>One set of numbers everyone could trust</Title>
        <div className="mt-6 grid flex-1 grid-cols-[1fr_1.1fr] gap-10">
          <div className="flex flex-col justify-center gap-8">
            <div className="rounded-lg bg-cgy-slate p-6 text-white">
              <p className="text-[15px] font-bold uppercase tracking-wide text-white/60">My role</p>
              <p className="mt-2 text-[21px] leading-snug">
                Director, Product Innovation &amp; Analytics. I owned PRIME&apos;s product management from
                planning to general availability.
              </p>
            </div>
            <Sub letter="b" title="Who needed it">
              <Chips items={["Customer Success", "Product", "Clients", "Analysts", "Data Engineering"]} />
            </Sub>
          </div>
          <div className="flex flex-col justify-center">
            <Label>What success had to mean</Label>
            <ul className="mt-3 divide-y divide-cgy-line">
              {NEEDS.map(([t, b]) => (
                <li key={t} className="flex items-baseline gap-4 py-3">
                  <span className="w-[130px] shrink-0 text-[22px] font-bold text-cgy-red">{t}</span>
                  <span className="text-[19px] leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    ),
    notes: [
      "[Your story: how you gathered requirements. Who you talked to, and what they asked for most.]",
      "Say: 'These five became the checklist. I'll come back to each one in the results.'",
    ],
  },
  {
    id: "product",
    star: "A",
    section: "Action · the product",
    answers: "Q2a, Q2b",
    minutes: 1.5,
    body: (
      <>
        <Title>The product: one governed layer</Title>
        <div className="flex flex-1 flex-col justify-center">
          <Flow
            steps={[
              { label: "Sources", title: "Three source systems", detail: "Every client's data" },
              { label: "Bronze", title: "Raw", detail: "Personal data masked" },
              { label: "Silver", title: "One definition", detail: "Across every client" },
              { label: "Gold", title: "100+ tested models", detail: "One grain each", highlight: true },
              { label: "Consumers", title: "BI · ML · AI", detail: "Role-based access", dark: true },
            ]}
          />
          <div className="mt-14 grid grid-cols-2 gap-10">
            <Sub letter="a" title="What it does">
              Transforms every client&apos;s data once, in dbt, into one Snowflake layer that any approved
              team or tool can use.
            </Sub>
            <Sub letter="b" title="How people use it">
              <Chips items={["BI dashboards", "Client data sharing", "Customer Success bot"]} />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "Walk the flow left to right in one breath. The point: transform once, use everywhere.",
      "My part: product owner. I worked with Data Engineering and Customer Success, with a small product pod.",
    ],
  },
  {
    id: "ai",
    star: "A",
    section: "Action · the product",
    answers: "Q2b",
    minutes: 1.25,
    body: (
      <>
        <Title>Ask in plain English, get the dashboard&apos;s number</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-[270px] shrink-0 rounded-lg bg-cgy-paper p-5">
              <Label>Question</Label>
              <p className="mt-1 text-[21px] font-semibold leading-snug text-cgy-slate">
                &ldquo;How did ticket revenue trend this month?&rdquo;
              </p>
            </div>
            <span className="text-[30px] font-bold text-cgy-red">→</span>
            <div className="flex-1 rounded-lg border-2 border-cgy-line p-5">
              <Label>Routed to one semantic model</Label>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  ["Property by day", true],
                  ["Campaign", false],
                  ["Other models", false],
                ].map(([m, on]) => (
                  <div
                    key={m as string}
                    className={`rounded-lg px-4 py-3 text-center text-[19px] font-bold ${
                      on ? "bg-cgy-red text-white" : "bg-cgy-paper text-cgy-grey"
                    }`}
                  >
                    {m}
                    <span className="block text-[14px] font-semibold opacity-80">one grain</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-[30px] font-bold text-cgy-red">→</span>
            <div className="w-[230px] shrink-0 rounded-lg bg-cgy-slate p-5 text-white">
              <p className="text-[15px] font-bold uppercase tracking-wide text-white/60">Answer</p>
              <p className="mt-1 text-[21px] font-semibold leading-snug">Matches the dashboard</p>
            </div>
          </div>
          <p className="mt-12 max-w-[1050px] text-[22px] leading-snug">
            Each semantic model has one grain, so the AI can&apos;t double count. We shipped it first as an
            internal Customer Success bot. I led discovery for Stellar Insights, the client-facing version.
          </p>
        </div>
      </>
    ),
    notes: [
      "This is the 'show the product' moment. Trace the arrows once.",
      "The example question is illustrative. [Your story: a real question the CS bot answered.]",
    ],
  },
  {
    id: "approach",
    star: "A",
    section: "Action · the approach",
    answers: "Q3a, Q3b",
    minutes: 1.5,
    body: (
      <>
        <Title>Four decisions that shaped the build</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["Strategy", "Fix the data once, not every report. Agree the contract before the charts."],
              ["Plan", "Bronze, silver, gold. One grain per gold table. Mask personal data on landing."],
              ["Build", "Airflow and dbt replaced the manual weekly refresh with a daily run."],
              [
                "Review",
                "Freshness checked against each client's target, with AI digests of pipeline errors.",
              ],
            ].map(([t, b], i) => (
              <div key={t} className="rounded-lg bg-cgy-paper p-5">
                <p className="flex items-baseline gap-3">
                  <span className="text-[30px] font-bold leading-none text-cgy-red">{i + 1}</span>
                  <span className="text-[23px] font-bold text-cgy-slate">{t}</span>
                </p>
                <p className="mt-3 text-[18px] leading-snug">{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-10">
            <Sub letter="a" title="Sourcing and preparing the data">
              Three source systems, mapped client by client into one dimensional model, then tested.
            </Sub>
            <Sub letter="b" title="Methods and tools">
              <Chips
                items={["Snowflake", "dbt", "Airflow", "AWS", "Medallion layers", "Data contract", "LLMs"]}
              />
            </Sub>
          </div>
        </div>
      </>
    ),
    notes: [
      "Strategy first, tools last. The panel cares more about the why than the stack.",
      "[Your story: the real build order, and what you'd sequence the same way again.]",
    ],
  },
  {
    id: "challenges",
    star: "A",
    section: "Action · the challenges",
    answers: "Q4",
    minutes: 1.5,
    body: (
      <>
        <Title>What got in the way, and how I handled it</Title>
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
      "Spend most of the time on the People row. It's the one an analyst role at the City will relate to.",
      "[Your story: the conversation that got the data contract agreed. Who pushed back, and what changed their mind?]",
    ],
  },
  {
    id: "result",
    star: "R",
    section: "Result",
    answers: "Q2c",
    minutes: 1.5,
    body: (
      <>
        <Title>What it delivered</Title>
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
              Personal data masked at the raw layer; every person and tool sees only what their role allows.
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
      "Tie each result back to the checklist from Task.",
      "[Your story: an adoption or time-saved number. A real number beats 'no ticket'.]",
    ],
  },
  {
    id: "proud",
    star: "R",
    section: "Result",
    answers: "Q5",
    minutes: 1,
    body: (
      <>
        <Title>What I&apos;m most proud of</Title>
        <div className="my-auto border-l-8 border-cgy-red py-2 pl-10">
          <p className="max-w-[1000px] text-[44px] font-bold leading-tight text-cgy-slate">
            Governance stopped being overhead and became the reason people could self-serve.
          </p>
          <p className="mt-8 max-w-[900px] text-[24px] leading-snug">
            The same tested layer feeds dashboards, client data and the AI, with no separate pipeline for
            each. That&apos;s why the AI&apos;s answers match the dashboards.
          </p>
        </div>
      </>
    ),
    notes: [
      "Slow down here. This is the line to remember.",
      "[Your story: the first time a team trusted an answer without double-checking it.]",
    ],
  },
  {
    id: "improve",
    star: "R",
    section: "Result · looking back",
    answers: "Q6",
    minutes: 1,
    body: (
      <>
        <Title>What I&apos;d improve with more time</Title>
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
      "Land the closing line slowly. It's the bridge to the role.",
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
        </div>
      </div>
    ),
    notes: ["Stop talking. Leave this up for questions."],
  },
];
