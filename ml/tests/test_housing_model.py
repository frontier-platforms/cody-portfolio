"""Tests for the value model. The export tests matter most: the browser predicts
from the exported JSON, so it has to agree with scikit-learn exactly."""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from ml import housing_model as hm

FIXTURE = Path(__file__).parent / "fixtures" / "parity.json"


def synthetic(n: int = 3000, seed: int = 0) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    community = rng.choice(["A", "B", "C", "D", "E"], n)
    use = rng.choice(["Detached", "Duplex", "Townhouse"], n)
    zoning = rng.choice(["R-C1", "R-CG", None], n)
    year = rng.integers(1950, 2025, n).astype(float)
    year[rng.random(n) < 0.05] = np.nan
    lot = rng.integers(2000, 9000, n).astype(float)
    base = {"A": 400_000, "B": 600_000, "C": 800_000, "D": 1_000_000, "E": 500_000}
    value = np.array([base[c] for c in community]) * (1 + (np.nan_to_num(year, nan=1980) - 1980) / 200)
    value *= 1 + lot / 20_000 + rng.normal(0, 0.05, n)
    return pd.DataFrame(
        {"key": np.arange(n), "community": community, "use": use, "zoning": zoning,
         "year_built": year, "lot_sqft": lot, "assessed_value": value.round()}
    )  # fmt: skip


def walk(tree: list, row: np.ndarray) -> float:
    node = 0
    while True:
        f, t, left, right, value, missing_left = tree[node * 6 : node * 6 + 6]
        if f < 0:
            return value
        x = row[int(f)]
        node = int(left) if (np.isnan(x) and missing_left) or (not np.isnan(x) and x <= t) else int(right)


def predict_exported(gbm: dict, row: np.ndarray) -> float:
    return gbm["base"] + sum(walk(t, row) for t in gbm["trees"])


@pytest.fixture(scope="module")
def trained():
    df = synthetic()
    model = hm.train(df, {"trees": 60, "depth": 4}, step=20)
    return df, model


def test_holdout_hash_matches_the_typescript_split():
    # Expected values from the original TypeScript isTestRow, so the holdout homes don't change.
    expected = {1: False, 2: False, 3: False, 4: False, 5: False, 6: True, 7: False,
                200194397: False, 560000408: False, 150104206: False, 201015305: False}  # fmt: skip
    assert {k: hm.is_test_row(k) for k in expected} == expected
    share = np.mean([hm.is_test_row(k) for k in range(10_000)])
    assert 0.18 < share < 0.22


def test_export_predicts_exactly_what_sklearn_predicts():
    df = synthetic()
    y = np.log(df["assessed_value"].to_numpy())
    X, encoders = hm.training_matrix(df, y, seed=1)
    model = hm.HistGradientBoostingRegressor(
        max_iter=50, max_depth=5, max_leaf_nodes=None, early_stopping=False
    )
    model.fit(X, y)
    gbm = hm.export_trees(model)
    X_new = hm.scoring_matrix(df.head(300), encoders)
    ours = np.array([predict_exported(gbm, r) for r in X_new])
    np.testing.assert_allclose(ours, model.predict(X_new), atol=1e-5)


def test_explanations_add_up_to_the_prediction(trained):
    _, model = trained
    gbm = model["gbm"]
    row = np.array([12.9, 13.1, 13.0, 1990.0, np.nan])
    bias, contrib = gbm["base"], np.zeros(len(hm.FEATURES))
    for tree in gbm["trees"]:
        node = 0
        bias += tree[4]
        while tree[node * 6] >= 0:
            f, t, left, right, value, missing_left = tree[node * 6 : node * 6 + 6]
            x = row[int(f)]
            nxt = int(left) if (np.isnan(x) and missing_left) or (not np.isnan(x) and x <= t) else int(right)
            contrib[int(f)] += tree[nxt * 6 + 4] - value
            node = nxt
    assert bias + contrib.sum() == pytest.approx(predict_exported(gbm, row), abs=1e-6)


def test_out_of_fold_encoding_does_not_leak_a_rows_own_target():
    df = synthetic(500)
    y = np.log(df["assessed_value"].to_numpy())
    X1, _ = hm.training_matrix(df, y, seed=3)
    y2 = y.copy()
    y2[0] += 5  # change only row 0's target
    X2, _ = hm.training_matrix(df, y2, seed=3)
    assert X1[0, 0] == X2[0, 0]


def test_model_beats_the_community_median_baseline(trained):
    _, model = trained
    assert model["metrics"]["model"]["mdape"] < model["metrics"]["baseline"]["mdape"]
    assert len(model["learningCurve"]) == 3


def test_write_cross_language_parity_fixture(trained):
    """Writes rows, the exported model and sklearn's predictions for the TypeScript parity check."""
    df, model = trained
    sample = df.head(50)
    rows = sample[hm.FEATURES].replace({np.nan: None}).to_dict("records")
    X = hm.scoring_matrix(sample, model["encoders"])
    expected = [predict_exported(model["gbm"], r) for r in X]
    FIXTURE.parent.mkdir(exist_ok=True)
    FIXTURE.write_text(
        json.dumps(
            {
                "model": {k: model[k] for k in ("encoders", "gbm", "interval")},
                "rows": rows,
                "expected": expected,
            }
        )
    )
    assert FIXTURE.exists()
