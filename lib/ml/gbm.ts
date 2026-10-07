/**
 * Inference for gradient-boosted trees trained with XGBoost in Python
 * (ml/housing_model.py) and exported to JSON. The browser only predicts and
 * explains; training happens in Python, in the weekly run or in your browser
 * through Pyodide.
 *
 * ml/tests and scripts/check-ml-parity.ts check these predictions match
 * XGBoost's.
 */

/** One tree, flattened: node i is [feature, threshold, left, right, value, missingGoesLeft]. Leaves have feature -1. */
export type Tree = number[];
const STRIDE = 6;

export type GbmModel = {
  features: string[];
  base: number;
  trees: Tree[];
  /** Total split gain per feature, a standard importance measure. */
  gain: number[];
};

/** XGBoost's rule: missing values follow the learned default; others go left when, compared as 32-bit floats, they're below the threshold. */
function next(tree: Tree, node: number, x: number) {
  const o = node * STRIDE;
  const left = Number.isNaN(x) ? tree[o + 5] === 1 : Math.fround(x) < Math.fround(tree[o + 1]);
  return left ? tree[o + 2] : tree[o + 3];
}

function predictTree(tree: Tree, row: number[]) {
  let node = 0;
  while (tree[node * STRIDE] >= 0) node = next(tree, node, row[tree[node * STRIDE]]);
  return tree[node * STRIDE + 4];
}

export function predict(model: GbmModel, row: number[]) {
  let s = model.base;
  for (const tree of model.trees) s += predictTree(tree, row);
  return s;
}

/**
 * Per-feature contributions for one prediction: along each tree's path, the
 * change in node value at a split is credited to that split's feature.
 * bias + sum(contributions) equals the prediction exactly.
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
  return { bias, contributions };
}
