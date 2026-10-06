/**
 * Schemas for the Lab datasets. Shared by the UI (to show people what they can
 * ask about) and the /api/ask route (to tell Claude what tables exist).
 */
export const datasets = {
  permits: {
    label: "Calgary building permits",
    source: "City of Calgary Open Data, Building Permits (c2es-76ed). Applications since 2015.",
    schema: `TABLE permits  -- one row per building permit application in Calgary, 2015 to present
  permit_id       VARCHAR  -- City permit number
  applied_date    DATE     -- date the application was submitted
  issued_date     DATE     -- date the permit was issued, NULL if not (yet) issued
  completed_date  DATE     -- date work was completed, NULL if not complete
  status          VARCHAR  -- e.g. 'Completed', 'Issued Permit', 'Cancelled', 'In Review', 'Refused'
  permit_type     VARCHAR  -- 'Building' or 'Demolition'
  permit_class    VARCHAR  -- 'Residential', 'Non-Residential' or 'Unspecified'
  class_group     VARCHAR  -- e.g. 'Single Family', 'Two Family', 'Townhouse', 'Apartment', 'Secondary Suites', 'Garage', 'Commercial', 'Industrial', 'Institutional'
  work_group      VARCHAR  -- 'New', 'Improvement', 'Demolition' or 'Unspecified'
  housing_units   INTEGER  -- dwelling units created by this permit, 0 if none
  est_cost        DOUBLE   -- estimated project cost in CAD
  sqft            DOUBLE   -- total square feet
  community       VARCHAR  -- Calgary community name in UPPER CASE, e.g. 'SAGE HILL', 'BELTLINE'
  lat, lon        DOUBLE   -- location, NULL when the City has none
  updated_at      TIMESTAMP -- when the City last changed this record`,
    examples: [
      "Which 10 communities added the most housing units in 2024?",
      "How has the median days from application to issue changed each year for new single family homes?",
      "What share of new housing units are secondary suites, by year?",
      "Total estimated construction value of new commercial permits by year",
    ],
  },
  flames: {
    label: "Calgary Flames, 2021-22 to today",
    source: "NHL public API, schedules and play-by-play. Regular season only.",
    schema: `TABLE flames_games  -- one row per Flames regular-season game
  game_id        BIGINT
  season         VARCHAR  -- e.g. '2025-26'; the latest season may be in progress
  game_date      DATE
  home           BOOLEAN  -- true if played in Calgary
  opponent       VARCHAR  -- three-letter team code, e.g. 'EDM', 'VAN'
  goals_for      INTEGER  -- Flames goals
  goals_against  INTEGER
  result         VARCHAR  -- 'W', 'L' (regulation loss) or 'OTL' (overtime or shootout loss)
  decided_in     VARCHAR  -- 'REG', 'OT' or 'SO'
  points         INTEGER  -- standings points earned: 2, 1 or 0

TABLE flames_shots  -- every unblocked and blocked shot attempt in those games, both teams
  game_id         BIGINT   -- joins to flames_games.game_id
  period          INTEGER  -- 1, 2, 3, or 4+ for overtime
  period_seconds  INTEGER  -- seconds elapsed in the period
  team            VARCHAR  -- 'CGY' for Flames shots, 'OPP' for opponent shots
  event           VARCHAR  -- 'goal', 'shot-on-goal', 'missed-shot' or 'blocked-shot'
  is_goal         BOOLEAN
  shot_type       VARCHAR  -- 'wrist', 'snap', 'slap', 'backhand', 'tip-in', 'deflected', 'wrap-around'; NULL for blocked shots
  strength        VARCHAR  -- shooter's view: '5v5', 'PP', 'SH', 'even' (4v4/3v3) or 'EN' (empty net)
  x, y            INTEGER  -- rink coordinates in feet; shooter always attacks the net at x = 89
  shooter         VARCHAR  -- player full name, e.g. 'Nazem Kadri'`,
    examples: [
      "Who scored the most Flames goals in 2025-26?",
      "Flames record against Edmonton by season",
      "Which shot types have the best shooting percentage for the Flames?",
      "Goals for and against by period across all five seasons",
    ],
  },
} as const;

export type DatasetKey = keyof typeof datasets;

const BLOCKED =
  /\b(attach|detach|copy|export|import|install|load|pragma|set|reset|create|insert|update|delete|drop|alter|call|checkpoint|vacuum|use|read_\w+|glob|getenv|httpfs|parquet_scan|sniff_csv|query_table)\b|https?:|s3:|['"][^'"]*\.(parquet|csv|json)['"]/i;

/**
 * Accepts a single read-only SELECT. This is defence in depth: the query runs
 * in DuckDB-WASM inside the visitor's own browser against public data, so the
 * worst a bad query can do is waste that visitor's CPU.
 */
export function checkSql(sql: string): { ok: true; sql: string } | { ok: false; reason: string } {
  const trimmed = sql.trim().replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(trimmed)) return { ok: false, reason: "Only SELECT queries are allowed." };
  if (trimmed.includes(";")) return { ok: false, reason: "Only one statement is allowed." };
  if (/--|\/\*/.test(trimmed)) return { ok: false, reason: "Comments are not allowed." };
  if (BLOCKED.test(trimmed)) return { ok: false, reason: "That query uses something outside the sandbox." };
  if (trimmed.length > 4000) return { ok: false, reason: "Query is too long." };
  return { ok: true, sql: trimmed };
}
