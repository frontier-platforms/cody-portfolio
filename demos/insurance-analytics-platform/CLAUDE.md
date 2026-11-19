# Insurance Analytics Platform: Practice Build

A hands-on rebuild of a modern insurance analytics stack, mirroring the platform Cody leads at an insurance
software company (MGA policy admin SaaS). The goal is to touch every layer once, compare front-end options
with evidence, and finish with a reference architecture and decision records.

This is one of the self-contained projects under `demos/` (see `demos/README.md`) — it keeps its own
dependencies, env vars and checks, separate from the portfolio site's root tooling and from the other demos.

## Ground rules (read first)

- **Synthetic data only.** No real company, client or personal data, ever. All names, addresses and numbers
  come from the generator.
- **Canadian residency.** Use Canadian regions (Azure Canada Central, Snowflake on Azure Canada Central). Note
  anything that would send data outside Canada (for example, Cortex cross-region inference).
- **Azure first.** Cody is learning Azure for a new job and wants Azure used wherever there's a real choice,
  even if another cloud would be marginally simpler. Call out the Azure concept being used (resource groups,
  RBAC, networking, Key Vault, etc.) rather than assuming prior AWS/GCP intuition transfers.
- **Cost guardrails.** Azure budget alert, Snowflake resource monitor, XSMALL warehouses with 60-second
  auto-suspend. Turn SFTP off after testing. Tear down at the end.
- **No secrets in Git.** Use `.env` (gitignored), GitHub Actions secrets and Azure Key Vault. Snowflake service
  users use key-pair auth only.
- **Small, reviewable steps.** One phase at a time, each on a branch with a pull request. Run tests before
  calling anything done.
- **Write it down.** Every significant choice gets a short decision record in `docs/adr/`.

## Working agreements for Claude Code

- **Mentor mode.** Cody wants to understand every step, not just see it done. Explain the *why* concisely
  before or alongside doing the work. Favor teaching moments over silently producing finished output,
  especially for Azure and Terraform, which are new to him.
- Ask before creating cloud resources or anything that costs money, and before destructive commands (drop,
  delete, destroy, force-push).
- Work phase by phase. At the start of each phase, restate the goal and done criteria; at the end, show test
  results.
- Prefer simple, readable code with comments where intent isn't obvious.
- Never print or commit secrets. Read credentials from environment variables.
- When unsure about a fast-moving Snowflake feature (App Runtime, dbt Projects, Cortex Agents, semantic
  views), check the current Snowflake docs rather than guessing syntax.
- Keep `README.md` and `docs/` updated as things change.

## Architecture

```
Postgres (Azure, 3 tenants, synthetic)
   │  Airbyte CDC (logical replication)
   ▼
Snowflake RAW
   │  dbt Projects on Snowflake (EXECUTE DBT PROJECT), scheduled by Snowflake tasks
   ▼
ANALYTICS: staging → intermediate → marts (+ snapshots, tests)
   │
   ├── Semantic view (metrics defined once)
   │      ├── Cortex Agent (embedded AI chat)
   │      ├── Front-end option A: Snowflake App Runtime (React / Next.js)
   │      ├── Front-end option B: Lightdash (self-hosted, open source)
   │      └── Front-end option C: Custom Next.js app querying Snowflake via a back end
   └── Bordereau export: COPY INTO Azure Blob → SFTP

Cross-cutting: GitHub + Actions (CI/CD), Terraform (Azure + Snowflake), row access + masking policies,
Elementary (data observability), resource monitors, Entra ID SSO (optional)
```

## Stack

| Layer | Tool | Notes |
| --- | --- | --- |
| Source app DB | Azure Database for PostgreSQL, Flexible Server (B1ms) | `wal_level = logical` for CDC; firewall rule for my IP |
| Ingestion | Airbyte open source via `abctl` (local Docker) | Postgres CDC source → Snowflake destination (`RAW`) |
| Warehouse | Snowflake (Azure, Canada Central, Enterprise edition) | Enterprise needed for masking and row access policies |
| Transformation | dbt Core project, deployed as a Snowflake `DBT PROJECT` | Develop locally in VS Code; run in Snowflake |
| Orchestration | Snowflake tasks (cron, or stream-triggered) | Task graph: build → export bordereaux; failure blocks downstream |
| Data quality | dbt tests, model contracts, dbt-expectations, Elementary | Packages need external access integration or vendoring |
| Semantic layer | Snowflake semantic views | Kept in the repo, deployed by dbt |
| AI chat | Cortex Agents over the semantic view, via REST API | Check model availability in Canada |
| Front end A | Snowflake App Runtime (Next.js) | Not available on trial accounts; may need a paid account |
| Front end B | Lightdash open source (Docker Compose) | Embedding requires a paid licence; test internal use only |
| Front end C | Next.js + Recharts/ECharts + Snowflake Node driver | The licence-free client-embedding path |
| Infra as code | Terraform (`azurerm`, `snowflakedb/snowflake`) | Local state for practice; never commit state |
| CI/CD | GitHub Actions (root `.github/workflows/`, scoped to this folder) | PR: lint + dbt build in CI schema; merge: `snow dbt deploy` |
| File delivery | Snowflake storage integration + external stage on Azure Blob, SFTP | SFTP bills hourly while enabled |

**Machine:** MacBook Air M5 with Docker Desktop. Give Docker at least 4 CPUs and 10 GB of memory. Run Airbyte
and Lightdash one at a time if memory is tight.

## Repo structure (this folder)

```
demos/insurance-analytics-platform/
├── CLAUDE.md                 # this file
├── README.md                 # what it is, how to run it, screenshots
├── Makefile                  # common commands (generate, deploy, test, teardown)
├── .env.example               # every variable, no values
├── .pre-commit-config.yaml   # sqlfluff, yamllint, detect-secrets, terraform fmt
├── infra/
│   ├── azure/                # resource group, Postgres, storage (HNS on), Key Vault, budget
│   └── snowflake/            # databases, warehouses, roles, grants, users, resource monitor
├── generator/                # Python synthetic data generator + daily change simulator
├── source_db/                # Postgres DDL (mimics an Entity Framework app schema)
├── legacy/                   # Snowflake stored procedures + tasks (the "before" state)
├── dbt/                      # dbt project (models, snapshots, tests, macros, seeds, semantic views)
├── snowflake/                # tasks, streams, policies, storage integration, Cortex agent SQL
├── apps/
│   ├── app-runtime/          # Option A: Snowflake App Runtime (Next.js)
│   ├── custom/                # Option C: Next.js + back-end API + Cortex chat component
│   └── lightdash/             # Option B: docker-compose + config
└── docs/
    ├── adr/                   # decision records
    ├── architecture.md        # diagram + explanation
    ├── frontend-evaluation.md
    └── runbook.md              # how to run, monitor, recover, tear down
```

GitHub Actions workflow files for this project live in the repo root `.github/workflows/`, not in this folder
(GitHub only reads workflows from the repo root), scoped to this path with `working-directory` and path
filters — matching the existing `calgary-transit.yml` pattern.

## Data

### Source schema (Postgres, EF-style)

PascalCase tables and columns (as Entity Framework creates them), integer enums, `CreatedAt`/`UpdatedAt` on
every table, `TenantId` on every row, a primary key on every table.

- `Tenants` (3 MGAs)
- `Carriers`, `Programs`, `ProgramCarrierShares` (e.g. 60/40 capacity splits)
- `Brokers`
- `Insureds` (PII: name, email, date of birth, address)
- `Policies`, `PolicyCoverages`, `PolicyTransactions` (new business, endorsement, renewal, cancellation,
  reinstatement; each with effective date, processed date and premium change)
- `Claims`, `ClaimTransactions` (payments, reserve changes, recoveries)

### Generator

- Initial load: about 5,000 policies across 3 tenants and 2 to 3 lines of business.
- Daily run: new business, endorsements, cancellations, **backdated changes**, renewals, new claims, payments
  and reserve changes. Occasionally hard-delete a row, to test CDC deletes.
- A "schema change" mode that renames a column the way an EF migration would (for the data-contract test).
- Deterministic with a seed, so results are reproducible.

### Legacy "before" state

Write 2 or 3 Snowflake stored procedures and tasks that build an earned premium table and a premium bordereau
the old way. The migration to dbt must produce the same results, proven by parity tests. This mirrors the
real job.

## Snowflake setup

- **Databases:** `RAW`, `ANALYTICS_DEV`, `ANALYTICS_PROD`, `GOVERNANCE`.
- **Warehouses (XSMALL, 60s auto-suspend):** `LOAD_WH`, `TRANSFORM_WH`, `BI_WH`, `AI_WH`.
- **Roles:**
  - `LOADER` writes `RAW`.
  - `TRANSFORMER` reads `RAW`, writes the analytics databases and runs the dbt project.
  - `REPORTER` reads prod marts and semantic views.
  - `TENANT_A`, `TENANT_B` and `TENANT_C` each see only their own tenant.
  - `PII_READER` sees unmasked PII.
- **Service users (key-pair):** `airbyte_svc`, `ci_svc`, `app_svc`, `lightdash_svc`.
- **Governance:**
  - Tag-based PII masking.
  - A row access policy on `tenant_id`. `TRANSFORMER` and `REPORTER` see all tenants; tenant roles see only
    their own.
  - Secure views for anything client-facing.
- **Resource monitor** on the account, plus a weekly credit query.

## dbt project

- **Layers:**
  - `staging`: rename to snake_case, cast, keep the latest row per key by `_ab_cdc_lsn`, flag
    `_ab_cdc_deleted_at`.
  - `intermediate`
  - `marts/core`, `marts/finance`, `marts/bordereaux`
- **Marts:**
  - `fct_premium_transactions`: one row per transaction per coverage.
  - `fct_earned_premium_monthly`: periodic snapshot, one row per policy per coverage per month.
  - `fct_claim_transactions`
  - `fct_claims_monthly`
  - `dim_policy` and `dim_broker`: type 2, via snapshots.
  - `dim_insured`, `dim_program`, `dim_carrier`, `dim_coverage`, `dim_date`.
  - `rpt_loss_ratio_monthly`.
- **Bordereaux:**
  - `bdx_premium` at transaction level, by processed date.
  - One mapping model per carrier, using a code-mapping seed.
  - A snapshot that locks each sent period.
- **Tests:**
  - `unique` and `not_null` on every grain.
  - Relationships and accepted values.
  - Contracts on marts.
  - dbt-expectations range checks.
  - Singular reconciliation tests: bordereau totals tie to source by tenant and month; earned + unearned =
    written; legacy vs. dbt parity.
- **Source freshness** on `_airbyte_extracted_at`.
- **PII:** `meta: {pii: ...}` in YAML, applied as Snowflake tags by a post-hook macro.
- **Targets:** `dev` (personal schema in `ANALYTICS_DEV`), `ci` (temporary schema), `prod`.
- **Deploy:** `snow dbt deploy`; run with `EXECUTE DBT PROJECT ... ARGS = 'build --target prod'`.
- **Orchestration:**
  - Option 1 is a cron task timed after Airbyte's sync.
  - Option 2 is a stream on a key raw table with a `WHEN SYSTEM$STREAM_HAS_DATA` root task. The root task
    consumes the stream into a run log, then a child task runs dbt.
  - In both, a child task exports bordereaux only after a successful build.

## Semantic layer and AI chat

- **Semantic view:** written premium, earned premium, incurred losses, loss ratio, policies in force, by
  tenant, program, carrier, line and month. Add descriptions, synonyms and verified queries.
- **Single source of truth:** decide how Lightdash's dbt-YAML metrics relate to the semantic view. Record the
  decision.
- **Cortex Agent** with Cortex Analyst over the semantic view, called from a back end through the REST API.
  Never call it from the browser.
- **Evaluation:** 30 to 50 questions with known answers, scored after every semantic view change. Log
  questions, answers and SQL.
- **Tenant safety:** the agent's queries must respect the row access policy. Test cross-tenant questions.

## Front-end evaluation (the main experiment)

Build the same report in each option: an earned premium trend, loss ratio by program, and policies in force,
filtered to one tenant. Add the AI chat where possible.

| Criterion | Question |
| --- | --- |
| Build speed | Hours to build, and hours to change a chart |
| Look and feel | Can it match Modular's app? |
| Tenant security | Can one client ever see another's data? Tested how? |
| Client embedding | Can external users without Snowflake accounts use it? Licence needed? |
| Semantic fit | Does it read our metric definitions or redefine them? |
| Cost | Licence + Snowflake compute + hosting + engineering time |
| Upkeep | What breaks when the model changes? Who maintains it? |
| Residency | Does any data leave Canada? |

Write the results up in `docs/frontend-evaluation.md` with screenshots, and add a decision record.

## CI/CD (GitHub Actions)

- **On pull request:**
  - lint: sqlfluff, yamllint, terraform fmt, detect-secrets
  - `dbt build --target ci` into a temporary schema, then drop it
  - `terraform plan` for `infra/` changes, posted as a comment
- **On merge to main:**
  - `snow dbt deploy` updates the Snowflake dbt project
  - apply Snowflake SQL changes (tasks, policies)
  - build and deploy the app (App Runtime or custom)
- **Later:** slim CI with `--select state:modified+ --defer`, using the prod `manifest.json` from
  `SYSTEM$LOCATE_DBT_ARTIFACTS`.
- **Protect `main`:** pull requests only, passing checks required.

## Observability and operations

- Elementary dbt package, with its report generated in CI. Alerts on test failures and freshness.
- Snowflake task history and dbt run logs (Snowsight and the event table).
- A weekly cost query: credits by warehouse, Cortex usage, Azure cost.
- `docs/runbook.md`: how to rerun, backfill, recover from a failed sync, rotate keys and tear down.

## Phases and done criteria

1. **Foundations.** Repo, pre-commit, Terraform for Azure and Snowflake, budget alert, resource monitor.
   *Done when* `make plan` and `make apply` work, and nothing secret is committed.
2. **Source and ingestion.** Postgres schema, generator, Airbyte CDC into `RAW`. *Done when* two syncs show
   only changes, and deletes are flagged.
3. **Legacy state.** Stored procedures and tasks building earned premium and a bordereau. *Done when* they
   run on a schedule.
4. **dbt on Snowflake.** Staging, snapshots, marts, tests, deployed and scheduled by tasks. *Done when* prod
   builds on a schedule, all tests pass, and parity tests match the legacy outputs.
5. **Governance and bordereaux.** Masking, row access, secure views, bordereau export to Blob and SFTP gated
   on tests. *Done when* tenant tests pass and a file downloads over SFTP.
6. **Semantic layer and AI chat.** Semantic view, Cortex Agent, evaluation set. *Done when* accuracy is
   scored and the residency check is recorded.
7. **Front-end bake-off.** Options A, B and C. *Done when* the evaluation doc and decision record are
   written.
8. **CI/CD and data contracts.** Full GitHub Actions pipeline. Simulate an EF column rename and show where
   it's caught. *Done when* a pull request with a breaking change fails CI.
9. **Wrap-up.** Architecture diagram, README with screenshots, runbook, cost summary, teardown. *Done when*
   nothing is still billing.

## Open questions to answer along the way

- Which Cortex models run in Azure Canada Central? Is cross-region inference needed?
- Can App Runtime apps serve external users, or only Snowflake users?
- Which dbt version does Snowflake support, and how are packages installed (external access vs. vendored)?
- Lightdash: what works in open source vs. needing a licence (embedding, user attributes, SSO)?
- How should tenant context pass from the app to Snowflake for the React app and the AI chat?
