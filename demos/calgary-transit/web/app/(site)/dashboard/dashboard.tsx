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
import { Panel, PanelState } from "@/components/panel";
import { AXIS, C, RIDER_GROUP_COLOURS } from "@/components/charts/palette";
import { useQuery } from "@/lib/use-query";
import { fmtCompact, fmtDate, fmtMonth, fmtNumber, fmtPct, titleCase } from "@/lib/format";

const BASELINE = 2019;

type Annual = {
  year: number;
  trips: number;
  boardings: number;
  service_hours: number;
  feedback: number;
  months_with_ridership: number;
};

const Q_ANNUAL = `
select year,
       sum(trips) as trips,
       sum(boardings) as boardings,
       sum(service_hours) as service_hours,
       sum(rider_feedback_311) as feedback,
       count(*) filter (where has_ridership_data) as months_with_ridership
from transit_monthly_kpis
group by year
order by year`;

const Q_MONTHLY = `
select month, trips, boardings
from transit_monthly_kpis
where has_ridership_data
order by month`;

const Q_FARE_MIX = `
with complete_years as (
    select year from transit_monthly_kpis group by year having count(*) filter (where has_ridership_data) = 12
)
select year, rider_group, sum(trips) as trips
from ridership_by_fare_product
where year >= 2014 and year in (select year from complete_years)
group by year, rider_group
order by year`;

const pct = (a: number, b: number) => (a / b) * 100;

export function Dashboard() {
  const { rows, error } = useQuery<Annual>(Q_ANNUAL);
  const complete = useMemo(() => (rows ?? []).filter((r) => r.months_with_ridership === 12), [rows]);
  const current = complete[complete.length - 1];
  const base = complete.find((r) => r.year === BASELINE);

  if (!rows || !current || !base) {
    return (
      <div className="mt-8">
        <PanelState error={error} height={160} />
      </div>
    );
  }

  const feedbackRate = (r: Annual) => (r.feedback * 100000) / r.trips;
  const perHour = (r: Annual) => r.trips / r.service_hours;
  const feedbackChange = pct(feedbackRate(current), feedbackRate(base)) - 100;

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-lg bg-cgy-navy p-5 text-white sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
          {current.year} compared with {BASELINE}, before the pandemic
        </p>
        <p className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">
          Riders are back to {fmtPct(pct(current.trips, base.trips))} of {BASELINE} on{" "}
          {fmtPct(pct(current.service_hours, base.service_hours))} of the service. Rider feedback per trip is up{" "}
          {fmtPct(feedbackChange)}, like for like.
        </p>
        <p className="mt-2 text-sm text-white/70">
          The question for service planning: what are riders contacting 311 about more often, and where?
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={`Trips in ${current.year}`} value={fmtCompact(current.trips)} note={`${fmtPct(pct(current.trips, base.trips))} of ${BASELINE}`} />
        <Tile
          label="Service hours"
          value={fmtCompact(current.service_hours)}
          note={`${fmtPct(pct(current.service_hours, base.service_hours))} of ${BASELINE}`}
        />
        <Tile
          label="Trips per service hour"
          value={fmtNumber(perHour(current), 1)}
          note={`${fmtNumber(perHour(base), 1)} in ${BASELINE}`}
        />
        <Tile
          label="Rider feedback per 100k trips"
          value={fmtNumber(feedbackRate(current), 1)}
          note={`${fmtNumber(feedbackRate(base), 1)} in ${BASELINE} · like for like`}
          alert
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <RidershipTrend className="lg:col-span-3" />
        <Productivity annual={complete} className="lg:col-span-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FeedbackChange year={current.year} />
        <Communities year={current.year} />
      </div>

      <FareMix />
      <ContractStrip />
    </div>
  );
}

function Tile({ label, value, note, alert }: { label: string; value: string; note: string; alert?: boolean }) {
  return (
    <div className={`rounded-lg border-l-4 bg-cgy-paper p-4 ${alert ? "border-cgy-orange" : "border-cgy-red"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">{label}</p>
      <p className="tabular mt-1 text-3xl font-bold text-cgy-navy">{value}</p>
      <p className="mt-1 text-xs text-cgy-charcoal">{note}</p>
    </div>
  );
}

function RidershipTrend({ className }: { className?: string }) {
  const { rows, error } = useQuery<{ month: string; trips: number; boardings: number }>(Q_MONTHLY);
  return (
    <Panel
      className={className}
      title="Riders are back: monthly trips and boardings"
      subtitle="Trips count a journey once; boardings count every vehicle boarded. Both are published as “ridership”, so they're kept as separate measures."
      source="transit_monthly_kpis"
    >
      {!rows ? (
        <PanelState error={error} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="month" {...AXIS} tickFormatter={(m: string) => m.slice(0, 4)} interval="preserveStartEnd" minTickGap={40} />
            <YAxis {...AXIS} tickFormatter={(v: number) => fmtCompact(v)} width={48} />
            <Tooltip labelFormatter={(m) => fmtMonth(String(m))} formatter={(v) => fmtNumber(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="boardings" name="Boardings" stroke={C.navy} dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="trips" name="Trips" stroke={C.red} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

function Productivity({ annual, className }: { annual: Annual[]; className?: string }) {
  const data = annual.map((r) => ({ year: r.year, perHour: Math.round((r.trips / r.service_hours) * 10) / 10 }));
  const base = data.find((d) => d.year === BASELINE)?.perHour;
  return (
    <Panel
      className={className}
      title="Service is back; productivity nearly"
      subtitle="Trips carried per hour of bus, CTrain and shuttle service. Complete years only."
      source="transit_monthly_kpis"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey="year" {...AXIS} tickFormatter={(y: number) => `’${String(y).slice(2)}`} />
          <YAxis {...AXIS} width={32} />
          <Tooltip formatter={(v) => [fmtNumber(Number(v), 1), "Trips per hour"]} />
          {base && <ReferenceLine y={base} stroke={C.grey} strokeDasharray="4 4" />}
          <Bar dataKey="perHour" fill={C.teal} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
having sum(requests) filter (where year = ${year}) > 0
order by after desc`;
  const { rows, error } = useQuery<{ service_category: string; before: number; after: number }>(sql);
  const height = Math.max(240, (rows?.length ?? 8) * 34);
  return (
    <Panel
      title={`What riders contact 311 about: ${BASELINE} vs ${year}`}
      subtitle="Like-for-like categories only. Lost Property moved into 311 in 2021, so it's excluded from comparisons rather than read as growth."
      source="service_requests_monthly"
    >
      {!rows ? (
        <PanelState error={error} height={height} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barGap={1}>
            <CartesianGrid stroke={C.line} horizontal={false} />
            <XAxis type="number" {...AXIS} tickFormatter={(v: number) => fmtCompact(v)} />
            <YAxis type="category" dataKey="service_category" {...AXIS} width={170} interval={0} />
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

function Communities({ year }: { year: number }) {
  const sql = `
select community_name,
       sum(requests) filter (where year = ${year}) as requests,
       sum(requests) filter (where year = ${BASELINE}) as before
from service_requests_by_community
where year in (${BASELINE}, ${year})
group by community_name
having sum(requests) filter (where year = ${year}) > 0
order by requests desc
limit 10`;
  const { rows, error } = useQuery<{ community_name: string; requests: number; before: number | null }>(sql);
  const max = rows?.[0]?.requests ?? 1;
  return (
    <Panel
      title={`Where requests come from (${year})`}
      subtitle="Top communities by transit 311 requests. About a quarter of requests have no community recorded and are left out rather than guessed."
      source="service_requests_by_community"
    >
      {!rows ? (
        <PanelState error={error} />
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.community_name} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 text-sm">
              <span className="tabular text-cgy-grey">{i + 1}</span>
              <div>
                <p className="font-semibold text-cgy-navy">{titleCase(r.community_name)}</p>
                <div className="mt-1 h-1.5 rounded bg-cgy-mist">
                  <div className="h-1.5 rounded bg-cgy-blue" style={{ width: `${(r.requests / max) * 100}%` }} />
                </div>
              </div>
              <span className="tabular text-right">
                <span className="font-semibold">{fmtNumber(r.requests)}</span>
                <span className="block text-[11px] text-cgy-grey">{r.before ? `${fmtNumber(r.before)} in ${BASELINE}` : "–"}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function FareMix() {
  const { rows, error } = useQuery<{ year: number; rider_group: string; trips: number }>(Q_FARE_MIX);
  const { data, groups } = useMemo(() => {
    const totals = new Map<number, number>();
    for (const r of rows ?? []) totals.set(r.year, (totals.get(r.year) ?? 0) + r.trips);
    const byYear = new Map<number, Record<string, number>>();
    for (const r of rows ?? []) {
      const entry = byYear.get(r.year) ?? { year: r.year };
      entry[r.rider_group] = Math.round((r.trips / (totals.get(r.year) ?? 1)) * 1000) / 10;
      byYear.set(r.year, entry);
    }
    const present = new Set((rows ?? []).map((r) => r.rider_group));
    return { data: [...byYear.values()], groups: Object.keys(RIDER_GROUP_COLOURS).filter((g) => present.has(g)) };
  }, [rows]);

  return (
    <Panel
      title="Who rides: share of trips by rider group"
      subtitle="The City's fare breakdown never adds up to its own total. The gap is kept as an explicit “Unallocated” share, so every bar reconciles to official ridership."
      source="ridership_by_fare_product"
    >
      {!rows ? (
        <PanelState error={error} />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="year" {...AXIS} />
            <YAxis {...AXIS} unit="%" width={52} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} allowDataOverflow />
            <Tooltip formatter={(v, name) => [fmtPct(Number(v), 1), name]} />
            <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            {groups.map((g) => (
              <Bar key={g} dataKey={g} stackId="mix" fill={RIDER_GROUP_COLOURS[g]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

type Contract = {
  domain: string;
  freshness_status: string;
  latest_data_date: string;
  days_since_latest_data: number;
  freshness_target_days: number;
  incident_tier: string;
};

function ContractStrip() {
  const { rows, error } = useQuery<Contract>(`
select domain, freshness_status, latest_data_date, days_since_latest_data, freshness_target_days, incident_tier
from data_contract_status
order by incident_tier, domain`);
  return (
    <Panel
      title="How current is this?"
      subtitle="Every domain has an owner, a freshness target and an incident tier. When a feed is behind, the dashboard says so instead of hiding it."
      source="data_contract_status"
    >
      {!rows ? (
        <PanelState error={error} height={96} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map((r) => {
            const ok = r.freshness_status === "Meeting target";
            return (
              <div key={r.domain} className="rounded border border-cgy-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-cgy-navy">{r.domain}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${ok ? "bg-cgy-green" : "bg-cgy-orange"}`}>
                    {r.freshness_status}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  Data to <span className="font-semibold">{fmtDate(r.latest_data_date)}</span>
                </p>
                <p className="text-xs text-cgy-grey">
                  {fmtNumber(r.days_since_latest_data)} days old · target {fmtNumber(r.freshness_target_days)} days · {r.incident_tier}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
