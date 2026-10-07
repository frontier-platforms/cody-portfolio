/**
 * Browser connector for the City of Calgary property assessments API, used by
 * the Lab's live runs. The pipeline itself lives in dbt: dbt/models/housing.
 * The weekly extract is Python: ingest/extract.py.
 *
 * The platform republishes every row nightly, so :updated_at is useless as a
 * watermark here. Incremental pulls use the City's own mod_date instead.
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
