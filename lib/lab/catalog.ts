import type { DatasetKey } from "./datasets";

/** The labs, in display order. Shared by the /lab index and each lab's header. */
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
};

export const labs: LabEntry[] = [
  {
    dataset: "permits",
    href: "/lab/calgary",
    number: "01",
    kicker: "City of Calgary open data",
    title: "Where Calgary is building",
    lede: "Every building permit application since 2015: how many homes were permitted, how long permits took, and which communities are growing.",
    standout: "Incremental loads that catch status changes, not just new rows",
    points: [
      "Housing units, time to permit and top communities, with a dot map",
      "Live runs pull only what the City changed since the snapshot",
      "Warnings surface real source issues, like permits completed before they were issued",
    ],
    stack: ["Socrata API", "DuckDB", "Parquet", "Canvas"],
  },
  {
    dataset: "housing",
    href: "/lab/housing",
    number: "02",
    kicker: "Machine learning",
    title: "What’s a Calgary home worth?",
    lede: "Every home’s 2026 assessment, and a gradient-boosted value model written from scratch that explains each estimate and can be retrained in your browser.",
    standout: "A model card that compares against the obvious baseline, not against nothing",
    points: [
      "Explained estimates: how much community, type, age and lot each add",
      "Holdout accuracy, feature importance and the learning curve",
      "Train your own on a sample and compare it with production",
    ],
    stack: ["Gradient boosting", "TypeScript", "DuckDB", "Two City datasets"],
  },
  {
    dataset: "flames",
    href: "/lab/flames",
    number: "03",
    kicker: "NHL play-by-play",
    title: "Flames, shot by shot",
    lede: "Every Flames shot attempt since 2021-22, including the season in progress: where they shoot from, where goals come from, and each season’s points race.",
    standout: "Shot-level goals reconciled to the official score for every game",
    points: [
      "Shot map on a to-scale rink, with strength and team filters",
      "Coordinates normalized in SQL so every shooter attacks the same net",
      "Live runs check the NHL for new games through a locked-down proxy",
    ],
    stack: ["NHL API", "Edge proxy", "DuckDB", "SVG"],
  },
];

export const labFor = (dataset: DatasetKey) => labs.find((l) => l.dataset === dataset)!;
