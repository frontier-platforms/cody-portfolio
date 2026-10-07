"""Publish a successful run to the site.

Reads dbt's own artifacts (target/manifest.json and run_results.json) and the
warehouse, then writes:

  public/data/*.parquet               gold tables served to the browser
  public/data/manifest.json           this run: row counts, test results, findings, model metrics, history
  lib/pipelines/generated/<id>.json   each pipeline as the site and the browser's live runs need it:
                                      bronze shapes, dbt-compiled SQL, tests and the contract
  public/dbt-docs/index.html          dbt's static docs site, for browsing lineage

Only runs after `dbt build` has passed, so a failing error-level test means
nothing here is overwritten.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
import shutil
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
GENERATED = ROOT / "lib" / "pipelines" / "generated"
DOCS = ROOT / "public" / "dbt-docs"
TARGET = ROOT / "dbt" / "target"
MANIFEST = DATA / "manifest.json"


def _load_artifacts() -> tuple[dict, dict]:
    manifest = json.loads((TARGET / "manifest.json").read_text())
    results = {r["unique_id"]: r for r in json.loads((TARGET / "run_results.json").read_text())["results"]}
    return manifest, results


def _ref_template(sql: str, relations: dict[str, str]) -> str:
    """Swap dbt's fully qualified relation names for {{ ref('name') }}, so the browser can
    run the same compiled SQL against its own schema. current_date becomes {{ today }}."""
    for relation, name in sorted(relations.items(), key=lambda kv: -len(kv[0])):
        sql = sql.replace(relation, f"{{{{ ref('{name}') }}}}")
    return re.sub(r"\bcurrent_date\b", "{{ today }}", sql).strip()


def _format(value_number, value_text, fmt: str) -> str:
    if fmt == "count":
        return f"{int(value_number):,}"
    if fmt == "money":
        # Round half up, like the site does (Python's round() rounds half to even).
        return f"${value_number / 1e6:.2f}M" if value_number >= 1e6 else f"${int(value_number / 1e3 + 0.5)}K"
    if fmt == "percent":
        return f"{value_number * 100:.1f}%"
    text = str(value_text)
    return text.title() if text.isupper() else text


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def publish_all(
    warehouse: Path, model_summary: dict | None, extract_counts: dict[str, dict[str, int]]
) -> None:
    manifest, results = _load_artifacts()
    nodes, sources = manifest["nodes"], manifest["sources"]
    relations = {n["relation_name"]: n["name"] for n in nodes.values() if n["resource_type"] == "model"}
    relations |= {s["relation_name"]: s["name"] for s in sources.values()}

    try:
        site_manifest = json.loads(MANIFEST.read_text())
    except FileNotFoundError:
        site_manifest = {"version": 1, "pipelines": {}}
    GENERATED.mkdir(parents=True, exist_ok=True)
    run_at = dt.datetime.now(dt.UTC).isoformat()
    trigger = "github-actions" if os.environ.get("GITHUB_ACTIONS") else "local"

    con = duckdb.connect(str(warehouse), read_only=True)
    pipeline_ids = sorted({s["schema"] for s in sources.values()})

    for pid in pipeline_ids:
        srcs = [s for s in sources.values() if s["schema"] == pid]
        meta = srcs[0]["source_meta"]
        models = sorted(
            (n for n in nodes.values() if n["resource_type"] == "model" and n["schema"] == pid),
            key=lambda n: ["silver", "gold", "metrics"].index(n["config"]["meta"].get("layer", "gold")),
        )
        model_ids = {n["unique_id"] for n in models}
        tests = [
            n
            for n in nodes.values()
            if n["resource_type"] == "test"
            and (n.get("attached_node") in model_ids or set(n["depends_on"]["nodes"]) & model_ids)
        ]

        # ---- definition for the site and the browser's live runs
        definition = {
            "id": pid,
            "label": meta["pipeline"]["label"],
            "source": {
                "name": meta["pipeline"]["source_name"],
                "url": meta["pipeline"]["source_url"],
                "docs": meta["pipeline"]["docs"],
                "licence": meta["pipeline"]["licence"],
            },
            "sources": [
                {
                    "name": s["name"],
                    "description": s["description"],
                    "columns": [
                        {"name": c["name"], "type": c["data_type"].upper()} for c in s["columns"].values()
                    ],
                }
                for s in srcs
            ],
            "models": [
                {
                    "name": n["name"],
                    "layer": n["config"]["meta"].get("layer", "gold"),
                    "description": n["description"],
                    "sql": _ref_template(n["compiled_code"], relations),
                    "dependsOn": [
                        relations_name
                        for relations_name in (
                            (nodes.get(d) or sources.get(d))["name"] for d in n["depends_on"]["nodes"]
                        )
                    ],
                    **(
                        {"served": {"file": n["config"]["meta"]["served_file"]}}
                        if "served_file" in n["config"]["meta"]
                        else {}
                    ),
                    **(
                        {"mergeKey": n["config"]["meta"]["merge_key"]}
                        if "merge_key" in n["config"]["meta"]
                        else {}
                    ),
                    "contract": bool(n["config"].get("contract", {}).get("enforced")),
                    "path": f"dbt/{n['original_file_path']}",
                }
                for n in models
                if n["config"]["meta"].get("layer") != "metrics"
            ],
            "tests": [],
            # The lab header's findings, so a live run in the browser can recompute them.
            "highlights": next(
                (
                    {"sql": _ref_template(n["compiled_code"], relations)}
                    for n in models
                    if n["config"]["meta"].get("layer") == "metrics"
                ),
                None,
            ),
            "contract": {
                "owner": meta["contract"]["owner"],
                "cadence": meta["contract"]["cadence"],
                "freshnessSlaDays": meta["contract"]["freshness_sla_days"],
                "primaryKeys": {
                    n["name"]: n["config"]["meta"]["merge_key"]
                    for n in models
                    if "merge_key" in n["config"]["meta"]
                },
                "consumers": meta["contract"]["consumers"],
                "guarantees": meta["contract"]["guarantees"],
            },
        }

        test_results = []
        for t in sorted(tests, key=lambda t: t["name"]):
            model_id = t.get("attached_node") or next(d for d in t["depends_on"]["nodes"] if d in model_ids)
            label = t["config"]["meta"].get("label", t["name"])
            severity = t["config"]["severity"].lower()
            sql = f"select count(*) as failures from (\n{_ref_template(t['compiled_code'], relations)}\n) dbt_test"
            definition["tests"].append(
                {
                    "name": label,
                    "model": nodes[model_id]["name"],
                    "kind": (t.get("test_metadata") or {}).get("name", "singular"),
                    "severity": severity,
                    "description": t["config"]["meta"].get("description", ""),
                    "sql": sql,
                }
            )
            r = results.get(t["unique_id"], {})
            status = {"pass": "pass", "warn": "warn", "fail": "fail", "error": "fail"}.get(
                r.get("status"), "fail"
            )
            test_results.append(
                {
                    "name": label,
                    "model": nodes[model_id]["name"],
                    "kind": definition["tests"][-1]["kind"],
                    "severity": severity,
                    "status": status,
                    "failures": int(r.get("failures") or 0),
                    "ms": round((r.get("execution_time") or 0) * 1000, 1),
                    "sql": sql.replace("{{ today }}", "current_date"),
                }
            )

        if pid == "housing" and model_summary:
            definition["model"] = {
                "name": "value_model",
                "description": "XGBoost gradient-boosted trees on log assessed value, trained in Python after the tests pass. Features: community, property type, zoning, year built, lot size.",
                "file": "housing-model.json",
                "trainedOn": "housing_homes",
                "path": "ml/housing_model.py",
            }
        (GENERATED / f"{pid}.json").write_text(json.dumps(definition, indent=2) + "\n")

        # ---- served files
        outputs = []
        for m in definition["models"]:
            if "served" not in m:
                continue
            path = DATA / m["served"]["file"]
            con.execute(f"copy {pid}.{m['name']} to '{path}' (format parquet, compression zstd)")
            rows = con.execute(f"select count(*) from {pid}.{m['name']}").fetchone()[0]
            outputs.append(
                {
                    "model": m["name"],
                    "file": path.name,
                    "rows": rows,
                    "bytes": path.stat().st_size,
                    "sha256": _sha256(path),
                }
            )
            print(f"  serve    {path.name}: {path.stat().st_size / 1e6:.2f} MB")

        # ---- model stats: bronze from extract, silver and gold from the warehouse
        model_stats = [
            {
                "name": s["name"],
                "layer": "bronze",
                "rows": extract_counts.get(pid, {}).get(s["name"], 0),
                "ms": 0,
            }
            for s in srcs
        ]
        for m in definition["models"]:
            summary = con.execute(f"summarize {pid}.{m['name']}").fetchall()
            cols = [d[0] for d in con.description]
            model_stats.append(
                {
                    "name": m["name"],
                    "layer": m["layer"],
                    "rows": con.execute(f"select count(*) from {pid}.{m['name']}").fetchone()[0],
                    "ms": round(
                        (results.get(f"model.lab.{m['name']}", {}).get("execution_time") or 0) * 1000, 1
                    ),
                    "columns": [
                        {
                            "name": row[cols.index("column_name")],
                            "type": row[cols.index("column_type")],
                            "nullPct": float(str(row[cols.index("null_percentage")]).rstrip("%")),
                        }
                        for row in summary
                    ],
                }
            )

        highlights = [
            {"label": label, "value": _format(num, text, fmt), "detail": detail}
            for _, label, fmt, num, text, detail in con.execute(
                f"select sort, label, format, value_number, value_text, detail from {pid}.{pid}_highlights order by sort"
            ).fetchall()
        ]
        for h in highlights:
            print(f"  insight  {h['label']}: {h['value']} ({h['detail']})")

        dbt_ms = (
            sum((results.get(n["unique_id"], {}).get("execution_time") or 0) for n in models + tests) * 1000
        )
        entry = {
            "pipeline": pid,
            "runAt": run_at,
            "durationMs": round(dbt_ms),
            "trigger": trigger,
            "commit": os.environ.get("GITHUB_SHA"),
            "orchestrator": "Airflow" if os.environ.get("AIRFLOW_CTX_DAG_ID") else "local runner",
            "extract": {"requests": 0, "rows": sum(extract_counts.get(pid, {}).values()), "ms": 0},
            "models": model_stats,
            "tests": test_results,
            "outputs": outputs,
            "highlights": highlights,
            **({"model": model_summary} if pid == "housing" and model_summary else {}),
        }
        site_manifest["pipelines"][pid] = entry
        history = site_manifest.setdefault("history", {}).get(pid, [])
        history.insert(
            0,
            {
                "runAt": run_at,
                "trigger": trigger,
                "durationMs": entry["durationMs"],
                "rows": entry["extract"]["rows"],
                "passed": sum(t["status"] == "pass" for t in test_results),
                "warned": sum(t["status"] == "warn" for t in test_results),
                "failed": sum(t["status"] == "fail" for t in test_results),
            },
        )
        site_manifest["history"][pid] = history[:12]

    con.close()
    MANIFEST.write_text(json.dumps(site_manifest, indent=2) + "\n")

    static = TARGET / "docs" / "static_index.html"
    if static.exists():
        DOCS.mkdir(parents=True, exist_ok=True)
        shutil.copy(static, DOCS / "index.html")
        print(f"  docs     dbt docs: {(DOCS / 'index.html').stat().st_size / 1e6:.1f} MB")
