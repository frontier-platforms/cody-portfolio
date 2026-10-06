import type { Pipeline } from "./types";

/**
 * Calgary Flames play-by-play.
 *
 *   NHL API ──extract──▶ raw_games, raw_plays, raw_roster ──▶ stg_games, stg_shots ──▶ flames_games, flames_shots
 *                         (bronze: flattened JSON)            (silver)                 (gold, served)
 *
 * Extraction only flattens the API's nested JSON. Every business rule (what
 * counts as a shot, strength, which net the shooter attacks) lives in SQL.
 */
export const TEAM = "CGY";
export const TEAM_ID = 20;
export const FIRST_SEASON = 2021;

/** Season ids from 2021-22 through the season in progress, e.g. "20262027". */
export function seasonIds(today = new Date()) {
  const current = today.getUTCMonth() >= 6 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  return Array.from(
    { length: current - FIRST_SEASON + 1 },
    (_, i) => `${FIRST_SEASON + i}${FIRST_SEASON + i + 1}`,
  );
}

export const flamesPipeline: Pipeline = {
  id: "flames",
  label: "Calgary Flames play-by-play",
  source: {
    name: "NHL public API · schedules and play-by-play",
    url: "https://api-web.nhle.com/v1",
    docs: "https://api-web.nhle.com/v1/club-schedule-season/CGY/now",
    licence: "Data © NHL. Used here for non-commercial illustration.",
  },
  sources: [
    {
      name: "raw_games",
      description: "Every game on the Flames schedule, including preseason and games not yet played.",
      columns: [
        { name: "game_id", type: "BIGINT" },
        { name: "season", type: "VARCHAR" },
        { name: "game_type", type: "INTEGER" },
        { name: "game_date", type: "VARCHAR" },
        { name: "game_state", type: "VARCHAR" },
        { name: "home_id", type: "INTEGER" },
        { name: "home_abbrev", type: "VARCHAR" },
        { name: "home_score", type: "INTEGER" },
        { name: "away_id", type: "INTEGER" },
        { name: "away_abbrev", type: "VARCHAR" },
        { name: "away_score", type: "INTEGER" },
        { name: "last_period_type", type: "VARCHAR" },
      ],
    },
    {
      name: "raw_plays",
      description: "Shot-attempt events from play-by-play, flattened to one row per event.",
      columns: [
        { name: "game_id", type: "BIGINT" },
        { name: "home_team_id", type: "INTEGER" },
        { name: "event_type", type: "VARCHAR" },
        { name: "period", type: "INTEGER" },
        { name: "period_type", type: "VARCHAR" },
        { name: "time_in_period", type: "VARCHAR" },
        { name: "situation_code", type: "VARCHAR" },
        { name: "home_defending_side", type: "VARCHAR" },
        { name: "x", type: "INTEGER" },
        { name: "y", type: "INTEGER" },
        { name: "owner_team_id", type: "INTEGER" },
        { name: "shot_type", type: "VARCHAR" },
        { name: "shooter_id", type: "BIGINT" },
      ],
    },
    {
      name: "raw_roster",
      description: "Players dressed for each game.",
      columns: [
        { name: "game_id", type: "BIGINT" },
        { name: "player_id", type: "BIGINT" },
        { name: "first_name", type: "VARCHAR" },
        { name: "last_name", type: "VARCHAR" },
      ],
    },
  ],
  models: [
    {
      name: "stg_games",
      layer: "silver",
      description: "Finished regular-season games, re-expressed from the Flames' side of the ice.",
      dependsOn: ["raw_games"],
      sql: `
SELECT
  game_id,
  substr(season, 1, 4) || '-' || substr(season, 7, 2)            AS season,
  CAST(game_date AS DATE)                                         AS game_date,
  home_id = ${TEAM_ID}                                            AS home,
  CASE WHEN home_id = ${TEAM_ID} THEN away_abbrev ELSE home_abbrev END AS opponent,
  CASE WHEN home_id = ${TEAM_ID} THEN home_score ELSE away_score END   AS goals_for,
  CASE WHEN home_id = ${TEAM_ID} THEN away_score ELSE home_score END   AS goals_against,
  COALESCE(last_period_type, 'REG')                               AS decided_in
FROM {{ ref('raw_games') }}
WHERE game_type = 2
  AND game_state IN ('OFF', 'FINAL')
QUALIFY row_number() OVER (PARTITION BY game_id) = 1`,
    },
    {
      name: "stg_shots",
      layer: "silver",
      description:
        "Shot attempts with strength derived from the situation code and coordinates flipped so every shooter attacks the right-hand net.",
      dependsOn: ["raw_plays", "raw_roster"],
      sql: `
WITH attempts AS (
  SELECT
    p.*,
    p.owner_team_id = p.home_team_id                             AS shooter_is_home,
    TRY_CAST(substr(p.situation_code, 1, 1) AS INTEGER)          AS away_goalie,
    TRY_CAST(substr(p.situation_code, 2, 1) AS INTEGER)          AS away_skaters,
    TRY_CAST(substr(p.situation_code, 3, 1) AS INTEGER)          AS home_skaters,
    TRY_CAST(substr(p.situation_code, 4, 1) AS INTEGER)          AS home_goalie
  FROM {{ ref('raw_plays') }} p
  WHERE p.event_type IN ('goal', 'shot-on-goal', 'missed-shot', 'blocked-shot')
    AND p.period_type <> 'SO'
    AND p.x IS NOT NULL AND p.y IS NOT NULL
),
sided AS (
  SELECT
    *,
    -- A team attacks the net opposite the end it defends.
    CASE WHEN shooter_is_home = COALESCE(home_defending_side = 'right', false) THEN -1 ELSE 1 END AS flip,
    CASE WHEN shooter_is_home THEN home_skaters ELSE away_skaters END AS own_skaters,
    CASE WHEN shooter_is_home THEN away_skaters ELSE home_skaters END AS opp_skaters,
    CASE WHEN shooter_is_home THEN away_goalie  ELSE home_goalie  END AS opp_goalie
  FROM attempts
)
SELECT
  s.game_id,
  s.period,
  CAST(split_part(s.time_in_period, ':', 1) AS INTEGER) * 60
    + CAST(split_part(s.time_in_period, ':', 2) AS INTEGER)      AS period_seconds,
  CASE WHEN s.owner_team_id = ${TEAM_ID} THEN 'CGY' ELSE 'OPP' END AS team,
  s.event_type                                                   AS event,
  s.event_type = 'goal'                                          AS is_goal,
  s.shot_type,
  CASE
    WHEN s.own_skaters IS NULL OR s.opp_goalie IS NULL THEN 'other'
    WHEN s.opp_goalie = 0 THEN 'EN'
    WHEN s.own_skaters = s.opp_skaters AND s.own_skaters = 5 THEN '5v5'
    WHEN s.own_skaters = s.opp_skaters THEN 'even'
    WHEN s.own_skaters > s.opp_skaters THEN 'PP'
    ELSE 'SH'
  END                                                            AS strength,
  s.x * s.flip                                                   AS x,
  s.y * s.flip                                                   AS y,
  r.first_name || ' ' || r.last_name                             AS shooter
FROM sided s
LEFT JOIN {{ ref('raw_roster') }} r
  ON r.game_id = s.game_id AND r.player_id = s.shooter_id`,
    },
    {
      name: "flames_games",
      layer: "gold",
      description: "One row per game with result and standings points.",
      dependsOn: ["stg_games"],
      served: { file: "flames-games.parquet" },
      mergeKey: "game_id",
      sql: `
SELECT
  game_id, season, game_date, home, opponent, goals_for, goals_against,
  CASE WHEN goals_for > goals_against THEN 'W'
       WHEN decided_in = 'REG' THEN 'L'
       ELSE 'OTL' END                                            AS result,
  decided_in,
  CASE WHEN goals_for > goals_against THEN 2
       WHEN decided_in = 'REG' THEN 0
       ELSE 1 END                                                AS points
FROM {{ ref('stg_games') }}
ORDER BY game_date`,
    },
    {
      name: "flames_shots",
      layer: "gold",
      description: "Every shot attempt in those games, for and against.",
      dependsOn: ["stg_shots", "flames_games"],
      served: { file: "flames-shots.parquet" },
      mergeKey: "game_id",
      sql: `
SELECT s.*
FROM {{ ref('stg_shots') }} s
SEMI JOIN {{ ref('flames_games') }} g ON g.game_id = s.game_id
ORDER BY s.game_id, s.period, s.period_seconds`,
    },
  ],
  tests: [
    {
      name: "game_id is unique",
      model: "flames_games",
      kind: "unique",
      column: "game_id",
      severity: "error",
      description: "One row per game.",
    },
    {
      name: "result is W, L or OTL",
      model: "flames_games",
      kind: "accepted_values",
      column: "result",
      values: ["W", "L", "OTL"],
      severity: "error",
      description: "No ties, no unknowns.",
    },
    {
      name: "Points match the result",
      model: "flames_games",
      kind: "expression",
      expression: "points = CASE result WHEN 'W' THEN 2 WHEN 'OTL' THEN 1 ELSE 0 END",
      severity: "error",
      description: "Standings logic is applied consistently.",
    },
    {
      name: "At least 82 games",
      model: "flames_games",
      kind: "row_count",
      min: 82,
      severity: "error",
      description: "Guards against a partial extract replacing full seasons.",
    },
    {
      name: "Every shot belongs to a known game",
      model: "flames_shots",
      kind: "relationship",
      column: "game_id",
      to: { model: "flames_games", column: "game_id" },
      severity: "error",
      description: "Referential integrity between the two served tables.",
    },
    {
      name: "Coordinates are on the ice",
      model: "flames_shots",
      kind: "expression",
      expression: "x BETWEEN -100 AND 100 AND y BETWEEN -43 AND 43",
      severity: "error",
      description: "A rink is 200 by 85 feet.",
    },
    {
      name: "Shot-level goals reconcile to the final score",
      model: "flames_games",
      kind: "custom",
      severity: "error",
      description:
        "Counts goal events per game and compares them to the official score, allowing for the extra goal a shootout winner is credited.",
      sql: `
WITH shot_goals AS (
  SELECT game_id,
         count(*) FILTER (WHERE is_goal AND team = 'CGY') AS gf,
         count(*) FILTER (WHERE is_goal AND team = 'OPP') AS ga
  FROM {{ ref('flames_shots') }}
  GROUP BY 1
)
SELECT count(*) AS failures
FROM {{ ref('flames_games') }} g
LEFT JOIN shot_goals s USING (game_id)
WHERE g.goals_for - (g.decided_in = 'SO' AND g.result = 'W')::INTEGER <> COALESCE(s.gf, 0)
   OR g.goals_against - (g.decided_in = 'SO' AND g.result <> 'W')::INTEGER <> COALESCE(s.ga, 0)`,
    },
    {
      name: "Coordinate flip points shots at the attacking net",
      model: "flames_shots",
      kind: "custom",
      severity: "warn",
      description:
        "At least 95% of unblocked attempts should land in the attacking half. If the API changes its side convention, this catches it.",
      sql: `
SELECT CASE WHEN avg((x > 0)::INTEGER) >= 0.95 THEN 0 ELSE 1 END AS failures
FROM {{ ref('flames_shots') }}
WHERE event <> 'blocked-shot'`,
    },
    {
      name: "Shooter name is present",
      model: "flames_shots",
      kind: "not_null",
      column: "shooter",
      severity: "warn",
      description: "A few events arrive without a matching roster entry.",
    },
  ],
  contract: {
    owner: "Cody Chandler",
    cadence: "Weekly, Mondays at 10:00 UTC, via GitHub Actions",
    freshnessSlaDays: 8,
    primaryKeys: { flames_games: "game_id", flames_shots: "game_id + period + period_seconds (not unique)" },
    consumers: ["Lab dashboards", "Ask the data (Claude-generated SQL)"],
    guarantees: [
      "Regular-season games only. Preseason and playoffs are excluded.",
      "Shot coordinates are in feet, with the shooter always attacking x = 89.",
      "Shot-level goals reconcile to the official final score for every game.",
      "A failing error-level test blocks the refresh. The last good snapshot keeps serving.",
    ],
  },
};

type Localized = { default: string };

type ScheduleGame = {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  gameState: string;
  homeTeam: { id: number; abbrev: string; score?: number };
  awayTeam: { id: number; abbrev: string; score?: number };
  gameOutcome?: { lastPeriodType: string };
};

type PlayByPlay = {
  homeTeam: { id: number };
  plays: {
    typeDescKey: string;
    periodDescriptor: { number: number; periodType: string };
    timeInPeriod: string;
    situationCode?: string;
    homeTeamDefendingSide?: string;
    details?: {
      xCoord?: number;
      yCoord?: number;
      eventOwnerTeamId?: number;
      shotType?: string;
      shootingPlayerId?: number;
      scoringPlayerId?: number;
    };
  }[];
  rosterSpots: { playerId: number; firstName: Localized; lastName: Localized }[];
};

export type FetchJson = <T>(path: string) => Promise<T>;

const SHOT_EVENTS = new Set(["goal", "shot-on-goal", "missed-shot", "blocked-shot"]);

/**
 * Flattens schedules and play-by-play into bronze rows. `fetchJson` takes an
 * API path (e.g. "gamecenter/2025020001/play-by-play") so callers decide how
 * to reach the API: directly with caching in Node, or via /api/nhl in the
 * browser. Games in `skipGameIds` are already loaded and aren't re-fetched.
 */
export async function extractFlames({
  seasons,
  fetchJson,
  skipGameIds = new Set<number>(),
  concurrency = 2,
  onLog,
}: {
  seasons: string[];
  fetchJson: FetchJson;
  skipGameIds?: Set<number>;
  concurrency?: number;
  onLog?: (message: string) => void;
}) {
  const games: Record<string, unknown>[] = [];
  const plays: Record<string, unknown>[] = [];
  const roster: Record<string, unknown>[] = [];
  let requests = 0;

  for (const season of seasons) {
    const schedule = await fetchJson<{ games: ScheduleGame[] }>(`club-schedule-season/${TEAM}/${season}`);
    requests++;
    for (const g of schedule.games) {
      games.push({
        game_id: g.id,
        season: String(g.season),
        game_type: g.gameType,
        game_date: g.gameDate,
        game_state: g.gameState,
        home_id: g.homeTeam.id,
        home_abbrev: g.homeTeam.abbrev,
        home_score: g.homeTeam.score ?? null,
        away_id: g.awayTeam.id,
        away_abbrev: g.awayTeam.abbrev,
        away_score: g.awayTeam.score ?? null,
        last_period_type: g.gameOutcome?.lastPeriodType ?? null,
      });
    }

    const toFetch = schedule.games.filter(
      (g) => g.gameType === 2 && ["OFF", "FINAL"].includes(g.gameState) && !skipGameIds.has(g.id),
    );
    onLog?.(`${season}: ${schedule.games.length} scheduled, ${toFetch.length} finished games to load`);

    let next = 0;
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (next < toFetch.length) {
          const game = toFetch[next++];
          const pbp = await fetchJson<PlayByPlay>(`gamecenter/${game.id}/play-by-play`);
          requests++;
          for (const r of pbp.rosterSpots) {
            roster.push({
              game_id: game.id,
              player_id: r.playerId,
              first_name: r.firstName.default,
              last_name: r.lastName.default,
            });
          }
          for (const p of pbp.plays) {
            if (!SHOT_EVENTS.has(p.typeDescKey)) continue;
            const d = p.details ?? {};
            plays.push({
              game_id: game.id,
              home_team_id: pbp.homeTeam.id,
              event_type: p.typeDescKey,
              period: p.periodDescriptor.number,
              period_type: p.periodDescriptor.periodType,
              time_in_period: p.timeInPeriod,
              situation_code: p.situationCode ?? null,
              home_defending_side: p.homeTeamDefendingSide ?? null,
              x: d.xCoord ?? null,
              y: d.yCoord ?? null,
              owner_team_id: d.eventOwnerTeamId ?? null,
              shot_type: d.shotType ?? null,
              shooter_id: d.scoringPlayerId ?? d.shootingPlayerId ?? null,
            });
          }
        }
      }),
    );
  }

  return { tables: { raw_games: games, raw_plays: plays, raw_roster: roster }, requests };
}
