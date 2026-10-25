"""Will a Calgary Transit 311 request be closed within 7 days?

An XGBoost classifier trained in the daily Airflow run on the governed silver facts.
It uses only what is known when a request is filed (request type, category, program,
channel, community and timing), so it can score a request the moment it arrives.

Evaluation is honest about time: the model is trained on 2022 to 2024 and scored on 2025,
a year it never saw, against a baseline of each request type's historical rate. The
shipped model is then retrained on every labelled request. Trees are exported to JSON
for the website to score in the browser, and the export is checked against XGBoost.
"""

from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd
import xgboost as xgb

from pipeline.ingestion.socrata import REPO_ROOT, warehouse_path

OUT = REPO_ROOT / "web" / "public" / "data" / "resolution_model.json"

CATEGORICAL = ["service_name", "service_category", "program", "intake_channel", "community"]
NUMERIC = ["recent_pace", "workload_30d", "month", "weekday"]
FEATURES = CATEGORICAL + NUMERIC
LABEL_DAYS = 7
TEST_YEAR = 2025
# 2022 on: the post-pandemic pattern. Earlier years made 2025 predictions worse.
TRAIN_FROM = 2022
SMOOTHING = 50
FOLDS = 5
MISSING = "Not recorded"
PARAMS = {
    "objective": "binary:logistic",
    "eval_metric": "auc",
    "tree_method": "hist",
    "learning_rate": 0.08,
    "max_depth": 6,
    "min_child_weight": 20,
    "lambda": 1.0,
    "seed": 42,
}
TREES = 300

# Context features use only outcomes already known when a request is filed: a request's
# 7-day result is known 8 days later, so the "recent pace" window ends 8 days back.
CONTEXT = f"""
with base as (
    select
        service_name, service_category, program, intake_channel,
        coalesce(community_name, '{MISSING}') as community,
        requested_date,
        (closed_at is not null and days_to_close <= {LABEL_DAYS})::int as closed_in_7
    from silver.fct_service_requests
    where department = 'Calgary Transit' and not is_internal and requested_date >= date '{TRAIN_FROM - 1}-09-01'
),
by_type as (
    select service_name, requested_date as d, count(*) as n, sum(closed_in_7) as closed
    from base group by all
),
pace as (
    select service_name, d,
        sum(closed) over w / nullif(sum(n) over w, 0) as recent_pace,
        sum(n) over w as recent_n
    from by_type
    window w as (partition by service_name order by d
                 range between interval 98 day preceding and interval {LABEL_DAYS + 1} day preceding)
),
by_category as (
    select service_category, requested_date as d, count(*) as n from base group by all
),
load as (
    select service_category, d,
        sum(n) over (partition by service_category order by d
                     range between interval 30 day preceding and interval 1 day preceding) as workload_30d
    from by_category
)
select b.*, p.recent_pace, coalesce(l.workload_30d, 0) as workload_30d,
       month(b.requested_date) as month, dayofweek(b.requested_date) as weekday, year(b.requested_date) as year
from base b
left join pace p on p.service_name = b.service_name and p.d = b.requested_date
left join load l on l.service_category = b.service_category and l.d = b.requested_date
"""

# Requests filed in the last LABEL_DAYS + 1 days don't have a known outcome yet.
QUERY = f"""
with c as ({CONTEXT})
select * from c
where year(requested_date) >= {TRAIN_FROM}
  and requested_date <= (select max(requested_date) from silver.fct_service_requests) - interval {LABEL_DAYS + 1} day
"""

# What the live predictor uses for "today": the latest pace and workload per request type.
CURRENT = f"""
with c as ({CONTEXT})
select service_name, arg_max(recent_pace, requested_date) as recent_pace,
       arg_max(workload_30d, requested_date) as workload_30d
from c group by service_name
"""


def load() -> tuple[pd.DataFrame, pd.DataFrame]:
    with duckdb.connect(warehouse_path(), read_only=True) as con:
        return con.execute(QUERY).df(), con.execute(CURRENT).df()


# ---------------------------------------------------------------- encoding


def fit_encoder(keys: pd.Series, y: np.ndarray) -> dict:
    """Smoothed share closed in 7 days per category; rare categories shrink to the overall rate."""
    keys = keys.fillna(MISSING).astype(str)
    mean = float(y.mean())
    stats = pd.DataFrame({"k": keys.to_numpy(), "y": y}).groupby("k")["y"].agg(["sum", "count"])
    values = (stats["sum"] + SMOOTHING * mean) / (stats["count"] + SMOOTHING)
    return {"mean": mean, "values": {str(k): round(float(v), 6) for k, v in values.items()}}


def encode(encoder: dict, keys: pd.Series) -> np.ndarray:
    keys = keys.fillna(MISSING).astype(str)
    return keys.map(encoder["values"]).fillna(encoder["mean"]).to_numpy(dtype=float)


def training_matrix(df: pd.DataFrame, y: np.ndarray) -> tuple[np.ndarray, dict]:
    """Out-of-fold target encoding, so a request's own outcome never leaks into its features."""
    rng = np.random.default_rng(PARAMS["seed"])
    fold = rng.integers(0, FOLDS, size=len(df))
    X = np.empty((len(df), len(FEATURES)))
    for j, col in enumerate(CATEGORICAL):
        for k in range(FOLDS):
            fit, apply = fold != k, fold == k
            X[apply, j] = encode(fit_encoder(df[col][fit], y[fit]), df[col][apply])
    for j, col in enumerate(NUMERIC, start=len(CATEGORICAL)):
        X[:, j] = df[col].to_numpy(dtype=float)
    return X, {col: fit_encoder(df[col], y) for col in CATEGORICAL}


def scoring_matrix(df: pd.DataFrame, encoders: dict) -> np.ndarray:
    cats = [encode(encoders[c], df[c]) for c in CATEGORICAL]
    nums = [df[c].to_numpy(dtype=float) for c in NUMERIC]
    return np.column_stack(cats + nums)


def fit(df: pd.DataFrame) -> tuple[xgb.Booster, dict]:
    y = df["closed_in_7"].to_numpy(dtype=float)
    X, encoders = training_matrix(df, y)
    booster = xgb.train(
        {**PARAMS, "nthread": os.cpu_count() or 1},
        xgb.DMatrix(X, label=y, feature_names=FEATURES),
        num_boost_round=TREES,
    )
    return booster, encoders


# ----------------------------------------------------------------- metrics


def auc(y: np.ndarray, p: np.ndarray) -> float:
    """Area under the ROC curve via ranks (ties averaged)."""
    ranks = pd.Series(p).rank().to_numpy()
    pos = y == 1
    n_pos, n_neg = pos.sum(), (~pos).sum()
    return float((ranks[pos].sum() - n_pos * (n_pos + 1) / 2) / (n_pos * n_neg))


def scores(y: np.ndarray, p: np.ndarray) -> dict:
    """Accuracy, AUC, and a triage measure: of the 20% of requests the model rates least likely
    to close in a week, the share that really did take longer."""
    slowest = np.argsort(p)[: int(len(p) * 0.2)]
    return {
        "accuracy": round(float(((p >= 0.5) == (y == 1)).mean()), 4),
        "auc": round(auc(y, p), 4),
        "slowPrecision": round(float((y[slowest] == 0).mean()), 4),
    }


# ------------------------------------------------------------------ export


def _node_values(tree: dict) -> list[float]:
    """Leaf values, plus a hessian-weighted mean at each internal node, so per-feature
    contributions along a path add up exactly to the prediction (XGBoost's convention)."""
    left, right = tree["left_children"], tree["right_children"]
    cover, leaf = tree["sum_hessian"], tree["split_conditions"]
    values = [0.0] * len(left)

    def fill(n: int) -> float:
        if left[n] == -1:
            values[n] = float(leaf[n])
        else:
            a, b = fill(left[n]), fill(right[n])
            values[n] = (a * cover[left[n]] + b * cover[right[n]]) / cover[n]
        return values[n]

    fill(0)
    return values


def export_trees(booster: xgb.Booster) -> dict:
    """Trees as flat arrays: each node is [feature, threshold, left, right, value, missing_go_left]."""
    raw = json.loads(booster.save_raw("json"))["learner"]
    trees, gain = [], np.zeros(len(FEATURES))
    for tree in raw["gradient_booster"]["model"]["trees"]:
        values, flat = _node_values(tree), []
        for n, left in enumerate(tree["left_children"]):
            leaf = left == -1
            if not leaf:
                gain[tree["split_indices"][n]] += tree["loss_changes"][n]
            flat += [
                -1 if leaf else tree["split_indices"][n],
                0.0 if leaf else float(str(np.float32(tree["split_conditions"][n]))),
                0 if leaf else left,
                0 if leaf else tree["right_children"][n],
                round(values[n], 7),
                1 if (not leaf and tree["default_left"][n]) else 0,
            ]
        trees.append(flat)
    # For binary:logistic XGBoost stores base_score as a probability; the trees add to its log-odds.
    base_p = float(raw["learner_model_param"]["base_score"].strip("[]"))
    return {
        "features": FEATURES,
        "base": float(np.log(base_p / (1 - base_p))),
        "trees": trees,
        "gain": [round(float(g), 3) for g in gain],
    }


def exported_margin(gbm: dict, row: np.ndarray) -> float:
    """The browser's scoring rule, in Python, to check the export against XGBoost."""
    s = gbm["base"]
    for t in gbm["trees"]:
        n = 0
        while t[n * 6] >= 0:
            x = row[int(t[n * 6])]
            go_left = (t[n * 6 + 5] == 1) if np.isnan(x) else np.float32(x) < np.float32(t[n * 6 + 1])
            n = int(t[n * 6 + 2] if go_left else t[n * 6 + 3])
        s += t[n * 6 + 4]
    return s


# ------------------------------------------------------------------- train


def train() -> dict:
    df, current = load()
    train_df = df[df["year"] < TEST_YEAR].reset_index(drop=True)
    test_df = df[df["year"] == TEST_YEAR].reset_index(drop=True)
    y_test = test_df["closed_in_7"].to_numpy(dtype=float)

    # 1. Honest evaluation: fit on the years before TEST_YEAR, score TEST_YEAR.
    booster, encoders = fit(train_df)
    p_model = booster.predict(xgb.DMatrix(scoring_matrix(test_df, encoders), feature_names=FEATURES))
    rate = train_df.groupby("service_name")["closed_in_7"].mean()
    p_base = test_df["service_name"].map(rate).fillna(train_df["closed_in_7"].mean()).to_numpy(dtype=float)

    # 2. The shipped model learns from every labelled request.
    final, final_encoders = fit(df)
    gbm = export_trees(final)

    # The browser must predict exactly what XGBoost predicts.
    sample = df.sample(n=min(500, len(df)), random_state=1)
    X = scoring_matrix(sample, final_encoders)
    expected = final.predict(xgb.DMatrix(X, feature_names=FEATURES), output_margin=True)
    worst = max(abs(exported_margin(gbm, X[i]) - expected[i]) for i in range(len(X)))
    if worst > 1e-4:
        raise AssertionError(f"Exported trees disagree with XGBoost by {worst:.2e}")

    total_gain = sum(gbm["gain"]) or 1.0
    counts = df["community"].value_counts()
    model = {
        "trainedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "target": f"Closed within {LABEL_DAYS} days of being filed",
        "library": f"XGBoost {xgb.__version__}",
        "trees": TREES,
        "rows": {"train": len(train_df), "test": len(test_df), "final": len(df)},
        "labelledThrough": str(df["requested_date"].max())[:10],
        "testYear": TEST_YEAR,
        "trainFrom": TRAIN_FROM,
        "metrics": {"model": scores(y_test, p_model), "baseline": scores(y_test, p_base)},
        "positiveRate": round(float(y_test.mean()), 4),
        "parityMaxError": float(worst),
        "encoders": final_encoders,
        "gbm": gbm,
        "importance": sorted(
            ({"feature": f, "share": round(g / total_gain, 4)} for f, g in zip(FEATURES, gbm["gain"])),
            key=lambda x: -x["share"],
        ),
        "options": {
            "service_name": sorted(df["service_name"].dropna().unique().tolist()),
            "intake_channel": sorted(df["intake_channel"].dropna().unique().tolist()),
            "community": sorted(c for c in counts[counts >= 50].index.tolist() if c != MISSING),
            "categoryOf": df.groupby("service_name")["service_category"].first().to_dict(),
            "programOf": df.groupby("service_name")["program"].first().to_dict(),
        },
        # Today's context per request type, used when scoring a new request in the browser.
        "context": {
            r.service_name: {
                "recent_pace": None if pd.isna(r.recent_pace) else round(float(r.recent_pace), 4),
                "workload_30d": int(r.workload_30d),
            }
            for r in current.itertuples()
        },
    }
    OUT.write_text(json.dumps(model, separators=(",", ":")) + "\n")
    summary = {"rows": model["rows"], "metrics": model["metrics"], "parity": float(worst), "bytes": OUT.stat().st_size}
    print(summary)
    return summary


if __name__ == "__main__":
    train()
