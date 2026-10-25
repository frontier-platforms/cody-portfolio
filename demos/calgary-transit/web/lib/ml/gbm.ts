/**
 * Scores gradient-boosted trees trained with XGBoost in Python (pipeline/ml/resolution_model.py)
 * and exported to JSON. The pipeline checks this rule against XGBoost on every run.
 * Same approach as the portfolio's lib/ml/gbm.ts, kept here because the demo is its own app.
 */

/** One tree, flattened: node i is [feature, threshold, left, right, value, missingGoesLeft]. Leaves have feature -1. */
export type Tree = number[];
const STRIDE = 6;

export type GbmModel = { features: string[]; base: number; trees: Tree[]; gain: number[] };

function next(tree: Tree, node: number, x: number) {
  const o = node * STRIDE;
  const left = Number.isNaN(x) ? tree[o + 5] === 1 : Math.fround(x) < Math.fround(tree[o + 1]);
  return left ? tree[o + 2] : tree[o + 3];
}

/**
 * Log-odds and per-feature contributions for one row. Along each tree's path, the change in node
 * value at a split is credited to that split's feature, so bias + sum(contributions) = log-odds.
 */
export function explain(model: GbmModel, row: number[]) {
  const contributions = new Array<number>(model.features.length).fill(0);
  let bias = model.base;
  for (const tree of model.trees) {
    bias += tree[4];
    let node = 0;
    while (tree[node * STRIDE] >= 0) {
      const f = tree[node * STRIDE];
      const child = next(tree, node, row[f]);
      contributions[f] += tree[child * STRIDE + 4] - tree[node * STRIDE + 4];
      node = child;
    }
  }
  const logOdds = bias + contributions.reduce((a, b) => a + b, 0);
  return { bias, contributions, logOdds, probability: 1 / (1 + Math.exp(-logOdds)) };
}
