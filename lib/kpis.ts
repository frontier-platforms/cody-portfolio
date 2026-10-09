/**
 * Home page proof points. Each names its source and links to the evidence.
 * BRAND.md 1.16: all four numbers use the accent color, centred.
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

// The first proof a visitor sees: range, platform depth, business result, and the Lab on this site.
export const kpis: Kpi[] = [
  {
    area: "Experience",
    value: "10+",
    label: "Years across pro sports, fintech, SaaS and government",
    source: "Four industries",
    href: "/about#experience",
  },
  {
    area: "Data platform",
    value: "1",
    label: "Data layer for ticketing, CRM, email and fan data",
    source: "StellarAlgo",
    href: "/work/stellaralgo-prime",
  },
  {
    area: "BI leadership",
    value: "+27%",
    label: "Revenue growth over two seasons, backed by my BI team’s analysis",
    source: "Canucks",
    href: "/work/canucks-bi",
  },
  {
    area: "The Lab",
    value: "3",
    label: "Live data products on this site, with pipelines you can run",
    source: "This site",
    href: "/lab",
  },
];

export function visibleKpis() {
  return process.env.NODE_ENV === "production" ? kpis.filter((k) => !k.todo) : kpis;
}
