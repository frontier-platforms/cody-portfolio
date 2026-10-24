import { Fragment } from "react";

type Stage = { label: string; tool: string; detail: string; tone: "source" | "layer" | "gold" | "consumer" };

const STAGES: Stage[] = [
  { label: "Source", tool: "Calgary open data API", detail: "Ridership, service hours, 311", tone: "source" },
  { label: "Bronze", tool: "Airflow", detail: "Raw JSON as published, plus a load log", tone: "layer" },
  { label: "Silver", tool: "dbt", detail: "Typed, deduplicated, one definition", tone: "layer" },
  { label: "Gold", tool: "dbt", detail: "Tested tables, one grain each", tone: "gold" },
  { label: "Consumers", tool: "Dashboard · AI agent", detail: "Can only read gold", tone: "consumer" },
];

const TONE: Record<Stage["tone"], string> = {
  source: "border-cgy-silver bg-white",
  layer: "border-cgy-line bg-cgy-paper",
  gold: "border-cgy-red bg-white",
  consumer: "border-cgy-navy bg-cgy-navy",
};

export function Architecture({ caption = true }: { caption?: boolean }) {
  return (
    <figure>
      <div className="flex flex-col items-stretch gap-1 md:flex-row md:items-stretch md:gap-0">
        {STAGES.map((s, i) => (
          <Fragment key={s.label}>
            <div className={`flex-1 rounded-lg border-2 p-3 ${TONE[s.tone]}`}>
              <p
                className={`text-xs font-bold uppercase tracking-wide ${
                  s.tone === "consumer" ? "text-white/70" : s.tone === "gold" ? "text-cgy-red" : "text-cgy-grey"
                }`}
              >
                {s.label}
              </p>
              <p className={`mt-1 font-bold ${s.tone === "consumer" ? "text-white" : "text-cgy-navy"}`}>{s.tool}</p>
              <p className={`mt-1 text-sm ${s.tone === "consumer" ? "text-white/85" : ""}`}>{s.detail}</p>
            </div>
            {i < STAGES.length - 1 && (
              <span aria-hidden className="self-center px-1.5 text-lg font-bold text-cgy-red">
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </span>
            )}
          </Fragment>
        ))}
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-cgy-grey">
          Airflow runs every step daily, triggered by GitHub Actions. dbt tests run after each model. A failed test or a
          stale Tier 1 feed stops the run, so the website keeps the last good data.
        </figcaption>
      )}
    </figure>
  );
}
