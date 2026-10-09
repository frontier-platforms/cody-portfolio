"use client";

import { useState } from "react";
import { useWidth } from "./useWidth";

/**
 * Neo Financial attribution: how UTM tracking and one attribution model
 * replaced each platform's own report, and what CAC and PAC visibility changed. The chart is
 * illustrative: generic channels and made-up numbers that show the pattern,
 * not Neo's data. BRAND.md section 6, architecture diagram and data panel.
 */
const flow = [
  {
    name: "Platform reports",
    marker: "bg-data-4",
    lines: ["Search, social, video, audio, affiliates", "Each platform credits itself"],
  },
  {
    name: "UTMs everywhere",
    marker: "bg-data-2",
    lines: ["Every campaign link tagged", "Each customer traced to a channel"],
  },
  {
    name: "One attribution model",
    marker: "bg-data-3",
    lines: ["Databricks and dbt, run by Airflow", "One definition of a conversion"],
  },
  {
    name: "CAC, PAC and LTV",
    marker: "bg-data-1",
    lines: ["By channel and by product", "Synced back to ad tools and the CRM"],
  },
];

type View = "platform" | "model";
type Channel = { id: string; spend: number; platform: [number, number]; model: [number, number] };

// Illustrative values: [CAC $, LTV $].
const channels: Channel[] = [
  { id: "A", spend: 9, platform: [38, 230], model: [62, 205] },
  { id: "B", spend: 7, platform: [55, 175], model: [48, 245] },
  { id: "C", spend: 6, platform: [30, 150], model: [78, 140] },
  { id: "D", spend: 5, platform: [88, 205], model: [66, 262] },
  { id: "E", spend: 4, platform: [62, 160], model: [44, 172] },
];

const PAD = { l: 64, r: 16, t: 16, b: 40 };

function Chart() {
  const [view, setView] = useState<View>("platform");
  const [box, W] = useWidth<HTMLDivElement>(560);
  const H = Math.round(Math.min(360, Math.max(260, W * 0.6)));
  const x = (cac: number) => PAD.l + (cac / 100) * (W - PAD.l - PAD.r);
  const y = (ltv: number) => H - PAD.b - (ltv / 300) * (H - PAD.t - PAD.b);
  const dot = Math.max(0.75, Math.min(1, W / 560));
  return (
    <div className="rounded-md border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Where each channel lands</p>
        <div role="radiogroup" aria-label="View" className="flex gap-2">
          {(
            [
              ["platform", "Platform-reported"],
              ["model", "One attribution model"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className="min-h-11 rounded-md border border-border px-3 text-sm transition-colors aria-checked:border-text aria-checked:bg-text aria-checked:text-bg"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={box} className="mt-4">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block"
          role="img"
          aria-label={`Illustrative chart of customer acquisition cost against lifetime value for five illustrative channels, ${
            view === "platform" ? "as each platform reports them" : "under one attribution model"
          }.`}
        >
          {/* Axes and grid */}
          {[0, 100, 200, 300].map((v) => (
            <g key={`y${v}`}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--color-border)" />
              <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="fill-text-muted text-xs">
                ${v}
              </text>
            </g>
          ))}
          {[0, 25, 50, 75, 100].map((v) => (
            <text
              key={`x${v}`}
              x={x(v)}
              y={H - PAD.b + 18}
              textAnchor="middle"
              className="fill-text-muted text-xs"
            >
              ${v}
            </text>
          ))}
          <text x={(W + PAD.l) / 2} y={H - 4} textAnchor="middle" className="fill-text-muted text-xs">
            Cost to acquire a customer (CAC) →
          </text>
          <text
            transform={`translate(12 ${(H - PAD.b + PAD.t) / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-text-muted text-xs"
          >
            Lifetime value (LTV) →
          </text>

          {/* Payback line: LTV = 3 × CAC */}
          <line
            x1={x(0)}
            y1={y(0)}
            x2={x(100)}
            y2={y(300)}
            stroke="var(--color-text-muted)"
            strokeDasharray="4 4"
          />
          <text x={x(44)} y={y(96)} className="fill-text-muted text-xs">
            3 to 1 LTV to CAC
          </text>
          <text x={x(4)} y={y(285)} className="fill-text-muted text-xs">
            Invest more
          </text>
          <text x={x(96)} y={y(20)} textAnchor="end" className="fill-text-muted text-xs">
            Fix or cut
          </text>

          {channels.map((c) => {
            const [cac, ltv] = view === "platform" ? c.platform : c.model;
            const good = ltv >= 3 * cac;
            return (
              <g
                key={c.id}
                style={{
                  transform: `translate(${x(cac)}px, ${y(ltv)}px)`,
                  transition: "transform var(--duration-base) var(--ease-standard)",
                }}
              >
                <circle
                  r={c.spend * 2.2 * dot}
                  fill={good ? "var(--color-data-1)" : "var(--color-data-2)"}
                  fillOpacity={0.85}
                />
                <text y={4} textAnchor="middle" className="fill-on-accent text-xs font-semibold">
                  {c.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-sm text-text-muted">
        {view === "platform"
          ? "As each platform reports it, every channel looks fine. Channel C looks cheapest."
          : "With one model, C costs far more than it claimed. B and D earn their budget."}
      </p>
      <p className="meta mt-2">Illustrative. Channel names and numbers are made up to show the pattern.</p>
    </div>
  );
}

export function NeoAttribution() {
  return (
    <figure className="diagram my-8 space-y-4">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {flow.map((s, i) => (
          <li key={s.name} className="relative rounded-md border border-border bg-surface p-4">
            <span aria-hidden className={`block h-1 w-8 rounded-full ${s.marker}`} />
            <p className="mt-3 font-semibold">{s.name}</p>
            <ul className="mt-2 text-sm text-text-muted">
              {s.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {i < flow.length - 1 && (
              <span aria-hidden className="absolute -right-3 top-6 hidden text-text-muted lg:block">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <Chart />
    </figure>
  );
}
