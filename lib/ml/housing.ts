import {
  compact,
  explain,
  predict,
  predictMatrix,
  rng,
  train,
  type GbmModel,
  type Matrix,
  type TrainOptions,
} from "./gbm";

/**
 * The housing value model: features, encoding, evaluation and the shape of
 * the model file the browser loads. Shared by the weekly pipeline (which trains
 * the production model) and the Lab's "train your own" panel.
 *
 * Target: log of the City's 2026 assessed value. Training on the log makes
 * errors proportional, so a $50k miss on a $400k condo counts more than on a
 * $2M house.
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

export type HomeRow = {
  community: string;
  use: string;
  zoning: string | null;
  year_built: number | null;
  lot_sqft: number | null;
  assessed_value: number;
};

/** Smoothed mean of the log target per category. Rare categories shrink toward the overall mean. */
export type Encoder = { mean: number; values: Record<string, number> };

const SMOOTHING = 20;
const FOLDS = 5;

function fitEncoder(keys: (string | null)[], y: Float64Array, idx: ArrayLike<number>): Encoder {
  let total = 0;
  const sums = new Map<string, { s: number; n: number }>();
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    total += y[i];
    const key = keys[i] ?? "∅";
    const e = sums.get(key) ?? { s: 0, n: 0 };
    e.s += y[i];
    e.n++;
    sums.set(key, e);
  }
  const mean = total / idx.length;
  const values: Record<string, number> = {};
  for (const [key, { s, n }] of sums) values[key] = (s + SMOOTHING * mean) / (n + SMOOTHING);
  return { mean, values };
}

const encode = (enc: Encoder, key: string | null) => enc.values[key ?? "∅"] ?? enc.mean;

const round4 = (v: number) => Math.round(v * 1e4) / 1e4;

const numeric = (v: number | null) => (v == null || Number.isNaN(v) ? NaN : v);

/**
 * Builds the training matrix. Categorical features are target-encoded
 * out-of-fold: each row's encoding comes from encoders fit on the other folds,
 * so the model never sees its own target leak in through the encoding.
 */
function trainingMatrix(rows: HomeRow[], y: Float64Array, seed: number) {
  const n = rows.length;
  const random = rng(seed + 1);
  const fold = Uint8Array.from({ length: n }, () => Math.floor(random() * FOLDS));
  const X: Matrix = FEATURES.map(() => new Float64Array(n));

  CATEGORICAL.forEach((feature, f) => {
    const keys = rows.map((r) => r[feature]);
    for (let k = 0; k < FOLDS; k++) {
      const fitIdx: number[] = [];
      for (let i = 0; i < n; i++) if (fold[i] !== k) fitIdx.push(i);
      const enc = fitEncoder(keys, y, fitIdx);
      for (let i = 0; i < n; i++) if (fold[i] === k) X[f][i] = encode(enc, keys[i]);
    }
  });
  NUMERIC.forEach((feature, j) => {
    const f = CATEGORICAL.length + j;
    for (let i = 0; i < n; i++) X[f][i] = numeric(rows[i][feature]);
  });

  const all = Uint32Array.from({ length: n }, (_, i) => i);
  const encoders = Object.fromEntries(
    CATEGORICAL.map((feature) => [
      feature,
      fitEncoder(
        rows.map((r) => r[feature]),
        y,
        all,
      ),
    ]),
  ) as Record<(typeof CATEGORICAL)[number], Encoder>;
  return { X, encoders };
}

export type HomeInput = Pick<HomeRow, Feature>;

export function toFeatureRow(encoders: HousingModel["encoders"], input: HomeInput): number[] {
  return [...CATEGORICAL.map((f) => encode(encoders[f], input[f])), ...NUMERIC.map((f) => numeric(input[f]))];
}

function scoringMatrix(encoders: HousingModel["encoders"], rows: HomeRow[]): Matrix {
  const X: Matrix = FEATURES.map(() => new Float64Array(rows.length));
  rows.forEach((r, i) => toFeatureRow(encoders, r).forEach((v, f) => (X[f][i] = v)));
  return X;
}

export type Metrics = {
  /** Mean absolute error in dollars. */
  mae: number;
  /** Median absolute percentage error. */
  mdape: number;
  /** Share of homes predicted within 10% of the assessed value. */
  within10: number;
  /** R² on dollar values. */
  r2: number;
};

export function metrics(actual: number[], predicted: number[]): Metrics {
  const n = actual.length;
  const ape = actual.map((a, i) => Math.abs(predicted[i] - a) / a).sort((a, b) => a - b);
  const mean = actual.reduce((s, a) => s + a, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  let abs = 0;
  for (let i = 0; i < n; i++) {
    abs += Math.abs(predicted[i] - actual[i]);
    ssRes += (predicted[i] - actual[i]) ** 2;
    ssTot += (actual[i] - mean) ** 2;
  }
  return {
    mae: abs / n,
    mdape: ape[Math.floor(n / 2)],
    within10: ape.filter((e) => e <= 0.1).length / n,
    r2: 1 - ssRes / ssTot,
  };
}

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** The bar to beat: the median value of the same property type in the same community. */
function baseline(trainRows: HomeRow[], testRows: HomeRow[]) {
  const groups = new Map<string, number[]>();
  const byUse = new Map<string, number[]>();
  for (const r of trainRows) {
    const k = `${r.community}|${r.use}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r.assessed_value);
    (byUse.get(r.use) ?? byUse.set(r.use, []).get(r.use)!).push(r.assessed_value);
  }
  const med = new Map([...groups].map(([k, v]) => [k, median(v)]));
  const useMed = new Map([...byUse].map(([k, v]) => [k, median(v)]));
  return testRows.map((r) => med.get(`${r.community}|${r.use}`) ?? useMed.get(r.use) ?? 0);
}

/** Deterministic split so the same home lands in the same set every run. */
export function isTestRow(key: number | string) {
  const s = String(key);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 5 === 0;
}

export type Typical = {
  year_built: number | null;
  lot_sqft: number | null;
  zoning: string | null;
  value: number;
  homes: number;
};

export type HousingModel = {
  version: 1;
  trainedAt: string;
  target: string;
  params: Partial<TrainOptions>;
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

function typicalInputs(rows: HomeRow[]) {
  const groups = new Map<string, HomeRow[]>();
  for (const r of rows) {
    const k = `${r.community}|${r.use}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  const typical: HousingModel["typical"] = {};
  for (const [k, list] of groups) {
    if (list.length < 10) continue;
    const [community, use] = k.split("|");
    const years = list.map((r) => r.year_built).filter((v): v is number => v != null);
    const lots = list.map((r) => r.lot_sqft).filter((v): v is number => v != null);
    const zoning = new Map<string, number>();
    for (const r of list) if (r.zoning) zoning.set(r.zoning, (zoning.get(r.zoning) ?? 0) + 1);
    (typical[community] ??= {})[use] = {
      year_built: years.length ? Math.round(median(years)) : null,
      lot_sqft: lots.length ? Math.round(median(lots)) : null,
      zoning: [...zoning].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      value: median(list.map((r) => r.assessed_value)),
      homes: list.length,
    };
  }
  return typical;
}

/**
 * Trains and evaluates a model. `rows` carries a stable `key` for the
 * train/test split. Progress callbacks report RMSE on log value per tree.
 */
export async function trainHousingModel(
  rows: (HomeRow & { key: number | string })[],
  uses: { code: string; label: string }[],
  params: Partial<TrainOptions> = {},
  onTree?: TrainOptions["onTree"],
): Promise<HousingModel> {
  const started = Date.now();
  const trainRows = rows.filter((r) => !isTestRow(r.key));
  const testRows = rows.filter((r) => isTestRow(r.key));
  const yTrain = Float64Array.from(trainRows, (r) => Math.log(r.assessed_value));
  const yTest = Float64Array.from(testRows, (r) => Math.log(r.assessed_value));

  const { X, encoders } = trainingMatrix(trainRows, yTrain, params.seed ?? 42);
  const XTest = scoringMatrix(encoders, testRows);

  const curve: HousingModel["learningCurve"] = [];
  const gbm = await train(
    X,
    yTrain,
    [...FEATURES],
    {
      ...params,
      onTree: async (i, trainRmse, validRmse) => {
        curve.push({ tree: i + 1, train: round4(trainRmse), valid: round4(validRmse ?? NaN) });
        await onTree?.(i, trainRmse, validRmse);
      },
    },
    { X: XTest, y: yTest },
  );

  const logPred = predictMatrix(gbm, XTest, testRows.length);
  const actual = testRows.map((r) => r.assessed_value);
  const predicted = Array.from(logPred, Math.exp);
  const residuals = Array.from(yTest, (y, i) => y - logPred[i]).sort((a, b) => a - b);
  const totalGain = gbm.gain.reduce((s, g) => s + g, 0) || 1;

  const model: HousingModel = {
    version: 1,
    trainedAt: new Date().toISOString(),
    target: "City of Calgary assessed value, 2026 roll",
    params,
    rows: { train: trainRows.length, test: testRows.length },
    trainMs: Date.now() - started,
    encoders,
    gbm: compact(gbm),
    importance: FEATURES.map((feature, f) => ({ feature, share: gbm.gain[f] / totalGain })).sort(
      (a, b) => b.share - a.share,
    ),
    metrics: { model: metrics(actual, predicted), baseline: metrics(actual, baseline(trainRows, testRows)) },
    interval: {
      p10: residuals[Math.floor(residuals.length * 0.1)],
      p90: residuals[Math.floor(residuals.length * 0.9)],
    },
    typical: typicalInputs(rows),
    uses,
    learningCurve: curve,
  };
  return model;
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
