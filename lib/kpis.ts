/**
 * Home page proof points. Each names its source and links to the evidence.
 * BRAND.md: percentages over raw dollars, and accent on only the single most
 * important metric (`key`).
 */
export type Kpi = {
  /** The kind of work this proves, shown with the source: BI, data platform, marketing, sales. */
  area: string;
  value: string;
  label: string;
  source: string;
  href: string;
  key?: boolean;
  todo?: boolean;
};

export const kpis: Kpi[] = [
  {
    area: "BI leadership",
    value: "+27%",
    label: "Revenue over two seasons, backed by my BI team’s pricing analysis",
    source: "Canucks",
    href: "/work/canucks-bi",
    key: true,
  },
  {
    area: "Data platform",
    value: "<12 hrs",
    label: "Data freshness for sports clients, down from 7 days",
    source: "StellarAlgo",
    href: "/work/stellaralgo-prime",
  },
  {
    area: "Marketing analytics",
    value: "5",
    label: "Paid channels in one attribution model, with CAC and LTV",
    source: "Neo Financial",
    href: "/work/neo-attribution",
  },
  {
    area: "Sales",
    value: "$2M+",
    label: "Membership book I managed, across 800+ accounts",
    source: "Canucks",
    href: "/work/canucks-bi",
  },
];

export function visibleKpis() {
  return process.env.NODE_ENV === "production" ? kpis.filter((k) => !k.todo) : kpis;
}
