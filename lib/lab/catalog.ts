import type { DatasetKey } from "./datasets";

/**
 * The labs, in display order. Shared by the /lab index, each lab's header and
 * its "Why it matters" section. Copy follows BRAND.md section 2.
 */
export type LabEntry = {
  dataset: DatasetKey;
  href: string;
  number: string;
  kicker: string;
  title: string;
  lede: string;
  /** What makes this lab different from the other two. */
  standout: string;
  points: string[];
  stack: string[];
  /** Label above the lab's question bar. */
  askLabel: string;
  /** Each technique in this lab, translated into what it does for a sales or marketing team. */
  inYourTeam: { technique: string; translation: string }[];
  /** Engineering calls I made, why, and what they cost. */
  decisions: { decision: string; why: string; tradeoff: string }[];
};

export const labs: LabEntry[] = [
  {
    dataset: "permits",
    href: "/lab/calgary",
    number: "01",
    kicker: "City of Calgary open data",
    title: "Where Calgary is building",
    lede: "Every building permit since 2015. How many homes were permitted, how long it took, and where.",
    standout: "Incremental loads that catch status changes on old permits as well as new ones",
    points: [
      "Housing units, time to permit and top communities, with a dot map",
      "Live runs pull only what the City changed since the snapshot",
      "Warnings surface real source issues, like permits completed before they were issued",
    ],
    stack: ["Socrata API", "DuckDB", "Parquet", "Canvas"],
    askLabel: "Ask the permit data",
    inYourTeam: [
      {
        technique: "Incremental loads on a change watermark",
        translation: "CRM pipeline reports that catch deals that changed stage, as well as new deals.",
      },
      {
        technique: "Tests that warn instead of hide",
        translation: "Bad lead or campaign rows get flagged to an owner instead of quietly skewing a report.",
      },
      {
        technique: "A written data contract",
        translation: "Sales and marketing agree on what “qualified lead” means before anyone builds on it.",
      },
    ],
    decisions: [
      {
        decision: "Watermark on the City’s update time, merge on permit number",
        why: "Status changes on old permits are caught, not only new applications.",
        tradeoff: "Each run pulls more rows than “new since yesterday”. Correct counts are worth it.",
      },
      {
        decision: "Commit the Parquet files to the repo",
        why: "A deploy never depends on the City’s API being up.",
        tradeoff: "Git history grows a few MB a week. I’d move to object storage past about 100 MB.",
      },
      {
        decision: "Warnings never block a refresh. Errors always do.",
        why: "Real source issues stay visible without stopping fresh data.",
        tradeoff: "Someone has to read the warnings, so the page shows them to everyone.",
      },
    ],
  },
  {
    dataset: "housing",
    href: "/lab/housing",
    number: "02",
    kicker: "Machine learning",
    title: "What’s a Calgary home worth?",
    lede: "Every home’s 2026 assessment, and a value model I wrote from scratch. It explains each estimate.",
    standout: "A model card that compares against the obvious baseline, not against nothing",
    points: [
      "Explained estimates: how much community, type, age and lot each add",
      "Holdout accuracy, feature importance and the learning curve",
      "Train your own on a sample and compare it with production",
    ],
    stack: ["Gradient boosting", "TypeScript", "DuckDB", "Two City datasets"],
    askLabel: "Ask the housing data",
    inYourTeam: [
      {
        technique: "An explainable model, scored against a simple rule",
        translation:
          "Lead and churn scores reps trust, because each score shows why and beats the rule of thumb.",
      },
      {
        technique: "A fixed holdout set",
        translation: "Honest results for a model or campaign, measured on customers it never saw.",
      },
      {
        technique: "Retraining in minutes",
        translation: "Analysts test an idea the same afternoon instead of filing an engineering ticket.",
      },
    ],
    decisions: [
      {
        decision: "Gradient boosting written from scratch in TypeScript",
        why: "The same code trains in the weekly pipeline and in your browser.",
        tradeoff: "A library like LightGBM is faster. At 390,000 homes, 23 seconds is fine.",
      },
      {
        decision: "Encode community and zoning out of fold",
        why: "A home’s own value can’t leak into its features.",
        tradeoff: "Training is slower. Without it, the accuracy numbers would be inflated.",
      },
      {
        decision: "Predict the assessed value, and say so plainly",
        why: "Sale prices aren’t open data in Calgary.",
        tradeoff: "Less exciting than a “price predictor”, but it’s true.",
      },
    ],
  },
  {
    dataset: "flames",
    href: "/lab/flames",
    number: "03",
    kicker: "NHL play-by-play",
    title: "Flames, shot by shot",
    lede: "Every Flames shot attempt since 2021-22, including this season. Where they shoot from, and where goals come from.",
    standout: "Shot-level goals reconciled to the official score for every game",
    points: [
      "Shot map on a to-scale rink, with strength and team filters",
      "Coordinates normalized in SQL so every shooter attacks the same net",
      "Live runs check the NHL for new games through a locked-down proxy",
    ],
    stack: ["NHL API", "Edge proxy", "DuckDB", "SVG"],
    askLabel: "Ask the Flames data",
    inYourTeam: [
      {
        technique: "Reconciling detail to the official total",
        translation:
          "Attribution that ties back to booked revenue, so finance and marketing report one number.",
      },
      {
        technique: "A locked-down API proxy",
        translation:
          "Ad, CRM and ticketing data pulled safely, with rate limits and only the endpoints you need.",
      },
      {
        technique: "Raw events modelled in SQL",
        translation: "Messy app and ad-platform events turned into one consistent view of each customer.",
      },
    ],
    decisions: [
      {
        decision: "Flatten JSON in TypeScript, keep business rules in SQL",
        why: "Rules like power play and shot direction stay readable and testable in one place.",
        tradeoff: "Two languages in the pipeline, with a clear line between them.",
      },
      {
        decision: "Proxy exactly two NHL URL shapes",
        why: "The NHL API blocks browsers, and an open proxy would be abused.",
        tradeoff: "A new endpoint needs a code change. That’s the point.",
      },
      {
        decision: "Cache finished games forever",
        why: "A finished game rarely changes, so each one is fetched once.",
        tradeoff: "A late correction by the NHL wouldn’t be picked up without clearing the cache.",
      },
    ],
  },
];

export const labFor = (dataset: DatasetKey) => labs.find((l) => l.dataset === dataset)!;
