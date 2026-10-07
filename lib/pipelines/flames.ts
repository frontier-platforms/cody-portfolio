/**
 * Browser connector for the NHL API (through /api/nhl), used by the Lab's live
 * runs. It only flattens nested JSON to bronze rows; every business rule lives
 * in dbt: dbt/models/flames. The weekly extract is Python: ingest/extract.py.
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
