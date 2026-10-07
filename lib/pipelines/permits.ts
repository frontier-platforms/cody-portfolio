import type { Pipeline } from "./types";

/**
 * City of Calgary building permits.
 *
 *   data.calgary.ca ──extract──▶ raw_permits ──▶ stg_permits ──▶ permits ──▶ permits.parquet
 *       (Socrata)                 (bronze)        (silver)        (gold)
 *
 * Incremental loads use the platform's :updated_at system column as a
 * watermark, so status changes on old permits are picked up, not just new
 * applications.
 */
export const ENDPOINT = "https://data.calgary.ca/resource/c2es-76ed.json";
export const SINCE = "2015-01-01";

const FIELDS = [
  "permitnum",
  "applieddate",
  "issueddate",
  "completeddate",
  "statuscurrent",
  "permittypemapped",
  "permitclassmapped",
  "permitclassgroup",
  "workclassgroup",
  "housingunits",
  "estprojectcost",
  "totalsqft",
  "communityname",
  "latitude",
  "longitude",
] as const;

export const permitsPipeline: Pipeline = {
  id: "permits",
  label: "Calgary building permits",
  source: {
    name: "City of Calgary Open Data · Building Permits",
    url: ENDPOINT,
    docs: "https://data.calgary.ca/Business-and-Economic-Activity/Building-Permits/c2es-76ed",
    licence: "Open Government Licence – City of Calgary",
  },
  sources: [
    {
      name: "raw_permits",
      description: "Permit records exactly as the City's API returns them. Every field is text.",
      columns: [
        ...FIELDS.map((name) => ({ name, type: "VARCHAR" })),
        { name: "source_updated_at", type: "VARCHAR" },
      ],
    },
  ],
  models: [
    {
      name: "stg_permits",
      layer: "silver",
      description:
        "Typed, renamed and deduplicated. Zero coordinates become NULL. One row per permit, latest version wins.",
      dependsOn: ["raw_permits"],
      sql: `
SELECT
  permitnum                                              AS permit_id,
  CAST(CAST(applieddate AS TIMESTAMP) AS DATE)           AS applied_date,
  CAST(TRY_CAST(issueddate AS TIMESTAMP) AS DATE)        AS issued_date,
  CAST(TRY_CAST(completeddate AS TIMESTAMP) AS DATE)     AS completed_date,
  statuscurrent                                          AS status,
  permittypemapped                                       AS permit_type,
  permitclassmapped                                      AS permit_class,
  permitclassgroup                                       AS class_group,
  workclassgroup                                         AS work_group,
  COALESCE(TRY_CAST(housingunits AS INTEGER), 0)         AS housing_units,
  TRY_CAST(estprojectcost AS DOUBLE)                     AS est_cost,
  TRY_CAST(totalsqft AS DOUBLE)                          AS sqft,
  communityname                                          AS community,
  NULLIF(ROUND(TRY_CAST(latitude AS DOUBLE), 4), 0)      AS lat,
  NULLIF(ROUND(TRY_CAST(longitude AS DOUBLE), 4), 0)     AS lon,
  TRY_CAST(source_updated_at AS TIMESTAMP)               AS updated_at
FROM {{ ref('raw_permits') }}
WHERE permitnum IS NOT NULL
QUALIFY row_number() OVER (PARTITION BY permitnum ORDER BY source_updated_at DESC) = 1`,
    },
    {
      name: "permits",
      layer: "gold",
      description: "Applications since 2015, ready for analysis. Served to the browser as Parquet.",
      dependsOn: ["stg_permits"],
      served: { file: "permits.parquet" },
      mergeKey: "permit_id",
      sql: `
SELECT *
FROM {{ ref('stg_permits') }}
WHERE applied_date >= DATE '${SINCE}'
ORDER BY applied_date, permit_id`,
    },
  ],
  tests: [
    {
      name: "permit_id is unique",
      model: "permits",
      kind: "unique",
      column: "permit_id",
      severity: "error",
      description: "The primary key holds.",
    },
    {
      name: "permit_id is never null",
      model: "permits",
      kind: "not_null",
      column: "permit_id",
      severity: "error",
      description: "Every row is addressable.",
    },
    {
      name: "applied_date is never null",
      model: "permits",
      kind: "not_null",
      column: "applied_date",
      severity: "error",
      description: "Every permit has an application date.",
    },
    {
      name: "permit_class is a known value",
      model: "permits",
      kind: "accepted_values",
      column: "permit_class",
      values: ["Residential", "Non-Residential", "Unspecified"],
      severity: "error",
      description: "Catches a new category upstream before it silently drops out of charts.",
    },
    {
      name: "work_group is a known value",
      model: "permits",
      kind: "accepted_values",
      column: "work_group",
      values: ["New", "Improvement", "Demolition", "Unspecified"],
      severity: "error",
      description: "Same guard for the work type.",
    },
    {
      name: "housing_units is between 0 and 2,000",
      model: "permits",
      kind: "expression",
      expression: "housing_units BETWEEN 0 AND 2000",
      severity: "error",
      description: "A negative or huge unit count is a data entry error, not a building.",
    },
    {
      name: "Coordinates fall inside Calgary",
      model: "permits",
      kind: "expression",
      expression: "lat IS NULL OR (lat BETWEEN 50.80 AND 51.25 AND lon BETWEEN -114.35 AND -113.80)",
      severity: "error",
      description: "Swapped or mistyped coordinates would put permits in another city.",
    },
    {
      name: "Coordinates are present",
      model: "permits",
      kind: "not_null",
      column: "lat",
      severity: "warn",
      description: "Some permits have no location. They stay in totals but can't be mapped.",
    },
    {
      name: "Issued on or after applied",
      model: "permits",
      kind: "expression",
      expression: "issued_date IS NULL OR issued_date >= applied_date",
      severity: "warn",
      description: "A permit can't be issued before it's applied for. Flagged, not dropped.",
    },
    {
      name: "Completed on or after issued",
      model: "permits",
      kind: "expression",
      expression: "completed_date IS NULL OR issued_date IS NULL OR completed_date >= issued_date",
      severity: "warn",
      description: "Upstream date entry issue. Flagged so time-to-complete metrics can exclude them.",
    },
    {
      name: "At least 200,000 rows",
      model: "permits",
      kind: "row_count",
      min: 200_000,
      severity: "error",
      description: "Guards against a partial extract replacing the full table.",
    },
    {
      name: "Source updated in the last 8 days",
      model: "permits",
      kind: "freshness",
      column: "updated_at",
      maxAgeDays: 8,
      severity: "error",
      description: "If the City stops publishing, the refresh fails instead of serving stale data quietly.",
    },
  ],
  highlights: [
    {
      label: "New homes permitted",
      format: "count",
      sql: `
WITH last AS (SELECT year(max(issued_date)) - 1 AS yr FROM {{ ref('permits') }})
SELECT sum(housing_units) AS value, 'in ' || (SELECT yr FROM last) AS detail
FROM {{ ref('permits') }}
WHERE work_group = 'New' AND year(issued_date) = (SELECT yr FROM last)`,
    },
    {
      label: "Of new homes were apartments",
      format: "percent",
      sql: `
WITH last AS (SELECT year(max(issued_date)) - 1 AS yr FROM {{ ref('permits') }})
SELECT sum(housing_units) FILTER (WHERE class_group = 'Apartment') / sum(housing_units) AS value,
       'by units permitted in ' || (SELECT yr FROM last) AS detail
FROM {{ ref('permits') }}
WHERE work_group = 'New' AND year(issued_date) = (SELECT yr FROM last)`,
    },
    {
      label: "Median wait for a new-home permit",
      format: "text",
      sql: `
WITH last AS (SELECT year(max(applied_date)) - 1 AS yr FROM {{ ref('permits') }})
SELECT CAST(round(median(issued_date - applied_date)) AS INTEGER) || ' days' AS value,
       'applications in ' || (SELECT yr FROM last) AS detail
FROM {{ ref('permits') }}
WHERE work_group = 'New' AND permit_class = 'Residential' AND issued_date IS NOT NULL
  AND year(applied_date) = (SELECT yr FROM last)`,
    },
  ],
  contract: {
    owner: "Cody Chandler",
    cadence: "Weekly, Mondays at 10:00 UTC, via GitHub Actions",
    freshnessSlaDays: 8,
    primaryKeys: { permits: "permit_id" },
    consumers: ["Lab dashboards", "Ask the data (Claude-generated SQL)"],
    guarantees: [
      "permit_id is unique and never null.",
      "Dates are DATE values. No timestamps, no time zones.",
      "Missing coordinates are NULL, never 0.",
      "A failing error-level test blocks the refresh. The last good snapshot keeps serving.",
      "Schema changes land in this repo, reviewed, before they ship.",
    ],
  },
};

type Fetch = typeof fetch;
export type RawPermit = Record<string, string | undefined>;

/** Socrata system fields arrive as ":updated_at"; rename for a clean column. */
function normalize(row: Record<string, string>): RawPermit {
  const { [":updated_at"]: updated, ...rest } = row;
  return { ...rest, source_updated_at: updated };
}

/**
 * Pulls permit rows from the City's API, paging until done. `updatedSince`
 * switches to an incremental pull against the :updated_at watermark.
 */
export async function extractPermits({
  fetchImpl = fetch,
  updatedSince,
  pageSize = 100_000,
  maxRows = Infinity,
  onPage,
}: {
  fetchImpl?: Fetch;
  updatedSince?: string;
  pageSize?: number;
  maxRows?: number;
  onPage?: (info: { url: string; rows: number; ms: number }) => void;
}) {
  const rows: RawPermit[] = [];
  let requests = 0;
  const where = [`applieddate >= '${SINCE}'`];
  if (updatedSince) where.push(`:updated_at > '${updatedSince}'`);

  for (let offset = 0; rows.length < maxRows; offset += pageSize) {
    const params = new URLSearchParams({
      $select: [...FIELDS, ":updated_at"].join(","),
      $where: where.join(" AND "),
      $order: "permitnum",
      $limit: String(Math.min(pageSize, maxRows - rows.length)),
      $offset: String(offset),
    });
    const url = `${ENDPOINT}?${params}`;
    const started = Date.now();
    const res = await fetchImpl(url);
    requests++;
    if (!res.ok) throw new Error(`City API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const page = ((await res.json()) as Record<string, string>[]).map(normalize);
    rows.push(...page);
    onPage?.({ url, rows: page.length, ms: Date.now() - started });
    if (page.length < pageSize) break;
  }
  return { rows, requests };
}
