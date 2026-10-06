/**
 * Home page proof points. Each one names its source and links to the case
 * study or page that backs it. `todo` entries are shown in development only.
 */
export type Kpi = {
  value: string;
  before?: string;
  label: string;
  source: string;
  href: string;
  todo?: boolean;
};

export const kpis: Kpi[] = [
  {
    before: "7 days",
    value: "<12 hrs",
    label: "Data freshness for sports clients after automating a weekly process",
    source: "StellarAlgo · PRIME",
    href: "/work/stellaralgo-prime",
  },
  {
    before: "$66M",
    value: "$84M",
    label: "Revenue across two seasons, backed by pricing and membership analysis",
    source: "Canucks Sports & Entertainment",
    href: "/work/canucks-bi",
  },
  {
    value: "5",
    label: "Paid channels unified in one attribution data mart, with CAC and LTV models",
    source: "Neo Financial",
    href: "/work/neo-attribution",
  },
  {
    value: "$40M+",
    label: "Municipal revenue in a property tax deferment program I ran",
    source: "City of Surrey",
    href: "/about#experience",
  },
];

export function visibleKpis() {
  return process.env.NODE_ENV === "production" ? kpis.filter((k) => !k.todo) : kpis;
}
