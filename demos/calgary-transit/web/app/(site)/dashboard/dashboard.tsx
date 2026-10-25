"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InfoTip } from "@/components/info-tip";
import { Panel, PanelState } from "@/components/panel";
import { AXIS, C } from "@/components/charts/palette";
import { useQuery } from "@/lib/use-query";
import { fmtCompact, fmtDate, fmtMonth, fmtNumber, fmtPct } from "@/lib/format";

const BASELINE = 2019;
const TITLE = "Calgary Transit: is the rider experience keeping up?";

type Annual = { year: number; trips: number; service_hours: number; feedback: number; months: number };

const Q_ANNUAL = `
select year,
       sum(trips) as trips,
       sum(service_hours) as service_hours,
       sum(rider_feedback_311) as feedback,
       count(*) filter (where has_ridership_data) as months
from transit_monthly_kpis
group by year
order by year`;

const Q_MONTHLY = `
select month, trips
from transit_monthly_kpis
where has_ridership_data
order by month`;

const Q_FRESHNESS = `
select domain, latest_data_date, freshness_status
from data_contract_status
order by domain`;

const pct = (a: number, b: number) => (a / b) * 100;

export function Dashboard() {
  const { rows, error } = useQuery<Annual>(Q_ANNUAL);
  const complete = useMemo(() => (rows ?? []).filter((r) => r.months === 12), [rows]);
  const now = complete[complete.length - 1];
  const base = complete.find((r) => r.year === BASELINE);

  if (!now || !base) {
    return (
      <div className="space-y-6">
        <h1 className="mt-1 text-3xl font-bold">{TITLE}</h1>
        <PanelState error={error} height={160} />
      </div>
    );
  }

  const rate = (r: Annual) => (r.feedback * 100000) / r.trips;
  const baseMonthly = base.trips / 12;

  return (
    <div className="space-y-6">
      <div className="mt-1 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{TITLE}</h1>
        <InfoTip label="About these numbers">
          <strong>
            {now.year} vs {BASELINE}, before the pandemic:
          </strong>{" "}
          riders are back to {fmtPct(pct(now.trips, base.trips))} of {BASELINE}, and rider feedback per trip is up{" "}
          {fmtPct(pct(rate(now), rate(base)) - 100)}, like for like. Every number is a live query on the governed tables the
          AI agent also uses.
        </InfoTip>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Tile label={`Trips in ${now.year}`} value={fmtCompact(now.trips)} note={`${fmtPct(pct(now.trips, base.trips))} of ${BASELINE}`} />
        <Tile
          label="Service hours"
          value={fmtCompact(now.service_hours)}
          note={`${fmtPct(pct(now.service_hours, base.service_hours))} of ${BASELINE}`}
        />
        <Tile
          label="Feedback per 100k trips"
          value={fmtNumber(rate(now), 1)}
          note={`${fmtNumber(rate(base), 1)} in ${BASELINE}, like for like`}
          alert
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Recovery baseline={baseMonthly} />
        <FeedbackChange year={now.year} />
      </div>

      <Freshness />
    </div>
  );
}

function Tile({ label, value, note, alert }: { label: string; value: string; note: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border-l-4 bg-cgy-paper p-3 sm:p-5 ${alert ? "border-cgy-orange" : "border-cgy-red"}`}>
      <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-cgy-grey sm:text-xs">{label}</p>
      <p className="tabular mt-1 text-2xl font-bold text-cgy-slate sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs text-cgy-charcoal sm:text-sm">{note}</p>
    </div>
  );
}

function Recovery({ baseline }: { baseline: number }) {
  const { rows, error } = useQuery<{ month: string; trips: number }>(Q_MONTHLY);
  return (
    <Panel
      title="Riders are back"
      subtitle={`Monthly trips. The dashed line is the ${BASELINE} monthly average.`}
      source="transit_monthly_kpis"
    >
      {!rows ? (
        <PanelState error={error} height={300} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="month" {...AXIS} tickFormatter={(m: string) => m.slice(0, 4)} interval="preserveStartEnd" minTickGap={40} />
            <YAxis {...AXIS} tickFormatter={(v: number) => fmtCompact(v)} width={48} />
            <Tooltip labelFormatter={(m) => fmtMonth(String(m))} formatter={(v) => [fmtNumber(Number(v)), "Trips"]} />
            <ReferenceLine y={baseline} stroke={C.grey} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="trips" stroke={C.red} dot={false} strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

function FeedbackChange({ year }: { year: number }) {
  const sql = `
select service_category,
       sum(requests) filter (where year = ${BASELINE}) as before,
       sum(requests) filter (where year = ${year}) as after
from service_requests_monthly
where department = 'Calgary Transit' and comparable_across_years and year in (${BASELINE}, ${year})
group by service_category
order by after desc nulls last
limit 5`;
  const { rows, error } = useQuery<{ service_category: string; before: number; after: number }>(sql);
  return (
    <Panel
      title="What riders contact 311 about"
      subtitle="Top five categories. Lost Property is left out: it moved into 311 in 2021, which made complaints look 43% higher."
      source="service_requests_monthly"
    >
      {!rows ? (
        <PanelState error={error} height={300} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={C.line} horizontal={false} />
            <XAxis type="number" {...AXIS} tickFormatter={(v: number) => fmtCompact(v)} />
            <YAxis type="category" dataKey="service_category" {...AXIS} width={150} interval={0} />
            <Tooltip
              formatter={(v, name) => [fmtNumber(Number(v)), name]}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload as { before?: number; after?: number } | undefined;
                return p?.before ? `${label} · ${fmtPct(pct(p.after ?? 0, p.before) - 100)} change` : String(label);
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="before" name={String(BASELINE)} fill={C.silver} radius={[0, 2, 2, 0]} />
            <Bar dataKey="after" name={String(year)} fill={C.red} radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

function Freshness() {
  const { rows } = useQuery<{ domain: string; latest_data_date: string; freshness_status: string }>(Q_FRESHNESS);
  if (!rows) return null;
  return (
    <p className="text-sm text-cgy-grey">
      <span className="font-semibold text-cgy-charcoal">How current: </span>
      {rows.map((r, i) => (
        <span key={r.domain}>
          {i > 0 && " · "}
          {r.domain} to {fmtDate(r.latest_data_date)}
          {r.freshness_status !== "Meeting target" && " (behind target)"}
        </span>
      ))}
      . Checked against the data contract on every daily run.
    </p>
  );
}
