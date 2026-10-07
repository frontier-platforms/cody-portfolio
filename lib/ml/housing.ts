import { explain, predict, type GbmModel } from "./gbm";

/**
 * The home value model as the site sees it: the shape of the exported model
 * file and how to turn a home into an explained estimate. Training lives in
 * Python: ml/housing_model.py.
 */

export const CATEGORICAL = ["community", "use", "zoning"] as const;
export const NUMERIC = ["year_built", "lot_sqft"] as const;
export const FEATURES = [...CATEGORICAL, ...NUMERIC] as const;
export type Feature = (typeof FEATURES)[number];

export const FEATURE_LABELS: Record<Feature, string> = {
  community: "Community",
  use: "Property type",
  zoning: "Zoning",
  year_built: "Year built",
  lot_sqft: "Lot size",
};

export type HomeInput = {
  community: string;
  use: string;
  zoning: string | null;
  year_built: number | null;
  lot_sqft: number | null;
};

/** Smoothed mean of the log target per category. */
export type Encoder = { mean: number; values: Record<string, number> };

export type Metrics = { mae: number; mdape: number; within10: number; r2: number };

export type Typical = {
  year_built: number | null;
  lot_sqft: number | null;
  zoning: string | null;
  value: number;
  homes: number;
};

/** The JSON written by ml/housing_model.py. */
export type HousingModel = {
  version: 2;
  trainedAt: string;
  target: string;
  library: string;
  params: { trees: number; depth: number; learning_rate: number; min_leaf: number; l2: number; seed: number };
  rows: { train: number; test: number };
  trainMs: number;
  encoders: Record<(typeof CATEGORICAL)[number], Encoder>;
  gbm: GbmModel;
  importance: { feature: Feature; share: number }[];
  metrics: { model: Metrics; baseline: Metrics };
  /** Holdout log-residual quantiles, for an 80% range around each estimate. */
  interval: { p10: number; p90: number };
  /** Typical inputs per community and property type, used to prefill the predictor. */
  typical: Record<string, Record<string, Typical>>;
  uses: { code: string; label: string }[];
  learningCurve: { tree: number; train: number; valid: number }[];
};

const MISSING = "∅";

function encode(enc: Encoder, key: string | null) {
  return enc.values[key ?? MISSING] ?? enc.mean;
}

const numeric = (v: number | null) => (v == null || Number.isNaN(v) ? NaN : v);

export function toFeatureRow(encoders: HousingModel["encoders"], input: HomeInput): number[] {
  return [...CATEGORICAL.map((f) => encode(encoders[f], input[f])), ...NUMERIC.map((f) => numeric(input[f]))];
}

export type Estimate = {
  value: number;
  low: number;
  high: number;
  /** Each feature's effect as a multiplier on the value, e.g. 1.18 = +18%. */
  effects: { feature: Feature; effect: number }[];
  /** What the model would say with no information beyond the city-wide average. */
  start: number;
};

export function estimate(
  model: Pick<HousingModel, "encoders" | "gbm" | "interval">,
  input: HomeInput,
): Estimate {
  const row = toFeatureRow(model.encoders, input);
  const log = predict(model.gbm, row);
  const { bias, contributions } = explain(model.gbm, row);
  return {
    value: Math.exp(log),
    low: Math.exp(log + model.interval.p10),
    high: Math.exp(log + model.interval.p90),
    start: Math.exp(bias),
    effects: FEATURES.map((feature, f) => ({ feature, effect: Math.exp(contributions[f]) })),
  };
}
