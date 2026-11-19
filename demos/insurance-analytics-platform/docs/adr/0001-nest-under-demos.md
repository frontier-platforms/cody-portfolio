# 1. Nest the project under `demos/insurance-analytics-platform`

## Status

Accepted — 2026-11-17

## Context

This project's original spec was written as if it were the root of its own git repository, with top-level
folders like `infra/`, `generator/`, `dbt/`, `snowflake/` and `apps/`. We're instead building it inside the
existing `cody-portfolio` repo, as a new "lab."

That repo already has top-level `dbt/`, `ingest/`, `pipeline/`, `ml/` and `airflow/` folders, which belong to
an earlier, already-built lab — the Calgary Transit demo — and are wired into the live portfolio site. The
repo also already has a convention for exactly this situation: `demos/`, a folder of self-contained data
products, each in its own subfolder with its own dependencies, env vars and checks, excluded from the
portfolio's root TypeScript/ESLint/Prettier/Ruff tooling (see `demos/README.md` and `BRAND.md` §11).

## Decision

Put the whole project under `demos/insurance-analytics-platform/`, keeping the folder shape from the original
spec one level deeper: `demos/insurance-analytics-platform/{infra,generator,source_db,legacy,dbt,snowflake,
apps,docs}`. A project-specific `CLAUDE.md` lives at the project root and layers on top of the portfolio's
root `CLAUDE.md`/`AGENTS.md`/`BRAND.md`.

One exception: GitHub Actions workflow files cannot live in a nested `.github/` — GitHub only reads workflows
from the repo root. Those will go in the existing root `.github/workflows/`, scoped to this project with
`working-directory` and path filters, matching the existing `calgary-transit.yml` pattern (built in Phase 8).

## Consequences

- No collisions with the Calgary Transit demo's identically-named top-level folders.
- The project is excluded from the portfolio's root lint/format tooling, same as other demos, and can use its
  own Python/Terraform/pre-commit tooling freely.
- Pre-commit hooks for this project need `files:` patterns anchored to
  `^demos/insurance-analytics-platform/`, since the repo has one `.git` directory and one hooks path shared
  by every demo.
- If this project is ever worth a public page (like Calgary Transit's `/data-demos/calgary-transit`), it gets
  its own row in `demos/README.md` and its own entry on `/data-demos` at that point — not before.
