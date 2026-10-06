# cody-portfolio

Personal site for Cody Chandler: case studies, side projects, and a Lab of live data demos on City of Calgary and Calgary Flames data, queried in the browser with DuckDB-WASM, plus a Claude-powered "ask the data" feature.

## Stack

- **Next.js 16** (App Router) and **TypeScript**, deployed on **Vercel**
- **Tailwind CSS 4** with design tokens in [`app/globals.css`](app/globals.css)
- **MDX** case studies with Zod-validated metadata
- **DuckDB-WASM** for in-browser queries over **Parquet**
- **Claude API** (`@anthropic-ai/sdk`) for natural-language to SQL
- **Vercel Web Analytics** (cookieless)

Every page except `/api/ask` is statically generated.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY to enable "Ask the data"
npm run dev
```

| Script                 | What it does                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`          | Local dev server                                                                    |
| `npm run build`        | Production build                                                                    |
| `npm run typecheck`    | `tsc --noEmit`                                                                      |
| `npm run lint`         | ESLint                                                                              |
| `npm run format`       | Prettier                                                                            |
| `npm run data`         | Run every Lab pipeline: extract, build, test, write Parquet                         |
| `npm run data:permits` | City of Calgary building permits only                                               |
| `npm run data:housing` | Calgary home assessments + value model training                                     |
| `npm run data:flames`  | Calgary Flames play-by-play only                                                    |
| `npm run data:db`      | Build a local `lab.duckdb` with every Lab table (open with `duckdb -ui lab.duckdb`) |

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
  pipelines/            pipeline definitions (models, tests, contracts) and the engine-agnostic runner
  analytics.ts          tracking plan as code + validated track()
  telemetry.ts          in-browser telemetry store
scripts/run-pipeline.ts production pipeline run (Node + DuckDB)
public/data/            committed Parquet files and manifest.json from the last run
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

Each pipeline is defined once as data in [`lib/pipelines/`](lib/pipelines): raw (bronze) sources, SQL models in silver and gold layers that reference each other with `{{ ref('name') }}`, declarative tests (`unique`, `not_null`, `accepted_values`, `expression`, `relationship`, `row_count`, `freshness`, `custom`) and a data contract.

[`runner.ts`](lib/pipelines/runner.ts) executes models and tests against any `Engine` (`exec` + `query`):

- **Production:** [`scripts/run-pipeline.ts`](scripts/run-pipeline.ts) drives DuckDB in Node: full extract → bronze → silver → gold → tests → Parquet + [`manifest.json`](public/data/manifest.json). An error-level test failure exits before any file is written.
- **Scheduled:** [`.github/workflows/refresh-data.yml`](.github/workflows/refresh-data.yml) runs every Monday and commits the refreshed files, which triggers a Vercel deploy.
- **Live, in the browser:** [`components/lab/live-run.ts`](components/lab/live-run.ts) drives DuckDB-WASM through the same runner. It reads a watermark from the loaded data, extracts only what changed (Calgary via the City's `:updated_at`; Flames via the [`/api/nhl`](app/api/nhl/route.ts) proxy, since the NHL API has no CORS), builds into a `live` schema, merges into the served tables on each model's `mergeKey`, re-runs the tests and refreshes the dashboards.

### Home value model

[`lib/ml/gbm.ts`](lib/ml/gbm.ts) is a dependency-free gradient-boosted tree regressor (histogram splits, row subsampling, L2 leaves, seeded RNG, path-based explanations). [`lib/ml/housing.ts`](lib/ml/housing.ts) adds out-of-fold target encoding, a hashed train/test split, metrics against a community-median baseline, and the model file format. The housing pipeline trains it after the tests pass and writes `public/data/housing-model.json`; the Lab loads it for explained estimates and can retrain it in the browser.

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

## Writing rules for site copy

No em dashes. No filler phrasing ("leverage", "seamless", "passionate about"). Short, direct, and tied to outcomes. Use numbers only as given; leave a `<Todo>` rather than inventing one.

## Data sources

- City of Calgary Open Data: [Building Permits](https://data.calgary.ca/Business-and-Economic-Activity/Building-Permits/c2es-76ed) (Open Government Licence, City of Calgary)
- NHL public API (`api-web.nhle.com`): play-by-play and schedules. Data © NHL; used here for non-commercial illustration.
