# 0003: Reorder Phases 6/7, defer the bordereau export to Phase 8

## Status

Accepted (2026-11-22)

## Context

Phase 5 was underway (roles, row access policy, PII masking and secure views were built
and verified) when the remaining work - an Azure Blob storage account with native SFTP
support, a Snowflake storage integration and external stage, and the actual bordereau
export task - came up next. At the same time, the priority shifted to finishing the
semantic layer/AI chat (Phase 6) and the front-end bake-off (Phase 7) in the same
session, with Phase 7 specifically wanted first.

## Decisions

**Phase 7 runs before Phase 6**, reversing CLAUDE.md's original order. Lightdash ("BI as
code") is the front-end option that matters most here - it's directly relevant to work
the owner expects to do early in a new job - so it gets built out for real: dbt-YAML
metrics, actual dashboards, actual charts. Snowflake App Runtime and the custom Next.js
option are scoped light - built just enough to score honestly against the evaluation
criteria in CLAUDE.md's front-end table, not polished to the same depth.

**The Azure Blob + SFTP bordereau export moves to Phase 8.** Building it now would mean
wiring Azure storage account creation, a Snowflake storage integration (with its
Azure AD consent step), an external stage, and a scheduled export task - then redoing
some of that wiring once Phase 8's GitHub Actions pipeline needs to deploy and manage
the same infrastructure. Building it once, as part of Phase 8's CI/CD work, avoids that
double effort. Phase 5's governance work (roles, row access, masking, secure views) is
unaffected and already verified end to end.

## Consequences

- CLAUDE.md's phase list now notes Phase 5 as partially done and points to this ADR for
  why, and Phase 8's description now mentions the deferred export.
- Phase 8 absorbs more scope than originally planned: alongside CI/CD and the EF
  column-rename data-contract test, it also builds the Azure storage account, Snowflake
  storage integration, external stage and bordereau export task.
- Tenant data (fct_earned_premium_monthly, bdx_premium) is already tenant-isolated and
  PII-masked regardless of this deferral - nothing about Phase 5's actual governance
  guarantees is weakened by pushing the export out.
