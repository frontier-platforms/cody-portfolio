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

// Newest role first: StellarAlgo, Neo, Canucks, City of Surrey.
export const kpis: Kpi[] = [
  {
    area: "Data platform",
    value: "1",
    label: "Governed data layer for every client, replacing a database per client",
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
    area: "BI leadership",
    value: "+27%",
    label: "Revenue over two seasons, backed by my BI team’s pricing analysis",
    source: "Canucks",
    href: "/work/canucks-bi",
    key: true,
  },
  {
    area: "Finance",
    value: "100%",
    label: "Success rate on the 2020 property tax sale I oversaw",
    source: "City of Surrey",
    href: "/work/surrey-property-tax",
  },
];

export function visibleKpis() {
  return process.env.NODE_ENV === "production" ? kpis.filter((k) => !k.todo) : kpis;
}
