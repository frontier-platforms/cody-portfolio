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
    dataset: "flames",
    href: "/lab/flames",
    number: "01",
    kicker: "NHL play-by-play",
    title: "Calgary Flames shot analysis",
    lede: "Every Flames shot attempt since 2021-22, including this season. Where they shoot from, and where goals come from.",
    standout: "Shot-level goals reconciled to the official score for every game",
    points: [
      "Shot map on a to-scale rink, with strength and team filters",
      "Coordinates normalized in SQL so every shooter attacks the same net",
      "Live runs check the NHL for new games through a locked-down proxy",
    ],
    stack: ["NHL API", "dbt", "DuckDB", "Edge proxy"],
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
        decision: "Keep the hockey rules in one place",
        why: "Rules like what counts as a power play live in one tested spot, so every chart agrees.",
        tradeoff: "The raw NHL data needs a separate clean-up step first.",
      },
      {
        decision: "Only allow the two NHL requests the site needs",
        why: "The NHL blocks direct browser access, so the site relays requests. Locking it down stops misuse.",
        tradeoff: "Adding a new kind of NHL data takes a small code change.",
      },
      {
        decision: "Download each finished game once",
        why: "Final results don’t change, so there’s no need to fetch them again.",
        tradeoff: "If the NHL corrects an old game, the fix needs a manual refresh.",
      },
    ],
  },
  {
    dataset: "housing",
    href: "/lab/housing",
    number: "02",
    kicker: "Machine learning",
    title: "What’s a Calgary home worth?",
    lede: "Every home’s 2026 assessment, and a value model trained in Python. It explains each estimate.",
    standout: "A model card that compares against the obvious baseline, not against nothing",
    points: [
      "Explained estimates: how much community, type, age and lot each add",
      "Holdout accuracy, feature importance and the learning curve",
      "Train your own in Python, in your browser, and compare it with production",
    ],
    stack: ["XGBoost", "Python", "dbt", "Pyodide"],
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
        decision: "Train the model in Python, run it in the browser",
        why: "Python is the standard for machine learning. Estimates still appear instantly, with nothing to install.",
        tradeoff: "Two languages to keep in step, so an automated test checks they agree.",
      },
      {
        decision: "Never let a home’s own value leak into its inputs",
        why: "Otherwise the model would look more accurate than it really is.",
        tradeoff: "Training takes longer. Honest accuracy numbers are worth it.",
      },
      {
        decision: "Predict the assessed value, and say so plainly",
        why: "Sale prices aren’t open data in Calgary.",
        tradeoff: "Less exciting than a “price predictor”, but it’s true.",
      },
    ],
  },
  {
    dataset: "permits",
    href: "/lab/calgary",
    number: "03",
    kicker: "City of Calgary open data",
    title: "Where Calgary is building",
    lede: "Every building permit since 2015. How many homes were permitted, how long it took, and where.",
    standout: "Incremental loads that catch status changes on old permits as well as new ones",
    points: [
      "Housing units, time to permit and top communities, with a dot map",
      "Live runs pull only what the City changed since the snapshot",
      "Warnings surface real source issues, like permits completed before they were issued",
    ],
    stack: ["Socrata API", "dbt", "DuckDB", "Airflow"],
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
        decision: "Catch updates to old permits as well as new ones",
        why: "Permits change status over time, so each refresh looks for anything that changed.",
        tradeoff: "Each refresh pulls more data. Correct counts are worth it.",
      },
      {
        decision: "Keep a copy of the data with the site",
        why: "The site never breaks because the City’s data service is down.",
        tradeoff: "Storage grows a little each week. I’d move it to cloud storage if it got large.",
      },
      {
        decision: "Warnings never block a refresh. Errors always do.",
        why: "Known data quirks stay visible without holding back fresh data.",
        tradeoff: "Someone has to read the warnings, so the page shows them to everyone.",
      },
    ],
  },
];

export const labFor = (dataset: DatasetKey) => labs.find((l) => l.dataset === dataset)!;
