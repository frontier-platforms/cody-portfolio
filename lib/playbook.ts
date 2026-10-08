/**
 * How I help a team, in four steps. Each step links to one page that proves it.
 * Used on the home page. Copy follows BRAND.md section 2.
 */
export type PlaybookStep = {
  title: string;
  body: string;
  link: { href: string; label: string };
};

export const playbook: PlaybookStep[] = [
  {
    title: "One source of truth",
    body: "I model the data once, with tests and a written contract. Sales, marketing and finance stop arguing about whose number is right.",
    link: { href: "/work/stellaralgo-prime", label: "The PRIME platform" },
  },
  {
    title: "Fresh enough to act on",
    body: "I replace weekly batches with incremental loads. At StellarAlgo, data went from 7 days old to under 12 hours.",
    link: { href: "/lab/calgary#pipeline", label: "Run a live pipeline" },
  },
  {
    title: "In the tools people use",
    body: "A dashboard nobody opens changes nothing. I push the answer into the CRM, the ad platforms or an AI assistant.",
    link: { href: "/work/neo-attribution", label: "Attribution at Neo" },
  },
  {
    title: "Measured like a product",
    body: "I track usage, speed and errors on data products. Then we know what’s worth keeping and what to cut.",
    link: { href: "/lab", label: "Explore the Lab" },
  },
];
