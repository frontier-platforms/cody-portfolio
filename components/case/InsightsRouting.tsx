"use client";

import { useState } from "react";

/**
 * The PRIME agent's semantic layer: a plain-English question is routed to the
 * semantic model built at the right grain, then answered from gold. Generic
 * names and illustrative questions only. BRAND.md section 6, routing diagram.
 */
type Model = {
  letter: string;
  name: string;
  tag: string;
  grain: string;
  about: string;
  measures: string[];
  marker: string;
  question: string;
};

const models: Model[] = [
  {
    letter: "T",
    name: "Team trends",
    tag: "Primary",
    grain: "1 row / team / day",
    about: "Wide daily table: category totals and performance rates across the fan lifecycle.",
    measures: ["Ticketing", "Fan acquisition", "Win-back %", "Upsell %", "Fan growth"],
    marker: "bg-data-3",
    question: "How did ticket revenue trend this month?",
  },
  {
    letter: "C",
    name: "Campaigns",
    tag: "Email",
    grain: "1 row / campaign",
    about: "Send, open and click metrics for each email campaign.",
    measures: ["Sends", "Open rate", "Click rate"],
    marker: "bg-data-1",
    question: "Which email campaign drove the most clicks?",
  },
  {
    letter: "S",
    name: "Segments",
    tag: "Audiences",
    grain: "1 row / segment",
    about: "Each audience segment built in the fan data platform, with its definition.",
    measures: ["Audience size", "Cohorts"],
    marker: "bg-data-4",
    question: "How many fans are in our lapsed-buyer segment?",
  },
  {
    letter: "U",
    name: "Users",
    tag: "Usage",
    grain: "1 row / user / day",
    about: "Daily platform usage per person: engagement, sessions and features used.",
    measures: ["Daily usage", "Sessions", "Features"],
    marker: "bg-data-3",
    question: "Who used the platform this week?",
  },
  {
    letter: "A",
    name: "Automations",
    tag: "Automation",
    grain: "1 row / automation",
    about: "Trigger, actions, audience and full run history for each automation.",
    measures: ["Trigger", "Actions", "Audience", "Run history"],
    marker: "bg-data-2",
    question: "Are our automations running cleanly?",
  },
];

function Node({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-measure rounded-md border border-border bg-surface px-4 py-3 text-center">
      {children}
    </div>
  );
}

const Down = () => (
  <p aria-hidden className="py-2 text-center text-text-muted">
    ↓
  </p>
);

export function InsightsRouting() {
  const [active, setActive] = useState(0);
  const model = models[active];

  return (
    <figure className="diagram my-8 rounded-md border border-border p-4 sm:p-6">
      <p className="meta">Pick a question</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example questions">
        {models.map((m, i) => (
          <button
            key={m.name}
            type="button"
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className="min-h-11 rounded-md border border-border px-3 text-left text-sm transition-colors hover:border-accent aria-pressed:border-text aria-pressed:bg-text aria-pressed:text-bg"
          >
            {m.question}
          </button>
        ))}
      </div>

      <div className="mt-6" aria-live="polite">
        <Node>
          <p className="meta">User question</p>
          <p className="mt-1">“{model.question}”</p>
        </Node>
        <Down />
        <Node>
          <p className="font-semibold">PRIME agent</p>
          <p className="mt-1 text-sm text-text-muted">
            Reads the semantic layer and picks the model whose grain fits. Access follows roles.
          </p>
        </Node>
        <Down />
        <p className="text-center font-semibold">Semantic layer</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {models.map((m, i) => (
            <li
              key={m.name}
              className={`rounded-md border bg-surface p-3 transition-colors ${
                i === active ? "border-text" : "border-border opacity-60"
              }`}
            >
              <span aria-hidden className={`block h-1 w-full rounded-full ${m.marker}`} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="num text-sm font-semibold">{m.letter}</span>
                <span className="rounded-full border border-border px-2 text-xs text-text-muted">
                  {m.tag}
                </span>
              </div>
              <p className="mt-2 font-semibold">{m.name}</p>
              <p className="num text-xs text-text-muted">{m.grain}</p>
              <p className="mt-2 text-xs text-text-muted">{m.about}</p>
              <ul className="mt-2 flex flex-wrap gap-1">
                {m.measures.map((x) => (
                  <li key={x} className="rounded-sm border border-border px-1 text-xs">
                    {x}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <Down />
        <Node>
          <p className="meta">Response</p>
          <p className="mt-1 text-sm">
            Answered from <span className="font-semibold">{model.name}</span>, one row per{" "}
            {model.grain.replace("1 row / ", "").replaceAll(" / ", " per ")}. Same table as the dashboards, so
            the number matches.
          </p>
        </Node>
      </div>

      <figcaption className="mt-6 text-sm text-text-muted">
        Grain is what makes answers trustworthy. Ask a daily table about campaigns and clicks get counted
        twice. Each model has one grain, and the agent routes to the one that fits.
      </figcaption>
    </figure>
  );
}
