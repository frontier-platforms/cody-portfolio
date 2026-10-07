/**
 * Home page proof points. Each names its source and links to the evidence.
 * BRAND.md: percentages over raw dollars, and accent on only the single most
 * important metric (`key`).
 */
export type Kpi = {
  /** The part of the business this proves: revenue, sales, marketing, product. */
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
    area: "Revenue",
    value: "+27%",
    label: "Revenue growth over two seasons, backed by my team’s pricing and membership analysis",
    source: "Canucks",
    href: "/work/canucks-bi",
    key: true,
  },
  {
    area: "Sales",
    value: "$2M+",
    label: "In memberships I managed as an account executive, across 800+ accounts",
    source: "Canucks",
    href: "/work/canucks-bi",
  },
  {
    area: "Marketing",
    value: "5 → 1",
    label: "Platform reports replaced by one attribution view, with CAC and LTV guiding the budget",
    source: "Neo Financial",
    href: "/work/neo-attribution",
  },
  {
    area: "Product and data",
    value: "<12 hrs",
    label: "Data freshness for sports clients, down from 7 days",
    source: "StellarAlgo",
    href: "/work/stellaralgo-prime",
  },
];

export function visibleKpis() {
  return process.env.NODE_ENV === "production" ? kpis.filter((k) => !k.todo) : kpis;
}
