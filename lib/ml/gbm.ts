/**
 * Gradient-boosted regression trees, written from scratch so the same code
 * trains in Node (the weekly pipeline) and in the browser (the Lab's "train
 * your own" panel). Dependency-free and deterministic for a given seed.
 *
 * Squared-error boosting with:
 *  - histogram splits: each feature is bucketed into up to `bins` quantile
 *    bins once, so finding a split is a scan over bins, not rows
 *  - row subsampling per tree (stochastic gradient boosting)
 *  - L2 leaf regularization (`lambda`) and a minimum leaf size
 *  - missing values always routed left
 *  - per-prediction explanations by walking the path (Saabas contributions)
 */

/** One tree, flattened: node i is [feature, threshold, left, right, value]. Leaves have feature -1. */
export type Tree = number[];
const STRIDE = 5;

export type GbmModel = {
  features: string[];
  base: number;
  trees: Tree[];
  /** Total split gain per feature, a standard importance measure. */
  gain: number[];
};

export type TrainOptions = {
  trees: number;
  depth: number;
  learningRate: number;
  minLeaf: number;
  subsample: number;
  lambda: number;
  bins: number;
  seed: number;
  /** Called after each tree with RMSE on train and validation. Await it to yield to the UI. */
  onTree?: (i: number, trainRmse: number, validRmse: number | null) => void | Promise<void>;
};

export const defaultOptions: TrainOptions = {
  trees: 200,
  depth: 6,
  learningRate: 0.1,
  minLeaf: 20,
  subsample: 0.8,
  lambda: 1,
  bins: 64,
  seed: 42,
};

/** Column-major feature matrix: X[f][i] is feature f of row i. NaN means missing. */
export type Matrix = Float64Array[];

/** Small, fast, seedable PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Quantile cut points for one feature, from a sample of its non-missing values. */
function cutPoints(col: Float64Array, bins: number, random: () => number): number[] {
  const sample: number[] = [];
  const step = Math.max(1, Math.floor(col.length / 20_000));
  for (let i = Math.floor(random() * step); i < col.length; i += step)
    if (!Number.isNaN(col[i])) sample.push(col[i]);
  sample.sort((a, b) => a - b);
  const cuts: number[] = [];
  for (let b = 1; b < bins; b++) {
    const v = sample[Math.floor((b / bins) * sample.length)];
    if (v !== undefined && v !== cuts[cuts.length - 1]) cuts.push(v);
  }
  return cuts;
}

/** Bin index per row: 0 for missing, k + 1 when x <= cuts[k], cuts.length + 1 above all cuts. */
function binColumn(col: Float64Array, cuts: number[]): Uint8Array {
  const out = new Uint8Array(col.length);
  for (let i = 0; i < col.length; i++) {
    const x = col[i];
    if (Number.isNaN(x)) continue;
    let lo = 0;
    let hi = cuts.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (x <= cuts[mid]) hi = mid;
      else lo = mid + 1;
    }
    out[i] = lo + 1;
  }
  return out;
}

function predictTree(tree: Tree, X: Matrix, i: number) {
  let node = 0;
  for (;;) {
    const o = node * STRIDE;
    const f = tree[o];
    if (f < 0) return tree[o + 4];
    const x = X[f][i];
    node = Number.isNaN(x) || x <= tree[o + 1] ? tree[o + 2] : tree[o + 3];
  }
}

function predictTreeRow(tree: Tree, row: number[]) {
  let node = 0;
  for (;;) {
    const o = node * STRIDE;
    const f = tree[o];
    if (f < 0) return tree[o + 4];
    const x = row[f];
    node = Number.isNaN(x) || x <= tree[o + 1] ? tree[o + 2] : tree[o + 3];
  }
}

const rmse = (y: Float64Array, p: Float64Array) => {
  let s = 0;
  for (let i = 0; i < y.length; i++) s += (y[i] - p[i]) ** 2;
  return Math.sqrt(s / y.length);
};

const yieldToEventLoop = () => new Promise<void>((r) => setTimeout(r, 0));

export async function train(
  X: Matrix,
  y: Float64Array,
  features: string[],
  opts: Partial<TrainOptions> = {},
  valid?: { X: Matrix; y: Float64Array },
): Promise<GbmModel> {
  const o = { ...defaultOptions, ...opts };
  const n = y.length;
  const F = X.length;
  const random = rng(o.seed);

  const cuts = X.map((col) => cutPoints(col, o.bins, random));
  const binned = X.map((col, f) => binColumn(col, cuts[f]));
  const nBins = cuts.map((c) => c.length + 2);

  let base = 0;
  for (let i = 0; i < n; i++) base += y[i];
  base /= n;

  const pred = new Float64Array(n).fill(base);
  const validPred = valid ? new Float64Array(valid.y.length).fill(base) : null;
  const grad = new Float64Array(n);
  const gain = new Array<number>(F).fill(0);
  const trees: Tree[] = [];

  // Reusable histogram buffers, one per feature.
  const histG = nBins.map((b) => new Float64Array(b));
  const histN = nBins.map((b) => new Uint32Array(b));

  for (let t = 0; t < o.trees; t++) {
    for (let i = 0; i < n; i++) grad[i] = y[i] - pred[i];

    // Row subsample for this tree.
    const picked: number[] = [];
    for (let i = 0; i < n; i++) if (random() < o.subsample) picked.push(i);
    const rootRows = Uint32Array.from(picked);

    const tree: Tree = [];
    const queue: { rows: Uint32Array; depth: number; slot: number }[] = [];
    const addNode = () => {
      tree.push(-1, 0, 0, 0, 0);
      return tree.length / STRIDE - 1;
    };
    queue.push({ rows: rootRows, depth: 0, slot: addNode() });

    while (queue.length) {
      const { rows, depth, slot } = queue.shift()!;
      let G = 0;
      for (let k = 0; k < rows.length; k++) G += grad[rows[k]];
      const count = rows.length;
      tree[slot * STRIDE + 4] = (o.learningRate * G) / (count + o.lambda);
      if (depth >= o.depth || count < 2 * o.minLeaf) continue;

      const parentScore = (G * G) / (count + o.lambda);
      let best = { gain: 0, f: -1, bin: -1 };

      for (let f = 0; f < F; f++) {
        const hG = histG[f];
        const hN = histN[f];
        hG.fill(0);
        hN.fill(0);
        const b = binned[f];
        for (let k = 0; k < rows.length; k++) {
          const r = rows[k];
          hG[b[r]] += grad[r];
          hN[b[r]]++;
        }
        let GL = hG[0];
        let NL = hN[0];
        // Split after bin `bin`: left gets missing plus bins 1..bin.
        for (let bin = 1; bin < nBins[f] - 1; bin++) {
          GL += hG[bin];
          NL += hN[bin];
          const NR = count - NL;
          if (NL < o.minLeaf) continue;
          if (NR < o.minLeaf) break;
          const GR = G - GL;
          const g = (GL * GL) / (NL + o.lambda) + (GR * GR) / (NR + o.lambda) - parentScore;
          if (g > best.gain) best = { gain: g, f, bin };
        }
      }
      if (best.f < 0) continue;

      const b = binned[best.f];
      const left: number[] = [];
      const right: number[] = [];
      for (let k = 0; k < rows.length; k++) (b[rows[k]] <= best.bin ? left : right).push(rows[k]);

      const o5 = slot * STRIDE;
      tree[o5] = best.f;
      tree[o5 + 1] = cuts[best.f][best.bin - 1];
      const l = addNode();
      const r = addNode();
      tree[o5 + 2] = l;
      tree[o5 + 3] = r;
      gain[best.f] += best.gain;
      queue.push({ rows: Uint32Array.from(left), depth: depth + 1, slot: l });
      queue.push({ rows: Uint32Array.from(right), depth: depth + 1, slot: r });
    }

    trees.push(tree);
    for (let i = 0; i < n; i++) pred[i] += predictTree(tree, X, i);
    if (valid && validPred)
      for (let i = 0; i < valid.y.length; i++) validPred[i] += predictTree(tree, valid.X, i);

    if (o.onTree) {
      await o.onTree(t, rmse(y, pred), valid && validPred ? rmse(valid.y, validPred) : null);
      await yieldToEventLoop();
    }
  }

  return { features, base, trees, gain };
}

export function predict(model: GbmModel, row: number[]) {
  let s = model.base;
  for (const tree of model.trees) s += predictTreeRow(tree, row);
  return s;
}

export function predictMatrix(model: GbmModel, X: Matrix, n: number) {
  const out = new Float64Array(n).fill(model.base);
  for (const tree of model.trees) for (let i = 0; i < n; i++) out[i] += predictTree(tree, X, i);
  return out;
}

/**
 * Per-feature contributions for one prediction: along each tree's path, the
 * change in node value at a split is credited to that split's feature.
 * base + bias + sum(contributions) equals the prediction exactly.
 */
export function explain(model: GbmModel, row: number[]) {
  const contributions = new Array<number>(model.features.length).fill(0);
  let bias = model.base;
  for (const tree of model.trees) {
    let node = 0;
    bias += tree[4];
    for (;;) {
      const o = node * STRIDE;
      const f = tree[o];
      if (f < 0) break;
      const x = row[f];
      const next = Number.isNaN(x) || x <= tree[o + 1] ? tree[o + 2] : tree[o + 3];
      contributions[f] += tree[next * STRIDE + 4] - tree[o + 4];
      node = next;
    }
  }
  return { bias, contributions };
}

/** Rounds values so the serialized model stays small. */
export function compact(model: GbmModel): GbmModel {
  const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
  return {
    ...model,
    base: round(model.base, 6),
    gain: model.gain.map((g) => round(g, 2)),
    trees: model.trees.map((t) =>
      t.map((v, i) => (i % STRIDE === 4 ? round(v, 6) : i % STRIDE === 1 ? round(v, 4) : v)),
    ),
  };
}
