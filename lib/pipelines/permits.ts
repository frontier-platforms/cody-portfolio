/**
 * Browser connector for the City of Calgary building permits API, used by the
 * Lab's live runs. The pipeline itself (models, tests, contract) lives in dbt:
 * dbt/models/permits. The weekly extract is Python: ingest/extract.py.
 *
 * Incremental pulls use the platform's :updated_at as a watermark, so status
 * changes on old permits are caught as well as new applications.
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
