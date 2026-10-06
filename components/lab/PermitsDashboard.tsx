"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { BarChart, RankBars, formatNumber } from "./charts";
import { QueryCard } from "./QueryCard";
import { Segmented, Stat } from "./controls";
import { useQuery } from "./useQuery";
import type { Row } from "./db";

const YEARS = Array.from({ length: 12 }, (_, i) => 2015 + i);
const CURRENT_YEAR = 2026;

const TYPES = [
  { value: "all", label: "All housing" },
  { value: "Apartment", label: "Apartments" },
  { value: "Single Family", label: "Single family" },
  { value: "Townhouse", label: "Townhouses" },
  { value: "Two Family", label: "Semi and duplex" },
] as const;

type TypeValue = (typeof TYPES)[number]["value"];

function typeFilter(t: TypeValue) {
  return t === "all" ? "" : `AND class_group = '${t}'`;
}

const num = (r: Row | undefined, k: string) => Number(r?.[k] ?? 0);
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function PermitsDashboard() {
  const [year, setYear] = useState(2025);
  const [type, setType] = useState<TypeValue>("all");
  const tf = typeFilter(type);

  const byYearSql = `
SELECT year(issued_date) AS year,
       sum(housing_units) AS units,
       count(*) FILTER (WHERE housing_units > 0) AS permits
FROM permits
WHERE issued_date IS NOT NULL
  AND work_group = 'New' ${tf}
GROUP BY 1
ORDER BY 1`;

  const daysSql = `
SELECT year(applied_date) AS year,
       median(issued_date - applied_date) AS median_days
FROM permits
WHERE issued_date IS NOT NULL
  AND work_group = 'New'
  AND permit_class = 'Residential' ${tf}
GROUP BY 1
ORDER BY 1`;

  const communitiesSql = `
SELECT community,
       sum(housing_units) AS units
FROM permits
WHERE year(issued_date) = ${year}
  AND work_group = 'New' ${tf}
  AND community IS NOT NULL
GROUP BY 1
ORDER BY units DESC
LIMIT 10`;

  const mapSql = `
SELECT lon, lat, housing_units AS units
FROM permits
WHERE year(issued_date) = ${year}
  AND work_group = 'New'
  AND housing_units > 0
  AND lat > 50 ${tf}`;

  const byYear = useQuery(byYearSql, "permits: units by year");
  const days = useQuery(daysSql, "permits: days to issue");
  const communities = useQuery(communitiesSql, "permits: top communities");
  const map = useQuery(mapSql, "permits: map points");

  const yearRow = byYear.rows.find((r) => r.year === year);
  const prevRow = byYear.rows.find((r) => r.year === year - 1);
  const daysRow = days.rows.find((r) => r.year === year);
  const partial = year === CURRENT_YEAR;
  // A partial year against a full one would mislead, so skip the comparison.
  const change =
    !partial && prevRow && yearRow ? (num(yearRow, "units") / num(prevRow, "units") - 1) * 100 : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Housing type"
          options={TYPES}
          value={type}
          onChange={(v) => {
            setType(v);
            track("lab_filter_changed", { dataset: "permits", control: "housing_type", value: v });
          }}
        />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Year</span>
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              track("lab_filter_changed", { dataset: "permits", control: "year", value: e.target.value });
            }}
            className="border border-line bg-surface px-2 py-1.5 font-mono text-sm"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y === CURRENT_YEAR ? `${y} (to date)` : y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="grid grid-cols-2 border-l border-t border-line lg:grid-cols-4">
        <Stat
          label={`New housing units permitted, ${year}${partial ? " to date" : ""}`}
          value={formatNumber(num(yearRow, "units"))}
        />
        <Stat
          label={partial ? "Change vs last year: year in progress" : `Change vs ${year - 1}`}
          value={change == null ? "–" : `${change > 0 ? "+" : ""}${change.toFixed(0)}%`}
        />
        <Stat
          label="Median days, application to issue"
          value={daysRow ? String(Math.round(num(daysRow, "median_days"))) : "–"}
        />
        <Stat label="Permits that added homes" value={formatNumber(num(yearRow, "permits"))} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <QueryCard
          dataset="permits"
          title="New housing units permitted, by year"
          subtitle={`Selected year highlighted. ${CURRENT_YEAR} is year to date.`}
          sql={byYearSql}
          {...byYear}
        >
          <BarChart
            data={byYear.rows.map((r) => ({ label: String(r.year), value: num(r, "units") }))}
            highlight={(d) => d.label === String(year)}
            summary="Bar chart of new housing units permitted in Calgary each year since 2015."
          />
        </QueryCard>

        <QueryCard
          dataset="permits"
          title="Median days from application to permit"
          subtitle="New residential permits, by year applied. Recent years read low: slow permits aren't issued yet."
          sql={daysSql}
          {...days}
        >
          <BarChart
            data={days.rows.map((r) => ({ label: String(r.year), value: num(r, "median_days") }))}
            highlight={(d) => d.label === String(year)}
            color="var(--ink)"
            formatValue={(n) => `${Math.round(n)}d`}
            summary="Bar chart of median days between application and issue for new residential permits, by year."
          />
        </QueryCard>

        <QueryCard
          dataset="permits"
          title={`Where the units are, ${year}`}
          subtitle="Each dot is a permit. Bigger dots, more units."
          sql={mapSql}
          {...map}
        >
          <DotMap rows={map.rows} />
        </QueryCard>

        <QueryCard
          dataset="permits"
          title={`Top communities, ${year}`}
          subtitle="New housing units permitted."
          sql={communitiesSql}
          {...communities}
        >
          <RankBars
            data={communities.rows.map((r) => ({
              label: titleCase(String(r.community)),
              value: num(r, "units"),
            }))}
            summary={`Top 10 Calgary communities by new housing units permitted in ${year}.`}
          />
        </QueryCard>
      </div>
    </div>
  );
}

/** Canvas scatter of permit locations. Canvas, not SVG, because a year can hold 10,000+ points. */
function DotMap({ rows }: { rows: Row[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Fixed bounds for the city so the map doesn't jump between years.
  const bounds = useMemo(() => ({ minLon: -114.32, maxLon: -113.86, minLat: 50.84, maxLat: 51.22 }), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    // Correct for longitude compression at Calgary's latitude (~cos 51°).
    const aspect = (bounds.maxLat - bounds.minLat) / ((bounds.maxLon - bounds.minLon) * 0.63) || 1;
    const h = Math.round(w * aspect);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const accent = getComputedStyle(canvas).getPropertyValue("--accent").trim() || "#c2410c";
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.45;
    for (const r of rows) {
      const x = ((Number(r.lon) - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * w;
      const y = (1 - (Number(r.lat) - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * h;
      const radius = Math.min(1.2 + Math.sqrt(Number(r.units)) * 0.9, 9);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [rows, bounds]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Map of ${rows.length.toLocaleString()} Calgary permits that created housing units.`}
      className="mx-auto block w-full max-w-[26rem]"
    />
  );
}
