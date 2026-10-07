"""Calgary home value model.

Predicts the City's 2026 assessed value of a home from five public facts:
community, property type, zoning, year built and lot size. The target is the
log of the value, so errors are proportional.

This one module trains the production model in the weekly Airflow run
(ml/train.py) and the "train your own" model in the browser through Pyodide,
so it depends only on numpy, pandas and scikit-learn.

The trained trees are exported to a small JSON format that the site reads to
make predictions and explain them (lib/ml/gbm.ts). Tests in ml/tests check the
export predicts exactly what scikit-learn predicts.
"""

from __future__ import annotations

import time
from collections.abc import Callable

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

CATEGORICAL = ["community", "use", "zoning"]
NUMERIC = ["year_built", "lot_sqft"]
FEATURES = CATEGORICAL + NUMERIC
TARGET = "assessed_value"

SMOOTHING = 20  # rare categories shrink toward the overall mean
FOLDS = 5
MISSING = "∅"

DEFAULT_PARAMS = {
    "trees": 400,
    "depth": 6,
    "learning_rate": 0.15,
    "min_leaf": 20,
    "l2": 1.0,
    "seed": 42,
}

Progress = Callable[[int, float, float], None]


# ------------------------------------------------------------------ split


def is_test_row(key: int | str) -> bool:
    """Stable holdout: one home in five, chosen by an FNV-1a hash of its roll number."""
    h = 2166136261
    for ch in str(key):
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h % 5 == 0


# --------------------------------------------------------------- encoding


def fit_encoder(keys: pd.Series, y: np.ndarray) -> dict:
    """Smoothed mean of the log target per category."""
    keys = keys.fillna(MISSING).astype(str)
    mean = float(y.mean())
    stats = pd.DataFrame({"k": keys.to_numpy(), "y": y}).groupby("k")["y"].agg(["sum", "count"])
    values = (stats["sum"] + SMOOTHING * mean) / (stats["count"] + SMOOTHING)
    return {"mean": mean, "values": {str(k): float(v) for k, v in values.items()}}


def encode_column(encoder: dict, keys: pd.Series) -> np.ndarray:
    keys = keys.fillna(MISSING).astype(str)
    return keys.map(encoder["values"]).fillna(encoder["mean"]).to_numpy(dtype=float)


def numeric(df: pd.DataFrame, column: str) -> np.ndarray:
    return pd.to_numeric(df[column], errors="coerce").to_numpy(dtype=float)


def training_matrix(df: pd.DataFrame, y: np.ndarray, seed: int) -> tuple[np.ndarray, dict]:
    """Out-of-fold target encoding: each row is encoded by encoders fit on the other folds,
    so a home's own value never leaks into its features."""
    rng = np.random.default_rng(seed + 1)
    fold = rng.integers(0, FOLDS, size=len(df))
    X = np.empty((len(df), len(FEATURES)))
    for j, col in enumerate(CATEGORICAL):
        for k in range(FOLDS):
            fit, apply = fold != k, fold == k
            enc = fit_encoder(df[col][fit], y[fit])
            X[apply, j] = encode_column(enc, df[col][apply])
    for j, col in enumerate(NUMERIC, start=len(CATEGORICAL)):
        X[:, j] = numeric(df, col)
    encoders = {col: fit_encoder(df[col], y) for col in CATEGORICAL}
    return X, encoders


def scoring_matrix(df: pd.DataFrame, encoders: dict) -> np.ndarray:
    cats = [encode_column(encoders[c], df[c]) for c in CATEGORICAL]
    nums = [numeric(df, c) for c in NUMERIC]
    return np.column_stack(cats + nums)


# ----------------------------------------------------------------- metrics


def metrics(actual: np.ndarray, predicted: np.ndarray) -> dict:
    ape = np.abs(predicted - actual) / actual
    ss_res = float(((predicted - actual) ** 2).sum())
    ss_tot = float(((actual - actual.mean()) ** 2).sum())
    return {
        "mae": float(np.abs(predicted - actual).mean()),
        "mdape": float(np.median(ape)),
        "within10": float((ape <= 0.1).mean()),
        "r2": 1 - ss_res / ss_tot,
    }


def baseline(train: pd.DataFrame, test: pd.DataFrame) -> np.ndarray:
    """The bar to beat: the median value for that property type in that community."""
    by_group = train.groupby(["community", "use"])[TARGET].median()
    by_use = train.groupby("use")[TARGET].median()
    keys = pd.MultiIndex.from_frame(test[["community", "use"]])
    pred = by_group.reindex(keys).to_numpy()
    fallback = test["use"].map(by_use).to_numpy()
    return np.where(np.isnan(pred), fallback, pred).astype(float)


def rmse(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.sqrt(np.mean((a - b) ** 2)))


# ------------------------------------------------------------------ export


def export_trees(model: HistGradientBoostingRegressor) -> dict:
    """scikit-learn's fitted trees as flat arrays the browser can walk.

    Each node is [feature, threshold, left, right, value, missing_go_left].
    Leaves have feature -1. Leaf values already include the learning rate;
    internal values are scaled here so per-feature explanations add up.
    """
    lr = model.learning_rate
    trees = []
    gain = np.zeros(len(FEATURES))
    for (predictor,) in model._predictors:
        flat: list[float] = []
        for node in predictor.nodes:
            leaf = bool(node["is_leaf"])
            value = float(node["value"]) if leaf else float(node["value"]) * lr
            if not leaf:
                gain[int(node["feature_idx"])] += float(node["gain"])
            flat += [
                -1 if leaf else int(node["feature_idx"]),
                0.0 if leaf else round(float(node["num_threshold"]), 6),
                0 if leaf else int(node["left"]),
                0 if leaf else int(node["right"]),
                round(value, 7),
                1 if (not leaf and node["missing_go_to_left"]) else 0,
            ]
        trees.append(flat)
    return {
        "features": FEATURES,
        "base": float(np.ravel(model._baseline_prediction)[0]),
        "trees": trees,
        "gain": [round(float(g), 3) for g in gain],
    }


def typical_inputs(df: pd.DataFrame) -> dict:
    """Typical inputs per community and property type, used to prefill the predictor."""
    out: dict = {}
    for (community, use), g in df.groupby(["community", "use"]):
        if len(g) < 10:
            continue
        years = g["year_built"].dropna()
        lots = g["lot_sqft"].dropna()
        zoning = g["zoning"].dropna()
        out.setdefault(str(community), {})[str(use)] = {
            "year_built": int(years.median()) if len(years) else None,
            "lot_sqft": int(lots.median()) if len(lots) else None,
            "zoning": str(zoning.mode().iloc[0]) if len(zoning) else None,
            "value": float(g[TARGET].median()),
            "homes": len(g),
        }
    return out


# ------------------------------------------------------------------- train


def train(
    rows: pd.DataFrame,
    params: dict | None = None,
    on_progress: Progress | None = None,
    step: int = 10,
    include_typical: bool = True,
) -> dict:
    """Train, evaluate on the fixed holdout, and return the exported model.

    Trees are added `step` at a time with warm_start, so the learning curve is
    measured on the holdout as training happens.
    """
    p = {**DEFAULT_PARAMS, **(params or {})}
    started = time.perf_counter()

    rows = rows.reset_index(drop=True)
    test_mask = rows["key"].map(is_test_row).to_numpy(dtype=bool)
    train_df, test_df = rows[~test_mask].reset_index(drop=True), rows[test_mask].reset_index(drop=True)
    y_train = np.log(train_df[TARGET].to_numpy(dtype=float))
    y_test = np.log(test_df[TARGET].to_numpy(dtype=float))

    X_train, encoders = training_matrix(train_df, y_train, p["seed"])
    X_test = scoring_matrix(test_df, encoders)

    model = HistGradientBoostingRegressor(
        learning_rate=p["learning_rate"],
        max_depth=p["depth"],
        max_leaf_nodes=None,
        min_samples_leaf=p["min_leaf"],
        l2_regularization=p["l2"],
        max_iter=0,
        early_stopping=False,
        warm_start=True,
        random_state=p["seed"],
    )
    curve = []
    built = 0
    while built < p["trees"]:
        built = min(built + step, p["trees"])
        model.set_params(max_iter=built)
        model.fit(X_train, y_train)
        point = {
            "tree": built,
            "train": round(rmse(y_train, model.predict(X_train)), 4),
            "valid": round(rmse(y_test, model.predict(X_test)), 4),
        }
        curve.append(point)
        if on_progress:
            on_progress(built, point["train"], point["valid"])

    log_pred = model.predict(X_test)
    actual = test_df[TARGET].to_numpy(dtype=float)
    residuals = np.sort(y_test - log_pred)
    gbm = export_trees(model)
    total_gain = sum(gbm["gain"]) or 1.0

    return {
        "version": 2,
        "trainedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "target": "City of Calgary assessed value, 2026 roll",
        "library": "scikit-learn HistGradientBoostingRegressor",
        "params": p,
        "rows": {"train": len(train_df), "test": len(test_df)},
        "trainMs": int((time.perf_counter() - started) * 1000),
        "encoders": encoders,
        "gbm": gbm,
        "importance": sorted(
            ({"feature": f, "share": g / total_gain} for f, g in zip(FEATURES, gbm["gain"])),
            key=lambda x: -x["share"],
        ),
        "metrics": {
            "model": metrics(actual, np.exp(log_pred)),
            "baseline": metrics(actual, baseline(train_df, test_df)),
        },
        "interval": {
            "p10": float(residuals[int(len(residuals) * 0.1)]),
            "p90": float(residuals[int(len(residuals) * 0.9)]),
        },
        "typical": typical_inputs(rows) if include_typical else {},
        "uses": [{"code": u, "label": u} for u in sorted(rows["use"].dropna().unique())],
        "learningCurve": curve,
    }


def train_from_columns(
    columns: dict, params: dict | None = None, on_progress: Progress | None = None
) -> dict:
    """Browser entry point: columns arrive from DuckDB-WASM as {name: list}."""
    return train(pd.DataFrame(columns), params, on_progress, include_typical=False)
