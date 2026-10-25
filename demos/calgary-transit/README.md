# Calgary Transit data product

Live at [codychandler.ca/data-demos/calgary-transit](https://www.codychandler.ca/data-demos/calgary-transit) (shared by direct link; not linked from the site's navigation).

A working replica of the PRIME pattern (one governed data layer that every consumer trusts), built on City of Calgary open data.

```
Calgary open data API (Socrata)
   │  Airflow: Python extract/load tasks
   ▼
bronze      raw JSON records exactly as published, with batch metadata
   │  Airflow: dbt via Astronomer Cosmos (one task per model, tests after each)
   ▼
silver      typed, deduplicated, one definition (reference seeds map reorgs and renamed categories)
   │
   ▼
gold        consumption tables, each with one declared grain
   │  publish: gold only, as Parquet + a catalog generated from dbt docs
   ▼
website     dashboard (DuckDB-WASM in the browser) and AI agent (writes SQL against gold only)
```

## Sources

| Domain | Dataset | Load |
|---|---|---|
| Ridership by fare product | [iema-jbc4](https://data.calgary.ca/resource/iema-jbc4.json) | Full snapshot |
| Service hours by mode | [64iy-rpqq](https://data.calgary.ca/resource/64iy-rpqq.json) | Full snapshot |
| 311 requests (transit slice) | [iahh-g8bj](https://data.calgary.ca/resource/iahh-g8bj.json) | Incremental on `updated_date`, 7-day lookback |

## Gold tables

| Table | Grain |
|---|---|
| `transit_monthly_kpis` | month (2012+) |
| `ridership_by_fare_product` | month x rider group x fare product |
| `service_requests_monthly` | month x department x program x category |
| `service_requests_by_community` | year x community x category |
| `data_contract_status` | data domain |

## Machine learning

`pipeline/ml/resolution_model.py` trains an XGBoost classifier in the DAG, right after the dbt tests pass: will a transit 311 request be closed within 7 days? It uses only what is known when a request is filed (request type, category, program, channel, community, timing, and the last 90 days' pace and 30 days' workload for that type), so it can score a new request immediately.

- **Honest test:** trained on 2022 to 2024, scored on 2025, a year it never saw, against a baseline of each request type's past rate.
- **Labels:** requests still open after 7 days count as not closed in 7, so slow requests aren't dropped.
- **Export:** trees go to `web/public/data/resolution_model.json`; the website scores and explains predictions in the browser (`web/lib/ml/gbm.ts`). The run fails if the exported trees disagree with XGBoost.

## Data issues the pipeline handles

- **One department, four codes.** 311 files Calgary Transit under `TRAN`, `OS`, `OSC` and `Tranc` as the org changed. `reference.agency_map` collapses them.
- **67 service names, 12 categories.** Retired (`Z CT -`) and renamed request types are mapped in `reference.service_category_map`. An unmapped name fails the build.
- **A misleading trend.** Transit 311 requests per trip looked up 43% from 2019 to 2024, but Lost Property only moved into 311 in 2021. A governed `comparable_across_years` flag gives the like-for-like figure (+12%).
- **Two measures called ridership.** `trips` counts a journey once; `boardings` counts every vehicle boarded. They are separate, documented columns.
- **Totals that don't add up.** Published fare products never sum to published ridership. The gap is carried as explicit unallocated rows, so the breakdown always reconciles (tested), and 55 months where the breakdown exceeds the total raise a warning.
- **Placeholder rows.** 258 of 480 ridership rows have a date and no values. They are excluded, and freshness is measured on real data only.
- **Uneven freshness.** 311 is current to yesterday; ridership lags by more than a year. `data_contract_status` compares each domain to its target.

## Run it

```bash
./scripts/setup.sh          # creates .venv (Airflow + Cosmos) and .venv-dbt (dbt-duckdb)
./scripts/run_pipeline.sh   # runs the Airflow DAG once: extract, freshness, dbt build, publish
```

`FULL_REFRESH=1` reloads 311 from scratch. GitHub Actions runs the same DAG daily (`.github/workflows/calgary-transit.yml` at the repo root) and commits refreshed gold data and dbt docs, which redeploys the demo.

## Website

`web/` is a Next.js app with four sections: the presentation (`/presentation`, with speaker notes, a synced presenter window, and PDF/PowerPoint downloads), the approach page, the dashboard, and the AI agent. The dashboard and agent load the published gold Parquet files into DuckDB-WASM in the browser.

```bash
cd web && npm install && npm run dev   # http://localhost:3000/data-demos/calgary-transit
```

After editing slides, regenerate the downloads with the site running: `BASE_URL=http://localhost:3000 npm run export:deck` (use a production build, `npm run build && npm start`, so the dev badge isn't captured).

The agent needs `ANTHROPIC_API_KEY` (in `web/.env.local` locally, or a Vercel environment variable). Without it, everything except the agent works.

## How it's served

The web app is its own Next.js app (a [multi-zone](https://nextjs.org/docs/app/guides/multi-zones)) with `basePath: /data-demos/calgary-transit`, deployed as a separate Vercel project with root directory `demos/calgary-transit/web`. The portfolio rewrites `/data-demos/calgary-transit/*` to it when `CALGARY_TRANSIT_URL` is set. This keeps the City of Calgary styling and tooling fully separate from the portfolio's brand system.

## Explore locally

| What | Command | Opens |
|---|---|---|
| Airflow UI: DAG graph, runs, task logs | `./scripts/airflow_ui.sh` | http://localhost:8080 |
| DuckDB UI: query every layer (read-only) | `.venv/bin/python scripts/explore_data.py` | http://localhost:4213 |
| dbt docs: models, tests, lineage | `cd dbt && ../.venv-dbt/bin/dbt docs serve` | http://localhost:8080 |

Stop the DuckDB UI before running the pipeline: DuckDB allows one writer, and the UI holds the file open. dbt docs and Airflow both default to port 8080, so run one at a time (or pass `--port 8081` to `dbt docs serve`).
