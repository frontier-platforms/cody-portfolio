"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { LineChart, RankBars } from "./charts";
import { QueryCard } from "./QueryCard";
import { RinkHalf } from "./Rink";
import { Segmented, Stat } from "./controls";
import { useQuery } from "./useQuery";
import type { Row } from "./db";

const FULL_SEASON = 82;

const SIDES = [
  { value: "CGY", label: "Flames shooting" },
  { value: "OPP", label: "Opponents shooting" },
] as const;

const STRENGTHS = [
  { value: "all", label: "All" },
  { value: "5v5", label: "5 on 5" },
  { value: "PP", label: "Power play" },
] as const;

type Side = (typeof SIDES)[number]["value"];
type Strength = (typeof STRENGTHS)[number]["value"];

const num = (r: Row | undefined, k: string) => Number(r?.[k] ?? 0);

export function FlamesDashboard() {
  // Seasons come from the data, so a live pipeline run can add the one in progress.
  const seasonsSql = `
SELECT season, count(*) AS games
FROM flames_games
GROUP BY 1
ORDER BY 1`;
  const seasonRows = useQuery(seasonsSql, "flames: seasons").rows;
  const seasons = seasonRows.map((r) => ({ id: String(r.season), games: num(r, "games") }));
  // Default to the latest complete season; a handful of games makes a thin shot map.
  const defaultSeason = [...seasons].reverse().find((s) => s.games >= FULL_SEASON)?.id ?? seasons.at(-1)?.id;

  const [picked, setPicked] = useState<string | null>(null);
  const season = picked ?? defaultSeason ?? "2025-26";
  const [side, setSide] = useState<Side>("CGY");
  const [strength, setStrength] = useState<Strength>("all");
  const filter = (control: string, value: string) =>
    track("lab_filter_changed", { dataset: "flames", control, value });
  const strengthFilter = strength === "all" ? "" : `AND s.strength = '${strength}'`;

  const recordSql = `
SELECT count(*) FILTER (WHERE result = 'W')   AS w,
       count(*) FILTER (WHERE result = 'L')   AS l,
       count(*) FILTER (WHERE result = 'OTL') AS otl,
       sum(points)        AS pts,
       sum(goals_for)     AS gf,
       sum(goals_against) AS ga
FROM flames_games
WHERE season = '${season}'`;

  const paceSql = `
SELECT season,
       row_number() OVER (PARTITION BY season ORDER BY game_date) AS game,
       sum(points) OVER (PARTITION BY season ORDER BY game_date) AS points
FROM flames_games
ORDER BY season, game`;

  const shotsSql = `
SELECT s.x, s.y, s.is_goal
FROM flames_shots s
JOIN flames_games g USING (game_id)
WHERE g.season = '${season}'
  AND s.team = '${side}'
  AND s.event <> 'blocked-shot' ${strengthFilter}`;

  const scorersSql = `
SELECT s.shooter,
       count(*) FILTER (WHERE s.is_goal) AS goals,
       count(*) FILTER (WHERE s.event IN ('goal', 'shot-on-goal')) AS shots
FROM flames_shots s
JOIN flames_games g USING (game_id)
WHERE g.season = '${season}'
  AND s.team = 'CGY'
  AND s.shooter IS NOT NULL ${strengthFilter}
GROUP BY 1
ORDER BY goals DESC, shots DESC
LIMIT 8`;

  const record = useQuery(recordSql, "flames: season record");
  const pace = useQuery(paceSql, "flames: points pace");
  const shots = useQuery(shotsSql, "flames: shot map");
  const scorers = useQuery(scorersSql, "flames: top scorers");

  const r = record.rows[0];
  const goals = shots.rows.filter((s) => s.is_goal);
  const shPct = shots.rows.length ? (goals.length / shots.rows.length) * 100 : 0;

  // Draw the selected season last so it sits on top.
  const series = [...seasons.map((x) => x.id).filter((s) => s !== season), season].map((s) => ({
    name: s,
    color: s === season ? "var(--color-data-2)" : "var(--color-data-4)",
    width: s === season ? 2.5 : 1,
    points: pace.rows.filter((p) => p.season === s).map((p) => ({ x: num(p, "game"), y: num(p, "points") })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label="Season"
          options={seasons.map((s) => ({
            value: s.id,
            label: s.games < FULL_SEASON ? `${s.id} · ${s.games} GP` : s.id,
          }))}
          value={season}
          onChange={(v) => {
            setPicked(v);
            filter("season", v);
          }}
        />
        <Segmented
          label="Strength"
          options={STRENGTHS}
          value={strength}
          onChange={(v) => {
            setStrength(v);
            filter("strength", v);
          }}
        />
      </div>

      <dl className="grid grid-cols-2 border-l border-t border-border lg:grid-cols-4">
        <Stat label="Record (W-L-OTL)" value={r ? `${num(r, "w")}-${num(r, "l")}-${num(r, "otl")}` : "…"} />
        <Stat label="Points" value={r ? String(num(r, "pts")) : "…"} />
        <Stat label="Goals for" value={r ? String(num(r, "gf")) : "…"} />
        <Stat label="Goals against" value={r ? String(num(r, "ga")) : "…"} />
      </dl>

      <div className="grid gap-4 lg:grid-cols-5">
        <QueryCard
          dataset="flames"
          className="lg:col-span-3"
          title="Shot map"
          subtitle={`${shots.rows.length.toLocaleString()} unblocked attempts, ${goals.length} goals (${shPct.toFixed(1)}%). Goals highlighted.`}
          sql={shotsSql}
          {...shots}
        >
          <Segmented
            label="Shooting team"
            options={SIDES}
            value={side}
            onChange={(v) => {
              setSide(v);
              filter("shooting_team", v);
            }}
          />
          <svg
            viewBox="-1 -43.5 102 87"
            className="mt-3 h-auto w-full"
            role="img"
            aria-label={`Shot map: ${shots.rows.length} attempts and ${goals.length} goals for ${side === "CGY" ? "the Flames" : "opponents"} in ${season}.`}
          >
            <RinkHalf>
              {shots.rows
                .filter((s) => !s.is_goal && num(s, "x") >= 0)
                .map((s, i) => (
                  <circle
                    key={i}
                    cx={num(s, "x")}
                    cy={-num(s, "y")}
                    r={0.55}
                    fill="var(--color-data-4)"
                    fillOpacity={0.28}
                  />
                ))}
              {goals
                .filter((s) => num(s, "x") >= 0)
                .map((s, i) => (
                  <circle
                    key={`g${i}`}
                    cx={num(s, "x")}
                    cy={-num(s, "y")}
                    r={0.95}
                    fill={side === "CGY" ? "var(--color-data-2)" : "var(--color-data-1)"}
                    fillOpacity={0.85}
                  />
                ))}
            </RinkHalf>
          </svg>
        </QueryCard>

        <QueryCard
          dataset="flames"
          className="lg:col-span-2"
          title="Top Flames goal scorers"
          subtitle={season}
          sql={scorersSql}
          {...scorers}
        >
          <RankBars
            data={scorers.rows.map((s) => ({ label: String(s.shooter), value: num(s, "goals") }))}
            color="var(--color-data-2)"
            formatValue={(n) => `${n} G`}
            summary={`Top Flames goal scorers in ${season}.`}
          />
        </QueryCard>
      </div>

      <QueryCard
        dataset="flames"
        title="Points pace"
        subtitle="Cumulative standings points by game. Selected season in red."
        sql={paceSql}
        {...pace}
      >
        <LineChart
          series={series}
          xLabel="game →"
          yLabel="points"
          summary={`Cumulative points by game for five Flames seasons, with ${season} highlighted.`}
        />
      </QueryCard>
    </div>
  );
}
