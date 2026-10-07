"""Train the production value model on the gold table and write it for the site.

Run by the Airflow DAG after `dbt build` passes:  uv run python -m ml.train
"""

from __future__ import annotations

import json
from pathlib import Path

import duckdb

from ml import housing_model as hm

ROOT = Path(__file__).resolve().parent.parent
MODEL_FILE = ROOT / "public" / "data" / "housing-model.json"


def train_production(warehouse: Path) -> dict:
    with duckdb.connect(str(warehouse), read_only=True) as con:
        rows = con.execute(
            """
            select roll_number as key, community, use, zoning, year_built, lot_sqft, assessed_value
            from housing.housing_homes
            where assessed_value between 50000 and 20000000
            """
        ).df()
    print(f"  train    value_model: {len(rows):,} homes")

    def progress(tree: int, train_rmse: float, valid_rmse: float) -> None:
        if tree % 100 == 0:
            print(f"  train    tree {tree}: rmse train {train_rmse:.4f}, holdout {valid_rmse:.4f}")

    model = hm.train(rows, on_progress=progress, step=25)
    MODEL_FILE.write_text(json.dumps(model, separators=(",", ":")))
    m = model["metrics"]
    print(
        f"  model    holdout median error {m['model']['mdape']:.1%} (baseline {m['baseline']['mdape']:.1%}), "
        f"within 10%: {m['model']['within10']:.1%}, R² {m['model']['r2']:.3f}, "
        f"{MODEL_FILE.stat().st_size / 1e3:.0f} KB in {model['trainMs'] / 1000:.1f} s"
    )
    return {
        "file": MODEL_FILE.name,
        "bytes": MODEL_FILE.stat().st_size,
        "trainMs": model["trainMs"],
        "rows": model["rows"],
        "metrics": model["metrics"],
        "importance": model["importance"],
        "library": model["library"],
    }


if __name__ == "__main__":
    from pipeline.tasks import WAREHOUSE

    train_production(WAREHOUSE)
