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

function Point({ n, title, children }: { n?: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-lg bg-cgy-paper p-6">
      {n !== undefined && <span className="text-[40px] font-bold leading-none text-cgy-red">{n}</span>}
      <div>
        <p className="text-[28px] font-bold leading-tight text-cgy-slate">{title}</p>
        <p className="mt-2 text-[22px] leading-snug">{children}</p>
      </div>
    </div>
  );
}

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
      "[Your story: one line on who you are.] Then: 'I'll walk through PRIME, then show you the same approach working on the City's data.'",
    ],
  },
  {
    id: "agenda",
    section: "The next 15 minutes",
    minutes: 0.25,
    body: (
      <>
        <Title>How I worked, then the live product</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-5 gap-3">
            {[
              ["Problem", "Q1"],
              ["What people needed", "Q1"],
              ["Strategy and build", "Q2 · Q3"],
              ["Results", "Q2"],
              ["Live demo", "Q3 · Q5"],
            ].map(([s, q], i) => (
              <div key={s} className="rounded-lg border-t-4 border-cgy-red bg-cgy-paper p-6">
                <p className="text-[44px] font-bold leading-none text-cgy-red">{i + 1}</p>
                <p className="mt-4 text-[28px] font-bold leading-tight text-cgy-slate">{s}</p>
                <p className="mt-2 text-[19px] text-cgy-grey">{q}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[24px]">Then the challenges (Q4) and what I&apos;d build next (Q6).</p>
        </div>
      </>
    ),
    notes: ["Fifteen seconds. The tag on each slide shows which of your questions it answers."],
  },
  {
    id: "problem",
    section: "The problem",
    answers: "Q1",
    minutes: 1.5,
    body: (
      <>
        <Title>Multi-tenancy made accurate reporting hard</Title>
        <div className="mt-8 grid flex-1 grid-cols-[1fr_1fr] gap-8">
          <div className="flex flex-col justify-center rounded-lg bg-cgy-paper p-8">
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
            <p className="mt-5 text-center text-[22px] text-cgy-red">↓ manual weekly refresh ↓</p>
            <p className="mt-5 text-center text-[26px] font-bold text-cgy-slate">
              Same question, different answers
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <Point title="Stale">Data was up to 7 days old.</Point>
            <Point title="Fragmented">Every cross-client question went through engineering.</Point>
            <Point title="Unowned">No owner and no service levels when it broke.</Point>
          </div>
        </div>
      </>
    ),
    notes: [
      "Customer Success, Product and clients each had their own number, so meetings argued about whose was right.",
      "[Your story: one concrete moment where this hurt.]",
      "City link: departments with their own systems face the same thing. The useful questions cut across them.",
    ],
  },
  {
    id: "needs",
    section: "What people needed",
    answers: "Q1",
    minutes: 1,
    body: (
      <>
        <Title>Three needs shaped every decision</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-3 gap-5">
            {[
              [
                "One version of the truth",
                "CS, Product and clients see the same numbers.",
                "One definition across every client",
              ],
              [
                "Fresh and dependable",
                "A known refresh schedule, and someone accountable.",
                "Daily refresh and a data contract",
              ],
              [
                "Self-serve",
                "Routine questions answered without a ticket, by people or AI.",
                "Documented tables, one grain each",
              ],
            ].map(([t, b, r]) => (
              <div key={t} className="flex flex-col rounded-lg border border-cgy-line p-8">
                <p className="text-[30px] font-bold leading-tight text-cgy-slate">{t}</p>
                <p className="mt-4 text-[23px] leading-snug">{b}</p>
                <p className="mt-8 border-t border-cgy-line pt-5 text-[21px] font-semibold text-cgy-red">
                  → {r}
                </p>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    notes: [
      "Users: Customer Success, Product, clients, analysts, and later AI assistants.",
      "[Your story: how you gathered these. Interviews, the ticket queue, client feedback?]",
    ],
  },
  {
    id: "strategy",
    section: "Strategy and build",
    answers: "Q3",
    minutes: 1,
    body: (
      <>
        <Title>Fix the layer, not the reports</Title>
        <div className="mt-8 grid flex-1 grid-cols-[1.3fr_1fr] gap-8">
          <div className="flex flex-col justify-between gap-4">
            <Point n={1} title="Consolidate once">
              One governed Snowflake layer instead of patching each client database.
            </Point>
            <Point n={2} title="Contract before code">
              Owners, refresh targets and incident tiers agreed first.
            </Point>
            <Point n={3} title="Model by grain">
              Each table answers one shape of question, so nothing double counts.
            </Point>
          </div>
          <div className="rounded-lg border border-cgy-line p-7">
            <Label>Sequenced so each step was usable</Label>
            <ol className="mt-6 space-y-6 text-[25px]">
              {[
                "Agree the contract",
                "Land and protect the data",
                "Define it once",
                "Serve dashboards and data shares",
                "Add AI, internal bot first",
              ].map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="font-bold text-cgy-red">{i + 1}</span>
                  <span className="text-cgy-slate">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </>
    ),
    notes: [
      "Each decision maps to a need on the last slide.",
      "[Your story: confirm the real order, and an option you rejected.]",
    ],
  },
  {
    id: "build",
    section: "Strategy and build",
    answers: "Q2 · Q3",
    minutes: 1.25,
    body: (
      <>
        <Title>PRIME: one layer every consumer reads from</Title>
        <div className="flex flex-1 flex-col justify-center">
          <Flow
            steps={[
              { label: "Sources", title: "Ticketing, accounts, apps", detail: "Logs, automations, segments" },
              { label: "Bronze", title: "Raw", detail: "Personal data masked" },
              { label: "Silver", title: "One definition", detail: "Across every client" },
              { label: "Gold", title: "Tested tables", detail: "One grain each", highlight: true },
              {
                label: "Consumers",
                title: "BI · ML · AI",
                detail: "Role-based access",
                dark: true,
              },
            ]}
          />
          <div className="mt-8 flex flex-wrap gap-3 text-[20px]">
            {[
              "Snowflake",
              "dbt · 100+ tested models",
              "Airflow",
              "Freshness checked every 30 min",
              "AI error digests",
            ].map((c) => (
              <span key={c} className="rounded-full bg-cgy-paper px-4 py-2 font-semibold text-cgy-slate">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-cgy-paper px-6 py-5">
          <p className="text-[20px] leading-snug text-cgy-slate">
            <strong>My role:</strong> Director of Product Innovation &amp; Analytics. I owned PRIME from
            planning to general availability, working with Data Engineering and Customer Success.
          </p>
        </div>
      </>
    ),
    notes: [
      "How people use it: a CS manager asks 'how did ticket revenue trend this month?' and the agent answers from the table with the right grain.",
      "[Your story: what you personally decided as product owner.]",
    ],
  },
  {
    id: "results",
    section: "Results",
    answers: "Q2",
    minutes: 0.75,
    body: (
      <>
        <Title>What changed</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-4 gap-4">
            <BigStat from="7 days" value="< 12 hrs" label="Data freshness" />
            <BigStat value="100+" label="Tested models, replacing a database per client" />
            <BigStat value="30 min" label="To flag a missed refresh" />
            <BigStat value="Self-serve" label="Routine Customer Success questions" />
          </div>
        </div>
        <p className="rounded-lg bg-cgy-slate px-7 py-6 text-[26px] font-semibold leading-snug text-white">
          When the dashboard, the client export and the AI give the same number, people stop checking and
          start deciding.
        </p>
      </>
    ),
    notes: [
      "[Your story: any adoption or time-saved number you can share.] Pause, then: 'Let me show you this working.'",
    ],
  },
  {
    id: "demo",
    dark: true,
    section: "Live demo",
    answers: "Q3 · Q5",
    minutes: 5,
    body: (
      <>
        <Label dark>PRIME&apos;s data belongs to clients, so I rebuilt the approach on open data</Label>
        <h2 className="mt-3 text-[50px] font-bold leading-tight text-white">
          Live on City of Calgary transit data
        </h2>
        <div className="mt-10 grid grid-cols-4 gap-4">
          {[
            ["The story", "Riders are back to 95% of 2019. Feedback per trip is up 12%."],
            ["The catch", "A 43% jump in complaints that wasn't real."],
            ["Predict", "A live XGBoost model: will a 311 request close within a week?"],
            ["Ask the data", "Plain English in, SQL and the answer out. My proudest part."],
          ].map(([t, b], i) => (
            <div key={t} className="rounded-lg bg-white/10 p-7">
              <p className="text-[44px] font-bold leading-none text-white/70">{i + 1}</p>
              <p className="mt-4 text-[30px] font-bold text-white">{t}</p>
              <p className="mt-3 text-[23px] leading-snug text-white/85">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-auto text-[19px] text-white/60">
          Built this week: Airflow · dbt · DuckDB · 27 tests · XGBoost · Claude ·
          codychandler.ca/data-demos/calgary-transit
        </p>
      </>
    ),
    notes: [
      "LIVE (5 min). Switch to the Dashboard tab.",
      "1 · Read the headline. Point at the trips line: the 2020 drop and the recovery. (1 min)",
      "2 · The 311 chart. 'My first cut said complaints per trip were up 43%. That felt too dramatic, so I checked. Lost Property moved into 311 in 2021. I fixed it in the data, once, so the dashboard and the AI both get it right. Like for like it's 12%, led by fares and stops.' (1 min)",
      "3 · Predict tab: 'Same governed tables, now ML.' Pick Bus Stops: about 45%, likely slower. 'The biggest driver is how fast this type has been handled lately, more than the type itself.' Switch to Transit Pass Programs and watch it jump to about 80%. Then the honest part: 'Tested on 2025, a year it never saw, it beats the simple rule of thumb by a couple of points, and it explains every prediction.' (1 min)",
      "4 · Ask the data: click 'How has ridership recovered since the pandemic?'. While it runs: 'it reads the dbt docs, writes SQL, and runs it here in the browser on governed tables only.' Show the SQL, then point at the same 95% on the dashboard. (1.5 min)",
      "If asked how it's built: open the Approach page and the Airflow graph. Otherwise skip it.",
    ],
  },
  {
    id: "challenges",
    section: "Challenges",
    answers: "Q4",
    minutes: 1.5,
    body: (
      <>
        <Title>The hard parts were definitions and people</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-3 gap-5">
            {[
              ["People", "Nobody owned freshness.", "The contract named owners, targets and incident tiers."],
              [
                "Analytical",
                "The wrong table, or a changed definition, quietly misleads.",
                "One grain per table. The Lost Property fix.",
              ],
              [
                "Technical",
                "Many shapes of the same thing.",
                "Every client at StellarAlgo; four department codes at the City.",
              ],
            ].map(([t, p, s]) => (
              <div key={t} className="flex flex-col rounded-lg border border-cgy-line p-7">
                <Label>{t}</Label>
                <p className="mt-3 text-[30px] font-bold leading-tight text-cgy-slate">{p}</p>
                <p className="mt-8 border-t border-cgy-line pt-5 text-[22px] leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    notes: [
      "[Your story: the conversation that got the data contract agreed. Who pushed back, and what changed their mind?]",
    ],
  },
  {
    id: "next",
    section: "With more time",
    answers: "Q6",
    minutes: 1,
    body: (
      <>
        <Title>What I&apos;d build next</Title>
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid grid-cols-3 gap-5">
            <Point title="PRIME for clients">Take the internal CS bot to clients as Stellar Insights.</Point>
            <Point title="On-time performance">
              Add the City&apos;s real-time feeds to measure reliability by route.
            </Point>
            <Point title="Owner sign-off">
              Agree targets and definitions with the people who run the service.
            </Point>
          </div>
        </div>
        <p className="rounded-lg bg-cgy-slate px-7 py-6 text-[26px] font-semibold leading-snug text-white">
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
