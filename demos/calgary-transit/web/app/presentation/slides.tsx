import Image from "next/image";
import type { ReactNode } from "react";
import dag from "@/public/images/airflow-dag.png";
import { BigStat, Card, Flow, Lede, Title, type Slide } from "./slide-kit";

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[15px] font-bold uppercase tracking-wide text-cgy-grey">{children}</p>;
}

export const SLIDES: Slide[] = [
  {
    id: "title",
    dark: true,
    minutes: 0.3,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-[20px] font-semibold uppercase tracking-wide text-white/60">Data product case study</p>
        <h1 className="mt-4 max-w-[1000px] text-[66px] font-bold leading-[1.05] text-white">
          PRIME: one governed data layer for a multi-tenant product
        </h1>
        <p className="mt-6 max-w-[920px] text-[26px] text-white/85">
          How StellarAlgo got Customer Success, Product and clients working from the same numbers, and the same process run
          on City of Calgary transit data.
        </p>
        <p className="mt-12 text-[22px] font-semibold text-white">Cody Chandler</p>
        <p className="text-[18px] text-white/60">Data and Business Analyst interview · The City of Calgary</p>
      </div>
    ),
    notes: [
      "Thank the panel. One line on who you are: [Your story: one sentence on your background].",
      "Frame: a data product I led end to end, then the same process on the City's own open data, live.",
    ],
  },
  {
    id: "agenda",
    section: "How I'll answer your questions",
    minutes: 0.3,
    body: (
      <>
        <Title>The order I worked in, and where each question lands</Title>
        <div className="mt-8 grid flex-1 grid-cols-6 gap-3">
          {[
            ["The problem", "Q1 · why it mattered, who it affected"],
            ["What people needed", "Q1 · the users"],
            ["Strategy", "Q3 · the approach"],
            ["Plan", "Q3 · sourcing and sequence"],
            ["Build", "Q2 · what it does · Q3 · tools"],
            ["Review and iterate", "Q2 · the value"],
          ].map(([s, q], i) => (
            <div key={s} className="rounded-lg border-t-4 border-cgy-red bg-cgy-paper p-5">
              <p className="text-[44px] font-bold leading-none text-cgy-red">{i + 1}</p>
              <p className="mt-4 text-[23px] font-bold leading-tight text-cgy-navy">{s}</p>
              <p className="mt-3 text-[17px] leading-snug">{q}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Then, live on Calgary data", "The same process on City open data: dashboard and AI agent"],
            ["Challenges", "Q4 · technical, analytical and people"],
            ["Proudest feature and what's next", "Q5 and Q6"],
          ].map(([s, q]) => (
            <div key={s} className="rounded-lg border border-cgy-line p-5">
              <p className="text-[21px] font-bold text-cgy-navy">{s}</p>
              <p className="mt-1 text-[17px]">{q}</p>
            </div>
          ))}
        </div>
      </>
    ),
    notes: ["Twenty seconds. The tag in the top-left of every slide tells the panel which question it answers."],
  },
  {
    id: "problem",
    section: "The problem",
    answers: "Q1",
    minutes: 1.5,
    body: (
      <>
        <Title>Multi-tenancy made accurate reporting hard</Title>
        <Lede>Every client&apos;s data lived in its own database. Any question across clients meant querying each one separately.</Lede>
        <div className="mt-6 grid flex-1 grid-cols-[1fr_1.15fr] gap-8">
          <div className="flex flex-col justify-center rounded-lg bg-cgy-paper p-6">
            <Label>Before PRIME</Label>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Client A", "Client B", "Client C", "Client D", "Client E", "…"].map((c) => (
                <div key={c} className="rounded border-2 border-cgy-silver bg-white px-2 py-3 text-center text-[16px] font-semibold text-cgy-navy">
                  {c}
                  <span className="block text-[12px] font-normal text-cgy-grey">own database</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[24px] text-cgy-red">↓ manual weekly refresh ↓</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-[15px]">
              {["CS numbers", "Product numbers", "Client numbers"].map((r) => (
                <div key={r} className="rounded bg-white p-2 font-semibold text-cgy-navy">
                  {r}
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[15px] text-cgy-grey">Same question, different answers</p>
          </div>
          <div className="flex flex-col gap-3">
            <Card compact title="Stale">A manual weekly refresh meant data could be up to 7 days old.</Card>
            <Card compact title="Fragmented">Cross-property questions meant querying every client system separately, through engineering.</Card>
            <Card compact title="Unowned">Ownership was split across teams, with no agreed service levels when something broke.</Card>
            <Card compact title="Why it mattered" accent="navy">
              Decisions and client conversations ran on numbers nobody could fully stand behind, and AI assistants would only repeat them.
            </Card>
          </div>
        </div>
      </>
    ),
    notes: [
      "[Your story: one concrete moment where inconsistent numbers caused a real problem with a client or internally.]",
      "Bridge to the City: siloed client databases look a lot like departments that each run their own system. The questions that matter cut across them.",
    ],
  },
  {
    id: "needs",
    section: "What people needed",
    answers: "Q1",
    minutes: 1,
    body: (
      <>
        <Title>Each group&apos;s need became a requirement</Title>
        <table className="mt-6 w-full text-left text-[20px]">
          <thead>
            <tr className="border-b-2 border-cgy-navy text-cgy-navy">
              <th className="w-[19%] py-2 pr-4">Who</th>
              <th className="w-[41%] py-2 pr-4">What they needed</th>
              <th className="py-2">Requirement it became</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Customer Success", "Answers for clients without waiting on engineering", "Self-serve for routine questions"],
              ["Product", "A view across every client, not one at a time", "One definition across all clients"],
              ["Clients", "Dashboards and data shares they can rely on", "Fresh, reconciled data on a known schedule"],
              ["Analysts", "Clean, documented models to build on", "Tested and documented, every run"],
              ["AI assistants", "Tables with no ambiguity about what a row means", "One declared grain per table"],
              ["Everyone", "Someone accountable when it breaks", "Named owners, targets and incident tiers"],
            ].map(([w, n, r]) => (
              <tr key={w} className="border-b border-cgy-line">
                <td className="py-3.5 pr-4 font-semibold text-cgy-navy">{w}</td>
                <td className="py-3.5 pr-4">{n}</td>
                <td className="py-3.5 font-semibold text-cgy-red">{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-auto rounded-lg bg-cgy-paper px-6 py-4 text-[20px] text-cgy-navy">
          Every design decision that follows traces back to one of these rows.
        </p>
      </>
    ),
    notes: [
      "[Your story: how you gathered these. Interviews, shadowing CS, reviewing the engineering ticket queue, client feedback?]",
      "The point to land: I didn't start from the technology. Every design choice traces back to one of these rows.",
    ],
  },
  {
    id: "strategy",
    section: "Strategy",
    answers: "Q3",
    minutes: 1,
    body: (
      <>
        <Title>Fix the layer, not the reports</Title>
        <Lede>Four decisions shaped everything after them.</Lede>
        <div className="mt-6 grid flex-1 grid-cols-2 gap-5">
          {[
            ["Consolidate once", "One governed Snowflake layer for every client, instead of patching each client database and each report."],
            ["Agree the contract before building", "Refresh and accuracy targets, incident tiers and owners, agreed with the teams who rely on them."],
            ["Model by grain", "Every consumption table answers one shape of question, so neither people nor AI double count."],
            ["Prove AI internally first", "An internal Customer Success bot before any client-facing assistant."],
          ].map(([t, b], i) => (
            <div key={t} className="flex gap-4 rounded-lg border border-cgy-line p-5">
              <span className="text-[36px] font-bold leading-none text-cgy-red">{i + 1}</span>
              <div>
                <p className="text-[22px] font-bold text-cgy-navy">{t}</p>
                <p className="mt-2 text-[18px] leading-snug">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    notes: [
      "Tie each decision back to a requirement on the previous slide: consolidate → one definition; contract → owners and freshness; grain → AI; internal first → trust before scale.",
      "[Your story: any option you considered and rejected, e.g. fixing reports one by one.]",
    ],
  },
  {
    id: "plan",
    section: "Plan",
    answers: "Q3",
    minutes: 0.75,
    body: (
      <>
        <Title>Sequenced so every step was usable on its own</Title>
        <div className="mt-8 grid flex-1 grid-cols-6 gap-3">
          {[
            ["Agree", "The contract and the owners"],
            ["Land and protect", "All sources into bronze, personal data masked, roles defined"],
            ["Define once", "Silver: one dimensional model across clients"],
            ["Serve", "Gold for the CS platform, data sharing and dashboards"],
            ["Watch", "Freshness every 30 minutes, error digests, cost per model"],
            ["Add AI", "Internal CS bot, then Stellar Insights discovery"],
          ].map(([t, b], i) => (
            <div key={t} className="relative rounded-lg bg-cgy-paper p-4">
              <p className="text-[44px] font-bold leading-none text-cgy-red">{i + 1}</p>
              <p className="mt-4 text-[23px] font-bold leading-tight text-cgy-navy">{t}</p>
              <p className="mt-3 text-[18px] leading-snug">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-cgy-line p-5 text-[18px]">
          <Label>Sources</Label>
          <p className="mt-2">Ticketing and accounts · app configuration and logs · automations · segments · client and league reference files</p>
        </div>
      </>
    ),
    notes: [
      "[Your story: confirm the real order and roughly how long each step took.]",
      "Why this order: each step delivers something people can use, so value shows up before the whole thing is finished.",
    ],
  },
  {
    id: "build",
    section: "Build",
    answers: "Q2 · Q3",
    minutes: 1.25,
    body: (
      <>
        <Title>PRIME: one governed layer every consumer reads from</Title>
        <div className="mt-6">
          <Flow
            steps={[
              { label: "Sources", title: "Ticketing, accounts, apps", detail: "Logs, automations, segments, reference files" },
              { label: "Bronze", title: "Raw, as landed", detail: "Personal data masked on arrival" },
              { label: "Silver", title: "One definition", detail: "Dimensional model across all clients" },
              { label: "Gold", title: "Consumption tables", detail: "Rebuilt every run, tested first", highlight: true },
              { label: "Consumers", title: "CS · clients · BI · AI", detail: "Role-based access by consumer", dark: true },
            ]}
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-5">
          <Card title="Data contract" accent="navy">Refresh and accuracy targets per domain, three incident tiers, a named owner for each.</Card>
          <Card title="Governed access" accent="navy">Personal data masked at the raw layer; analysts, client dashboards and AI each get their own role.</Card>
          <Card title="Monitoring" accent="navy">Daily Airflow and dbt refresh; freshness checked every 30 minutes with AI-written error digests.</Card>
        </div>
        <div className="mt-auto flex items-center gap-6 rounded-lg bg-cgy-paper px-6 py-4">
          <p className="text-[15px] font-bold uppercase tracking-wide text-cgy-red">My role</p>
          <p className="text-[19px] leading-snug text-cgy-navy">
            Director of Product Innovation &amp; Analytics. I owned PRIME&apos;s product management from planning through general
            availability, working with Data Engineering and Customer Success through a small product pod.
          </p>
        </div>
      </>
    ),
    notes: [
      "Tools: Snowflake, dbt (100+ tested models), Airflow, AWS, a semantic layer and LLMs.",
      "[Your story: what you personally decided as product owner, and how you kept the pod aligned.]",
    ],
  },
  {
    id: "usage",
    section: "Build",
    answers: "Q2",
    minutes: 0.5,
    body: (
      <>
        <Title>How people use it: ask a question, get the right grain</Title>
        <div className="mt-6 grid flex-1 grid-cols-[1fr_1.1fr] gap-8">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-cgy-navy p-6 text-white">
              <p className="text-[15px] font-bold uppercase tracking-wide text-white/60">A CS manager asks</p>
              <p className="mt-2 text-[28px] font-semibold leading-snug">“How did ticket revenue trend this month?”</p>
            </div>
            <p className="text-[19px] leading-snug">
              The agent picks the semantic model whose <strong className="text-cgy-navy">grain</strong> fits the question and
              answers from it. Answering a campaign question from a daily table would double-count clicks.
            </p>
            <Label>The same gold tables feed</Label>
            <div className="flex flex-wrap gap-2">
              {["Client success platform", "Client data sharing", "BI dashboards", "AI assistants"].map((c) => (
                <span key={c} className="rounded-full bg-cgy-paper px-3 py-1.5 text-[15px] font-semibold text-cgy-navy">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <table className="self-start text-left text-[20px]">
            <thead>
              <tr className="border-b-2 border-cgy-navy text-cgy-navy">
                <th className="py-2 pr-4">Semantic model</th>
                <th className="py-2">One row per…</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Team trends", "team per day"],
                ["Campaigns", "email campaign"],
                ["Segments", "audience segment"],
                ["Users", "user per day"],
                ["Automations", "automation"],
              ].map(([m, g]) => (
                <tr key={m} className="border-b border-cgy-line">
                  <td className="py-4 pr-4 font-semibold text-cgy-navy">{m}</td>
                  <td className="py-4">{g}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
    notes: ["Keep it quick: the live version of this is coming on Calgary data."],
  },
  {
    id: "review",
    section: "Review and iterate",
    answers: "Q2",
    minutes: 1,
    body: (
      <>
        <Title>What changed, and what we kept improving</Title>
        <div className="mt-6 grid grid-cols-4 gap-4">
          <BigStat from="7 days" value="< 12 hrs" label="Data freshness" />
          <BigStat value="100+" label="Tested dbt models, replacing a database per client" />
          <BigStat value="30 min" label="To flag a missed refresh" />
          <BigStat value="Self-serve" label="Routine Customer Success questions" />
        </div>
        <div className="mt-auto grid grid-cols-3 gap-4">
          <Card title="Trust before scale" accent="teal">The CS bot shipped first, so accuracy was proven on our own people before clients.</Card>
          <Card title="Grain as a rule" accent="teal">Every consumption table declares its grain, because the wrong table silently double counts.</Card>
          <Card title="Watched, not hoped" accent="teal">Missed refreshes surface in 30 minutes, with cost tracked per model.</Card>
        </div>
      </>
    ),
    notes: [
      "Value: CS, Product and clients work from the same numbers on a reliable schedule, and routine questions no longer need an engineering ticket.",
      "[Your story: feedback from users that changed the design, and any adoption or time-saved numbers you can share.]",
    ],
  },
  {
    id: "bridge",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-[20px] font-semibold uppercase tracking-wide text-white/60">Live on City data</p>
        <h2 className="mt-4 max-w-[1050px] text-[54px] font-bold leading-[1.1] text-white">
          PRIME&apos;s data belongs to StellarAlgo&apos;s clients. So I ran the same process on Calgary&apos;s open data.
        </h2>
        <p className="mt-8 text-[26px] text-white/85">Same steps. Real City data. Refreshed daily, and live in this browser.</p>
      </div>
    ),
    notes: ["Say it plainly: I can't show client data, so here is the same process on data you know."],
  },
  {
    id: "calgary-process",
    section: "Live on City data",
    answers: "Q3",
    minutes: 1,
    body: (
      <>
        <Title>Calgary Transit, the same six steps</Title>
        <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
          {[
            ["The problem", "Ridership, service hours and 311 are published separately, with shifting codes and no shared view of how current each is."],
            ["What people needed", "Service planners, 311 leads, fare policy and leadership: one trusted trips number, comparable trends, known freshness."],
            ["Strategy", "Fix the data once. Contract before charts. One grain per table. Only gold leaves the warehouse."],
            ["Plan", "Three datasets, five gold tables, one per question. Land, map, test, publish, then dashboard and agent."],
            ["Build", "Airflow (31 tasks), dbt (10 models, 27 tests), DuckDB, a daily GitHub Actions run, and this site."],
            ["Review and iterate", "The first cloud run failed and was fixed. A 43% jump in complaints turned out to be a new 311 channel."],
          ].map(([t, b], i) => (
            <div key={t} className={`rounded-lg p-5 ${i === 5 ? "border-2 border-cgy-red" : "bg-cgy-paper"}`}>
              <p className="flex items-baseline gap-2 text-[21px] font-bold text-cgy-navy">
                <span className="text-cgy-red">{i + 1}</span> {t}
              </p>
              <p className="mt-2 text-[17px] leading-snug">{b}</p>
            </div>
          ))}
        </div>
      </>
    ),
    notes: [
      "The users here are my assumption of who'd use this at the City; in a real engagement I'd confirm them in short interviews.",
      "The full version of this is the Approach page on the site.",
    ],
  },
  {
    id: "calgary-build",
    section: "Live on City data",
    answers: "Q3",
    minutes: 2,
    body: (
      <>
        <Title>The build, end to end</Title>
        <div className="mt-5">
          <Flow
            steps={[
              { label: "Source", title: "Calgary open data", detail: "Ridership, service hours, 271K transit 311 requests" },
              { label: "Bronze", title: "Airflow", detail: "Raw JSON, incremental 311 loads, load log" },
              { label: "Silver", title: "dbt", detail: "One definition across reorganizations" },
              { label: "Gold", title: "dbt", detail: "5 tables, one declared grain each", highlight: true },
              { label: "Consumers", title: "Dashboard · AI agent", detail: "Read gold only", dark: true },
            ]}
          />
        </div>
        <div className="mt-5 grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-6">
          <div className="overflow-hidden rounded-lg border border-cgy-line">
            <Image src={dag} alt="Airflow graph of the calgary_transit DAG" className="h-full w-full object-contain" sizes="760px" />
          </div>
          <div className="flex flex-col gap-3 text-[18px]">
            <p><strong className="text-cgy-navy">Sourcing:</strong> the City&apos;s Socrata API; 311 loads incrementally with a 7-day lookback.</p>
            <p><strong className="text-cgy-navy">Preparation:</strong> reference tables map 4 department codes and 67 request types.</p>
            <p><strong className="text-cgy-navy">Quality:</strong> 27 tests every run; a failure stops publishing.</p>
            <p><strong className="text-cgy-navy">Portability:</strong> DuckDB here; the same dbt code runs on Snowflake.</p>
          </div>
        </div>
      </>
    ),
    notes: [
      "LIVE DEMO (about 90 seconds): switch to the Dashboard. Read the headline: riders back to 95% of 2019 on 99% of the service, feedback per trip up 12%. Then the 'what riders contact 311 about' chart: fares and passes, stops and stations.",
      "If the room has no internet, the slides still carry the story.",
    ],
  },
  {
    id: "challenges",
    section: "Challenges",
    answers: "Q4",
    minutes: 1.5,
    body: (
      <>
        <Title>The hard parts were definitions and people, not code</Title>
        <div className="mt-6 grid flex-1 grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <Label>At StellarAlgo</Label>
            <Card title="Technical: one definition across clients">
              Every client system had its own shape. Silver became one dimensional model all properties map into.
            </Card>
            <Card title="Analytical: grain">
              The wrong table silently double counts. Each model declares one grain, and the agent chooses by it.
            </Card>
            <Card title="People: nobody owned freshness">
              Split ownership, no service levels. The contract named owners, targets and incident tiers.
            </Card>
          </div>
          <div className="flex flex-col gap-3">
            <Label>In the City&apos;s data, this week</Label>
            <Card title="One department, four codes" accent="teal">
              Calgary Transit appears in 311 as TRAN, OS, OSC and Tranc. A reference table unifies them.
            </Card>
            <Card title="A misleading trend" accent="teal">
              Complaints per trip looked up 43%. Lost Property moved into 311 in 2021; like for like, it&apos;s 12%.
            </Card>
            <Card title="Totals that don't add up" accent="teal">
              Fare products never sum to the published total. The gap is an explicit, tested row.
            </Card>
          </div>
        </div>
      </>
    ),
    notes: [
      "[Your story: the stakeholder conversation that got the data contract agreed. Who pushed back, and what changed their mind?]",
      "The Lost Property catch is the best analytical example: a second look at a number that seemed too dramatic, then a governed fix so nobody repeats the mistake, including the AI.",
    ],
  },
  {
    id: "proud",
    section: "Proudest feature",
    answers: "Q5",
    minutes: 1.25,
    body: (
      <>
        <Title>AI answers that match the dashboard</Title>
        <Lede>
          An AI assistant is only as good as the layer under it. One documented grain per table and a tested contract are
          what make plain-English answers trustworthy.
        </Lede>
        <div className="mt-6 grid grid-cols-3 gap-5">
          <Card title="Reads the docs, not the raw data" accent="navy">
            Its instructions come from the dbt documentation: grains, column meanings, and rules like “never add trips to boardings”.
          </Card>
          <Card title="Shows the SQL" accent="navy">Every answer displays the exact query and rows behind it, so anyone can check the number.</Card>
          <Card title="Can't touch what it shouldn't" accent="navy">Read-only queries on gold tables only, with file and network access switched off.</Card>
        </div>
        <div className="mt-auto grid grid-cols-[1fr_1.4fr] items-stretch overflow-hidden rounded-lg pt-5">
          <div className="bg-cgy-paper p-5">
            <Label>You ask</Label>
            <p className="mt-2 text-[22px] font-semibold leading-snug text-cgy-navy">“How has ridership recovered since the pandemic?”</p>
          </div>
          <pre className="bg-cgy-navy p-5 font-mono text-[15px] leading-relaxed text-white">{`-- the kind of query it writes, shown with every answer
select year, sum(trips) as trips
from transit_monthly_kpis
where has_ridership_data
group by year
having count(*) = 12   -- complete years only
order by year;`}</pre>
        </div>
      </>
    ),
    notes: [
      "LIVE DEMO (about 60 seconds): open Ask the data and click 'How has ridership recovered since the pandemic?'. Show the SQL, then point at the same number on the dashboard.",
      "Why it's the proudest part: it's where governance stops being overhead and becomes the reason people can self-serve.",
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
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <Label>PRIME</Label>
            <Card title="Stellar Insights for clients">Take plain-English answers from the internal CS bot to clients, on the same semantic layer.</Card>
            <Card title="Contract health as a product metric">Report freshness and incident history to the teams that own each domain.</Card>
          </div>
          <div className="flex flex-col gap-3">
            <Label>Calgary Transit</Label>
            <Card title="On-time performance" accent="teal">Land the City&apos;s real-time vehicle positions to measure reliability by route.</Card>
            <Card title="An equity lens" accent="teal">Join requests and service to the Calgary Equity Index by community.</Card>
            <Card title="Owner sign-off" accent="teal">Agree freshness targets and category mappings with the people who run the service.</Card>
          </div>
        </div>
        <div className="mt-auto pt-5">
          <div className="rounded-lg bg-cgy-navy px-6 py-4 text-[20px] leading-snug text-white">
          The same work at the City: find where numbers disagree, agree one definition with the people who own it, and make it
          self-serve.
          </div>
        </div>
      </>
    ),
    notes: ["[Your story: anything you'd change about PRIME in hindsight.]", "Land the closing line slowly; it's the bridge to the role."],
  },
  {
    id: "close",
    dark: true,
    minutes: 0.25,
    body: (
      <div className="flex flex-1 flex-col justify-center">
        <h2 className="text-[64px] font-bold text-white">Thank you. Questions?</h2>
        <p className="mt-6 max-w-[900px] text-[24px] text-white/85">
          Everything shown today is public: the dashboard, the agent, the pipeline code and the dbt documentation.
        </p>
        <div className="mt-10 grid max-w-[920px] grid-cols-[140px_1fr] gap-x-8 gap-y-3 text-[20px]">
          <p className="text-white/60">Live demo</p>
          <p className="font-semibold text-white">codychandler.ca/data-demos/calgary-transit</p>
          <p className="text-white/60">Code</p>
          <p className="font-semibold text-white">github.com/frontier-platforms/cody-portfolio</p>
        </div>
      </div>
    ),
    notes: ["Stop talking. Leave this slide up during questions."],
  },
];

