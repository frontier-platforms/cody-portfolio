# Insurance Analytics Platform (practice build)

A hands-on rebuild of a modern insurance analytics stack: Postgres → Airbyte CDC → Snowflake → dbt →
semantic layer + AI chat → a front-end bake-off, all on synthetic data. See `CLAUDE.md` for the full spec,
ground rules and phase plan.

**Status:** Phase 1 (Foundations) — in progress.

## Why this exists

Practice for the architecture Cody runs day to day at an MGA policy admin SaaS company, built from scratch
on throwaway data so every layer can be touched, broken and rebuilt without risk. Secondary goal: build real
hands-on Azure skills, since this project deliberately prefers Azure services wherever there's a choice.

## Phases

| # | Phase | Status |
| --- | --- | --- |
| 1 | Foundations (repo, pre-commit, Terraform, budget alert, resource monitor) | In progress |
| 2 | Source Postgres + generator + Airbyte CDC | Not started |
| 3 | Legacy "before" state (stored procs + tasks) | Not started |
| 4 | dbt on Snowflake (staging → marts, tests, scheduling) | Not started |
| 5 | Governance + bordereaux export | Not started |
| 6 | Semantic layer + Cortex AI chat | Not started |
| 7 | Front-end bake-off (App Runtime vs. Lightdash vs. custom Next.js) | Not started |
| 8 | CI/CD + data contracts | Not started |
| 9 | Wrap-up (architecture doc, runbook, cost summary, teardown) | Not started |

## Running this locally

Not yet runnable end to end — see each phase's done criteria in `CLAUDE.md`. Once Phase 1 is complete:

```bash
cd demos/insurance-analytics-platform
cp .env.example .env   # fill in real values, never commit this file
make plan              # terraform plan for infra/azure and infra/snowflake
make apply             # terraform apply (asks for confirmation; costs money)
```

## Decision records

See `docs/adr/` for the reasoning behind notable choices, starting with
[0001: nest under `demos/`](docs/adr/0001-nest-under-demos.md).
