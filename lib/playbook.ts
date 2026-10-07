/**
 * How I help a team, in four steps. Each step points at proof: a case study
 * and the lab that shows the same idea working. Used on the home page and the
 * Lab index. Copy follows BRAND.md section 2.
 */
export type PlaybookStep = {
  title: string;
  body: string;
  proof: { href: string; label: string }[];
};

export const playbook: PlaybookStep[] = [
  {
    title: "One source of truth",
    body: "I model the data once, with tests and a written contract. Sales, marketing and finance stop arguing about whose number is right.",
    proof: [
      { href: "/work/stellaralgo-prime", label: "PRIME data contract" },
      { href: "/lab/calgary#pipeline", label: "Tests and contract, live" },
    ],
  },
  {
    title: "Fresh enough to act on",
    body: "I replace weekly batches with incremental loads. At StellarAlgo, data went from 7 days old to under 12 hours.",
    proof: [
      { href: "/work/stellaralgo-prime", label: "7 days to under 12 hours" },
      { href: "/lab/calgary#pipeline", label: "Run an incremental load" },
    ],
  },
  {
    title: "In the tools people use",
    body: "A dashboard nobody opens changes nothing. I push the answer into the CRM, the ad platforms or an AI assistant.",
    proof: [
      { href: "/work/neo-attribution", label: "Attribution synced to ad tools" },
      { href: "/lab/housing#ask", label: "Ask the data with Claude" },
    ],
  },
  {
    title: "Measured like a product",
    body: "I track usage, speed and errors on data products. Then we know what’s worth keeping and what to cut.",
    proof: [
      { href: "/work/canucks-bi", label: "BI team built from zero" },
      { href: "/colophon#observability", label: "Telemetry and tracking plan" },
    ],
  },
];
