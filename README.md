# cody-portfolio

Personal site for Cody Chandler: case studies, side projects, and a Lab of live data demos on City of Calgary and Calgary Flames data, queried in the browser with DuckDB-WASM, plus a Claude-powered "ask the data" feature.

## Stack

- **Next.js 16** (App Router) and **TypeScript**, deployed on **Vercel**
- **Tailwind CSS 4** with design tokens in [`app/globals.css`](app/globals.css)
- **MDX** case studies with Zod-validated metadata
- **DuckDB-WASM** for in-browser queries over **Parquet**
- **Claude API** (`@anthropic-ai/sdk`) for natural-language to SQL
- **Python 3.12** with [uv](https://docs.astral.sh/uv/): **dbt** on **DuckDB** for the pipelines, **Airflow** to orchestrate them, **scikit-learn** for the value model, **Pyodide** to train it in the browser
- **Vercel Web Analytics** (cookieless)

Every page except `/api/ask` is statically generated.

## Getting started

```bash
npm install
uv sync                      # Python: dbt, scikit-learn, pytest (add --group airflow for Airflow)
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY to enable "Ask the data"
npm run dev
```

| Script                 | What it does                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `npm run dev`          | Local dev server                                                                            |
| `npm run build`        | Production build                                                                            |
| `npm run typecheck`    | `tsc --noEmit`                                                                              |
| `npm run lint`         | ESLint                                                                                      |
| `npm run lint:brand`   | Brand check: enforces BRAND.md (tokens, type scale, spacing, copy rules, case study format) |
| `npm run format`       | Prettier                                                                                    |
| `npm run data`         | Run every Lab pipeline: extract, load, `dbt build`, train the model, publish                |
| `npm run data:db`      | Same, from the last extract and without publishing. Open with `duckdb -ui lab.duckdb`       |
| `npm run data:airflow` | Run the `lab_refresh` Airflow DAG once with `airflow dags test`, as GitHub Actions does     |
| `npm run test:ml`      | pytest: the model, its export, and the extractors                                           |
| `npm run test:parity`  | Checks the TypeScript scorer matches scikit-learn's predictions                             |

## Project layout

```
app/                    routes (home, work, projects, lab/calgary, lab/flames, about, colophon, api/ask, api/nhl)
components/
  layout/               header, footer, theme toggle, ⌘K command menu
  home/                 KPI strip, work list
  case/                 MDX components: Media, Callout, Todo, KeyNumbers
  lab/                  DuckDB client, dashboards, SVG charts, AskData, live pipeline runs
  pipeline/             lineage explorer, test results, data contract
  telemetry/            Telemetry panel, Web Vitals and click instrumentation
content/work/*.mdx      case studies
lib/
  pipelines/            browser connectors, the browser runner, and generated/ (dbt's compiled SQL per pipeline)
  ml/                   scores and explains the exported model in the browser
  analytics.ts          tracking plan as code + validated track()
  telemetry.ts          in-browser telemetry store
ingest/                 Python extract and bronze load
dbt/                    dbt project: sources, models, tests, contracts
ml/                     the value model in Python (scikit-learn) and its tests
pipeline/               the steps the DAG runs, the local runner, and publish
airflow/dags/           the lab_refresh DAG
public/data/            committed Parquet files, the model and manifest.json from the last run
public/dbt-docs/        dbt's static docs site
.github/workflows/      CI and the weekly data refresh
```

## Adding a case study

Create `content/work/<slug>.mdx` and export `meta`:

```mdx
export const meta = {
  title: "…",
  company: "…",
  role: "…",
  period: "2023 to 2025", // optional
  summary: "One or two sentences shown at the top and in lists.",
  problem: "The client-side problem, in their words", // used on the home page
  status: "shipped", // "shipped" | "in progress" | "side venture"
  stack: ["Snowflake", "dbt"],
  numbers: [{ before: "7 days", value: "12 hrs", label: "Data freshness" }],
  order: 5,
};

## Overview

…
```

The schema lives in [`lib/work.ts`](lib/work.ts); a bad field fails the build. Available MDX components:

- `<Media src="/media/x.mp4" alt="…" caption="…" />` for a screenshot or muted looping recording. Omit `src` for a placeholder.
- `<Callout label="…">…</Callout>`
- `<Todo>…</Todo>` for content still to write. Shown in dev, removed in production. Numbers flagged `todo: true` behave the same way.

## The Lab

Three tabs, `/lab/calgary`, `/lab/housing` and `/lab/flames`, each a small data product: dashboard, "Ask the data", and the pipeline behind both. Housing adds a machine-learning model.

### Pipelines

Weekly, an Airflow DAG ([`airflow/dags/lab_refresh.py`](airflow/dags/lab_refresh.py)) runs:

```
extract_{permits,housing,flames} → load_* → dbt_build → train_value_model + dbt_docs → publish
```

- **Extract and load** ([`ingest/`](ingest)): Python pulls from the City's Socrata API and the NHL API and loads raw (bronze) tables. Their column types come from the dbt sources.
- **Transform and test** ([`dbt/`](dbt)): dbt on DuckDB builds silver and gold models. Gold tables have enforced contracts. Tests cover uniqueness, nulls, accepted values, relationships, ranges, recency, row counts, and singular tests such as shot-level goals reconciling to each final score. An error-level failure stops the DAG.
- **Publish** ([`pipeline/publish.py`](pipeline/publish.py)): reads dbt's `manifest.json` and `run_results.json`, then writes Parquet, [`manifest.json`](public/data/manifest.json), `lib/pipelines/generated/<id>.json` (dbt's compiled SQL for each model and test) and the dbt docs.
- **Scheduled:** [`.github/workflows/refresh-data.yml`](.github/workflows/refresh-data.yml) runs the DAG every Monday with `airflow dags test` (no Airflow server to host) and commits the results, which triggers a Vercel deploy.
- **Live, in the browser:** [`components/lab/live-run.ts`](components/lab/live-run.ts) runs dbt's compiled SQL in DuckDB-WASM through [`runner.ts`](lib/pipelines/runner.ts). It reads a watermark from the loaded data, extracts only what changed (Calgary via the City's `:updated_at`; Flames via the [`/api/nhl`](app/api/nhl/route.ts) proxy, since the NHL API has no CORS), builds into a `live` schema, merges on each model's `mergeKey`, re-runs the tests and refreshes the dashboards.

### Home value model

[`ml/housing_model.py`](ml/housing_model.py) trains scikit-learn's `HistGradientBoostingRegressor` on log assessed value, with out-of-fold target encoding, a hashed train/test split and metrics against a community-median baseline. The DAG trains it after `dbt build` passes and writes `public/data/housing-model.json`, with the trees exported to JSON.

In the browser, [`lib/ml/gbm.ts`](lib/ml/gbm.ts) scores and explains estimates from that JSON. `npm run test:parity` checks it matches scikit-learn to within 1e-9. "Train your own" runs the same Python file in a Web Worker with [Pyodide](https://pyodide.org) ([`public/ml/train-worker.js`](public/ml/train-worker.js)).

### Telemetry and analytics

- [`lib/telemetry.ts`](lib/telemetry.ts) records every DuckDB query (latency, rows, errors), table download, Core Web Vital, analytics event and pipeline run for the current tab. The Telemetry panel shows it. Nothing leaves the browser.
- [`lib/analytics.ts`](lib/analytics.ts) is the tracking plan. `track()` validates events against it and forwards valid ones to Vercel Analytics. Server components send events declaratively with `data-track="event"` and `data-track-<prop>` attributes. The colophon renders the plan.

## "Ask the data" guardrails

[`app/api/ask/route.ts`](app/api/ask/route.ts):

1. Zod-validated input, 300 character cap, fixed dataset list
2. Per-visitor and per-instance rate limits ([`lib/lab/rate-limit.ts`](lib/lab/rate-limit.ts)), best effort per serverless instance
3. Claude sees only the question and table schemas; the question is labelled as untrusted input
4. Structured JSON output, then a SQL check ([`checkSql`](lib/lab/datasets.ts)) on the server and again in the browser
5. Queries run in the visitor's browser against public data, wrapped in a 200-row limit

Uses `claude-opus-5` at low effort with server-side refusal fallbacks. **Set a monthly spend limit on the API key** in the Anthropic Console; that's the real cost ceiling.

## Brand

[`BRAND.md`](BRAND.md) is the single source of truth for how the site looks and sounds. Read it before changing copy, styles or components.

- Visual values live only in [`app/tokens.css`](app/tokens.css), generated verbatim from BRAND.md section 10. [`app/globals.css`](app/globals.css) switches off Tailwind's defaults and maps utilities to the tokens, so classes like `bg-bg`, `text-text-muted`, `p-6`, `text-3xl` and `rounded-md` can only produce brand values.
- `npm run lint:brand` (also in CI) fails on hardcoded colors, one-off sizes, off-scale spacing, extra font weights, shadows, em dashes, banned phrases, and case studies that don't follow Problem, Role, Solution, Outcome with a summary of 140 characters or fewer.
- When a request conflicts with the guide, follow the request, then update BRAND.md (bump the version, add a changelog line) so the guide stays true.
- Use numbers only as given; leave a `<Todo>` rather than inventing one.

## Data sources

- City of Calgary Open Data: [Building Permits](https://data.calgary.ca/Business-and-Economic-Activity/Building-Permits/c2es-76ed) (Open Government Licence, City of Calgary)
- NHL public API (`api-web.nhle.com`): play-by-play and schedules. Data © NHL; used here for non-commercial illustration.
