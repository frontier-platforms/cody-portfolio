import type { Pipeline } from "./types";

/**
 * Calgary residential property assessments.
 *
 *   data.calgary.ca ─┬─ raw_assessments ─┐
 *                    └─ raw_use_codes ───┴─▶ stg_homes ──▶ housing_homes ──▶ housing-homes.parquet
 *                        (bronze)               (silver)      (gold)     └─▶ value model (housing-model.json)
 *
 * The platform republishes every row nightly, so Socrata's :updated_at
 * changes for all 600k parcels and is useless as a watermark. Incremental
 * runs use the City's own mod_date instead.
 */
export const ASSESSMENTS = "https://data.calgary.ca/resource/4bsw-nn7w.json";
export const USE_CODES = "https://data.calgary.ca/resource/5843-8tyj.json";

/** Homes only: no parking stalls, storage units, vacant land or whole rental buildings. */
export const HOME_USES: Record<string, string> = {
  R110: "Detached",
  R111: "Detached",
  R120: "Duplex",
  R401: "Townhouse",
  R402: "Townhouse",
  R201: "Condo apartment",
  R301: "Condo apartment",
};

const FIELDS = [
  "roll_year",
  "roll_number",
  "assessed_value",
  "comm_name",
  "year_of_construction",
  "land_use_designation",
  "land_size_sf",
  "sub_property_use",
  "mod_date",
] as const;

const groupCase = Object.entries(HOME_USES)
  .map(([code, group]) => `WHEN '${code}' THEN '${group}'`)
  .join(" ");

export const housingPipeline: Pipeline = {
  id: "housing",
  label: "Calgary home assessments",
  source: {
    name: "City of Calgary Open Data · Current Year Property Assessments",
    url: ASSESSMENTS,
    docs: "https://data.calgary.ca/Government/Current-Year-Property-Assessments-Parcel-/4bsw-nn7w",
    licence: "Open Government Licence – City of Calgary",
  },
  sources: [
    {
      name: "raw_assessments",
      description:
        "Residential parcels for home property uses, as the API returns them. Every field is text.",
      columns: FIELDS.map((name) => ({ name, type: "VARCHAR" })),
    },
    {
      name: "raw_use_codes",
      description: "The City's lookup of sub-property use codes to labels, from a second dataset.",
      columns: [
        { name: "code", type: "VARCHAR" },
        { name: "description", type: "VARCHAR" },
      ],
    },
  ],
  models: [
    {
      name: "stg_homes",
      layer: "silver",
      description:
        "Typed and labelled. Use codes joined to the City's own descriptions, zoning reduced to its primary district, and the 1800 placeholder for an unknown build year turned into NULL.",
      dependsOn: ["raw_assessments", "raw_use_codes"],
      sql: `
SELECT
  TRY_CAST(a.roll_number AS BIGINT)                              AS roll_number,
  TRY_CAST(a.roll_year AS INTEGER)                               AS roll_year,
  a.comm_name                                                    AS community,
  a.sub_property_use                                             AS use_code,
  u.description                                                  AS use,
  CASE a.sub_property_use ${groupCase} END                       AS property_group,
  NULLIF(trim(split_part(a.land_use_designation, ',', 1)), '')   AS zoning,
  -- The City records 1800 when the build year is unknown.
  NULLIF(TRY_CAST(TRY_CAST(a.year_of_construction AS DOUBLE) AS INTEGER), 1800) AS year_built,
  TRY_CAST(TRY_CAST(a.land_size_sf AS DOUBLE) AS INTEGER)        AS lot_sqft,
  TRY_CAST(TRY_CAST(a.assessed_value AS DOUBLE) AS INTEGER)      AS assessed_value,
  CAST(TRY_CAST(a.mod_date AS TIMESTAMP) AS DATE)                AS mod_date
FROM {{ ref('raw_assessments') }} a
LEFT JOIN {{ ref('raw_use_codes') }} u ON u.code = a.sub_property_use
QUALIFY row_number() OVER (PARTITION BY a.roll_number ORDER BY a.mod_date DESC) = 1`,
    },
    {
      name: "housing_homes",
      layer: "gold",
      description:
        "One row per home with its 2026 assessed value. No addresses. Served as Parquet and used to train the model.",
      dependsOn: ["stg_homes"],
      served: { file: "housing-homes.parquet" },
      mergeKey: "roll_number",
      sql: `
SELECT roll_number, roll_year, community, use, property_group, zoning, year_built, lot_sqft, assessed_value, mod_date
FROM {{ ref('stg_homes') }}
WHERE assessed_value > 0
ORDER BY community, roll_number`,
    },
  ],
  model: {
    name: "value_model",
    description:
      "Gradient-boosted trees on log assessed value, trained after the tests pass. Features: community, property type, zoning, year built, lot size.",
    file: "housing-model.json",
    trainedOn: "housing_homes",
  },
  tests: [
    {
      name: "roll_number is unique",
      model: "housing_homes",
      kind: "unique",
      column: "roll_number",
      severity: "error",
      description: "One row per assessed property.",
    },
    {
      name: "roll_number is never null",
      model: "housing_homes",
      kind: "not_null",
      column: "roll_number",
      severity: "error",
      description: "Every home is addressable for incremental merges.",
    },
    {
      name: "Every use code has a City label",
      model: "housing_homes",
      kind: "not_null",
      column: "use",
      severity: "error",
      description: "If the City adds a code, the join fails loudly instead of producing unlabelled homes.",
    },
    {
      name: "property_group is a known value",
      model: "housing_homes",
      kind: "accepted_values",
      column: "property_group",
      values: [...new Set(Object.values(HOME_USES))],
      severity: "error",
      description: "Only the home types the model and dashboard expect.",
    },
    {
      name: "One assessment roll year",
      model: "housing_homes",
      kind: "custom",
      severity: "error",
      description: "Mixing two roll years would blend two years of values into one model.",
      sql: `SELECT CASE WHEN count(DISTINCT roll_year) = 1 THEN 0 ELSE 1 END AS failures FROM {{ ref('housing_homes') }}`,
    },
    {
      name: "Assessed value is plausible ($50k to $20M)",
      model: "housing_homes",
      kind: "expression",
      expression: "assessed_value BETWEEN 50000 AND 20000000",
      severity: "warn",
      description: "Outliers are kept but flagged; the model trains on log value, which limits their pull.",
    },
    {
      name: "Year built is plausible",
      model: "housing_homes",
      kind: "expression",
      expression: "year_built IS NULL OR year_built BETWEEN 1875 AND year({{ today }}) + 1",
      severity: "warn",
      description: "Catches zeros and typos in construction year.",
    },
    {
      name: "Year built is present",
      model: "housing_homes",
      kind: "not_null",
      column: "year_built",
      severity: "warn",
      description: "Missing years are kept. The model routes missing values down their own branch.",
    },
    {
      name: "At least 400,000 homes",
      model: "housing_homes",
      kind: "row_count",
      min: 400_000,
      severity: "error",
      description: "Guards against a partial extract replacing the table and retraining the model on it.",
    },
  ],
  contract: {
    owner: "Cody Chandler",
    cadence: "Weekly, Mondays at 10:00 UTC, via GitHub Actions",
    freshnessSlaDays: 8,
    primaryKeys: { housing_homes: "roll_number" },
    consumers: ["Lab dashboards", "Value model", "Ask the data (Claude-generated SQL)"],
    guarantees: [
      "Values are the City's 2026 assessments (market value as of July 1, 2025), not sale prices.",
      "Homes only: detached, duplex, townhouse and condo apartment units.",
      "No addresses or owner details are served to the browser.",
      "The model retrains only after every error-level test passes.",
    ],
  },
};

type Fetch = typeof fetch;

/** Pulls home assessments, optionally only those modified after `modifiedSince`. */
export async function extractHousing({
  fetchImpl = fetch,
  modifiedSince,
  pageSize = 100_000,
  maxRows = Infinity,
  onPage,
}: {
  fetchImpl?: Fetch;
  modifiedSince?: string;
  pageSize?: number;
  maxRows?: number;
  onPage?: (info: { url: string; rows: number; ms: number }) => void;
}) {
  const where = [
    "assessment_class = 'RE'",
    `sub_property_use IN (${Object.keys(HOME_USES)
      .map((c) => `'${c}'`)
      .join(", ")})`,
  ];
  if (modifiedSince) where.push(`mod_date > '${modifiedSince}'`);

  const assessments: Record<string, string>[] = [];
  let requests = 0;
  for (let offset = 0; assessments.length < maxRows; offset += pageSize) {
    const params = new URLSearchParams({
      $select: FIELDS.join(","),
      $where: where.join(" AND "),
      $order: "roll_number",
      $limit: String(Math.min(pageSize, maxRows - assessments.length)),
      $offset: String(offset),
    });
    const url = `${ASSESSMENTS}?${params}`;
    const started = Date.now();
    const res = await fetchImpl(url);
    requests++;
    if (!res.ok) throw new Error(`City API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const page = (await res.json()) as Record<string, string>[];
    assessments.push(...page);
    onPage?.({ url, rows: page.length, ms: Date.now() - started });
    if (page.length < pageSize) break;
  }

  const codesRes = await fetchImpl(`${USE_CODES}?$limit=1000`);
  requests++;
  if (!codesRes.ok) throw new Error(`City API ${codesRes.status} for use codes`);
  const codes = (await codesRes.json()) as Record<string, string>[];

  return {
    tables: { raw_assessments: assessments, raw_use_codes: codes } as Record<string, unknown[]>,
    requests,
  };
}
