# 0002: Legacy stored procedures built by hand, not Terraform

## Status

Accepted (2026-11-21)

## Context

Phase 3 needed two Snowflake stored procedures and a scheduling task to build an
earned-premium table and a premium bordereau "the old way" - a deliberate baseline
for Phase 4's dbt migration to be proven against with a parity test.

## Decisions

**Created directly in Snowsight, not Terraform.** `infra/snowflake/` manages
platform-level objects (databases, warehouses, roles, grants) via Terraform. Procedure
and task bodies are full procedural SQL scripts, which are awkward to embed in HCL
string literals (no heredoc, no syntax highlighting, no inline error checking) and,
more importantly, this mirrors how legacy business logic actually gets created at most
real companies: hand-written in a SQL console, predating any IaC adoption. The final
SQL is still checked into `legacy/*.sql` for reproducibility - it's authored by hand,
not left undocumented.

**Earned premium uses a naive, whole-premium straight-line proration.** Each policy
coverage's current `Premium` is treated as earning uniformly across its full term
(`Policies.EFFECTIVEDATE` to `EXPIRATIONDATE`), even though an endorsement added
mid-term technically wasn't in force before it existed. A more rigorous model would
prorate each premium transaction layer (new business, each endorsement, each renewal)
from its own effective date. The simpler version was chosen because it's a common
real-world legacy shortcut, it reconciles exactly with the generator's own cancellation
refund formula (both use the same term boundaries), and Phase 4 only needs to either
reproduce it exactly (parity) or knowingly improve on it (a later ADR, not a silent fix).

**Reused `LOAD_WH` instead of a dedicated warehouse.** These are small queries against a
few thousand rows; a second XSMALL warehouse's worth of cost-guardrail bookkeeping
wasn't worth it for a practice account.

## Consequences

- A from-scratch rebuild of this environment must run `infra/snowflake` (Terraform),
  then `legacy/0001` through `0004` (by hand, in Snowsight) - two different tools for
  two deliberately different categories of object.
- Phase 4's parity test has a known, documented imprecision to either match or fix, not
  a silent discrepancy to be surprised by later.
