"use client";

import { useWidth } from "./useWidth";

/**
 * Canucks Sports & Entertainment: how the BI team turned four properties'
 * data into sales, pricing and timing decisions, and the revenue
 * seasons it supported, shown as growth only: 15%, then 11%, 27% in all.
 * Bars are indexed to the starting season.
 */
const flow = [
  {
    name: "Sources",
    marker: "bg-data-4",
    lines: ["Ticketing", "Memberships", "Marketing campaigns", "CRM: HubSpot, then Salesforce"],
  },
  {
    name: "One warehouse",
    marker: "bg-data-2",
    lines: ["Microsoft Fabric, as an early customer", "Canucks, Abbotsford, Warriors and the arena"],
  },
  {
    name: "Reporting",
    marker: "bg-data-3",
    lines: ["Automated reports in Power BI", "Machine learning models", "SQL and Python"],
  },
  {
    name: "Decisions",
    marker: "bg-data-1",
    lines: ["Who to call, and when", "How to price", "When to react"],
  },
];

const seasons = [
  { label: "Starting season", value: 100, text: "Baseline", growth: null },
  { label: "Next season", value: 115, text: "+15%", growth: null },
  { label: "Season after", value: 127, text: "+27%", growth: "+11%" },
];

const PAD = { t: 28, b: 44 };

function RevenueChart() {
  const [box, W] = useWidth<HTMLDivElement>(520);
  const H = 240;
  const BAR = Math.min(120, Math.round(W / 5));
  const scale = (v: number) => (v / 135) * (H - PAD.t - PAD.b);
  const gap = (W - BAR * seasons.length) / (seasons.length + 1);
  return (
    <div className="rounded-md border border-border bg-surface p-4 sm:p-6">
      <p className="font-semibold">Revenue across two seasons</p>
      <div ref={box} className="mt-4">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block"
          role="img"
          aria-label="Revenue grew 15% in the first season and 11% in the next, 27% above the starting season."
        >
          <line x1={0} x2={W} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--color-border)" />
          {seasons.map((s, i) => {
            const bx = gap + i * (BAR + gap);
            const h = scale(s.value);
            const top = H - PAD.b - h;
            return (
              <g key={s.label}>
                <rect
                  x={bx}
                  y={top}
                  width={BAR}
                  height={h}
                  rx={4}
                  fill={i === seasons.length - 1 ? "var(--color-data-1)" : "var(--color-data-4)"}
                />
                <text x={bx + BAR / 2} y={top - 8} textAnchor="middle" className="fill-text text-sm">
                  {s.text}
                </text>
                {s.growth && (
                  <text
                    x={bx + BAR / 2}
                    y={top + 20}
                    textAnchor="middle"
                    className="fill-on-accent text-xs font-semibold"
                  >
                    {s.growth}
                  </text>
                )}
                <text
                  x={bx + BAR / 2}
                  y={H - PAD.b + 20}
                  textAnchor="middle"
                  className="fill-text-muted text-xs"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-sm text-text-muted">
        Up 15% in the first season and 11% in the next: 27% above the start. The BI team’s pricing,
        forecasting and membership analysis supported it.
      </p>
    </div>
  );
}

export function CanucksRevenue() {
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
      <RevenueChart />
    </figure>
  );
}
