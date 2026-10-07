/**
 * Home page proof points. Each names its source and links to the evidence.
 * BRAND.md: percentages over raw dollars, and accent on only the single most
 * important metric (`key`).
 */
export type Kpi = {
  value: string;
  before?: string;
  label: string;
  source: string;
  href: string;
  key?: boolean;
  todo?: boolean;
};

export const kpis: Kpi[] = [
  {
    value: "+27%",
    label: "Revenue over two seasons, backed by my team's pricing and membership analysis",
    source: "Canucks Sports & Entertainment",
    href: "/work/canucks-bi",
    key: true,
  },
  {
    before: "7 days",
    value: "<12 hrs",
    label: "Data freshness for sports clients",
    source: "StellarAlgo",
    href: "/work/stellaralgo-prime",
  },
  {
    value: "5",
    label: "Paid channels in one attribution model, with CAC and LTV",
    source: "Neo Financial",
    href: "/work/neo-attribution",
  },
  {
    value: "$40M+",
    label: "Municipal revenue in a property tax program I ran",
    source: "City of Surrey",
    href: "/about#experience",
  },
];

export function visibleKpis() {
  return process.env.NODE_ENV === "production" ? kpis.filter((k) => !k.todo) : kpis;
}
