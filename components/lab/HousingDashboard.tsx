"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { BarChart, RankBars } from "./charts";
import { QueryCard } from "./QueryCard";
import { Segmented, Stat } from "./controls";
import type { Row } from "./db";
import { useQuery } from "./useQuery";

const GROUPS = [
  { value: "all", label: "All homes" },
  { value: "Detached", label: "Detached" },
  { value: "Duplex", label: "Duplex" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Condo apartment", label: "Condo" },
] as const;

type Group = (typeof GROUPS)[number]["value"];

const num = (r: Row | undefined, k: string) => Number(r?.[k] ?? 0);
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const money = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`;

export function HousingDashboard() {
  const [group, setGroup] = useState<Group>("Detached");
  const [order, setOrder] = useState<"top" | "bottom">("top");
  const where = group === "all" ? "TRUE" : `property_group = '${group}'`;

  const summarySql = `
SELECT median(assessed_value)                         AS median_value,
       count(*)                                       AS homes,
       median(year_built)                             AS median_year,
       avg((assessed_value >= 1000000)::INTEGER)      AS share_over_1m
FROM housing_homes
WHERE ${where}`;

  const decadeSql = `
SELECT (year_built // 10) * 10        AS decade,
       median(assessed_value)         AS median_value,
       count(*)                       AS homes
FROM housing_homes
WHERE ${where} AND year_built >= 1900
GROUP BY 1
HAVING count(*) >= 30
ORDER BY 1`;

  const communitySql = `
SELECT community,
       median(assessed_value) AS median_value,
       count(*)               AS homes
FROM housing_homes
WHERE ${where}
  AND community NOT LIKE 'RESIDUAL%'
GROUP BY 1
HAVING count(*) >= 50
ORDER BY median_value ${order === "top" ? "DESC" : "ASC"}
LIMIT 10`;

  const distributionSql = `
SELECT least(assessed_value // 100000, 20) * 100000 AS bucket,
       count(*)                                    AS homes
FROM housing_homes
WHERE ${where}
GROUP BY 1
ORDER BY 1`;

  const summary = useQuery(summarySql, "housing: summary");
  const decades = useQuery(decadeSql, "housing: value by decade built");
  const communities = useQuery(communitySql, "housing: communities");
  const distribution = useQuery(distributionSql, "housing: distribution");
  const s = summary.rows[0];
  // Both columns share one scale so bar lengths compare across them.
  const rankMax = Math.max(...communities.rows.map((r) => num(r, "median_value")), 1);

  return (
    <div className="space-y-4">
      <Segmented
        label="Home type"
        options={GROUPS}
        value={group}
        onChange={(v) => {
          setGroup(v);
          track("lab_filter_changed", { dataset: "housing", control: "home_type", value: v });
        }}
      />

      <dl className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-4">
        <Stat label="Median assessed value" value={s ? money(num(s, "median_value")) : "…"} />
        <Stat label="Homes" value={s ? num(s, "homes").toLocaleString() : "…"} />
        <Stat label="Median year built" value={s ? String(Math.round(num(s, "median_year"))) : "…"} />
        <Stat
          label="Assessed at $1M or more"
          value={s ? `${(num(s, "share_over_1m") * 100).toFixed(1)}%` : "…"}
        />
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <QueryCard
          dataset="housing"
          title="Median value by decade built"
          subtitle="Median assessed value of homes built in each decade."
          sql={decadeSql}
          {...decades}
        >
          <BarChart
            data={decades.rows.map((r) => ({ label: `${num(r, "decade")}s`, value: num(r, "median_value") }))}
            formatValue={money}
            summary="Bar chart of median assessed value by decade of construction."
          />
        </QueryCard>

        <QueryCard
          dataset="housing"
          title="How values are spread"
          subtitle="Homes per $100K band. The last bar is $2M and up."
          sql={distributionSql}
          {...distribution}
        >
          <BarChart
            data={distribution.rows.map((r) => ({
              label: num(r, "bucket") >= 2e6 ? "$2M+" : money(num(r, "bucket")),
              value: num(r, "homes"),
            }))}
            color="var(--color-data-3)"
            summary="Histogram of homes by assessed value in $100,000 bands."
          />
        </QueryCard>

        <QueryCard
          dataset="housing"
          title={order === "top" ? "Highest median value" : "Most affordable"}
          subtitle="Named communities with at least 50 homes of this type. The City’s unnamed residual sub-areas are left out."
          sql={communitySql}
          className="lg:col-span-2"
          {...communities}
        >
          <Segmented
            label="Ranking"
            options={[
              { value: "top", label: "Highest" },
              { value: "bottom", label: "Most affordable" },
            ]}
            value={order}
            onChange={(v) => {
              setOrder(v);
              track("lab_filter_changed", { dataset: "housing", control: "ranking", value: v });
            }}
          />
          <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
            <RankBars
              data={communities.rows.slice(0, 5).map((r) => ({
                label: titleCase(String(r.community)),
                value: num(r, "median_value"),
              }))}
              formatValue={money}
              max={rankMax}
              summary="Communities ranked by median assessed value, first five."
            />
            <RankBars
              data={communities.rows.slice(5).map((r) => ({
                label: titleCase(String(r.community)),
                value: num(r, "median_value"),
              }))}
              formatValue={money}
              max={rankMax}
              summary="Communities ranked by median assessed value, next five."
            />
          </div>
        </QueryCard>
      </div>
    </div>
  );
}
