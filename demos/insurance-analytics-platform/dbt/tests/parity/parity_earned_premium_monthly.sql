-- The actual Phase 4 done-criteria check: dbt's fct_earned_premium_monthly must
-- reproduce LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY exactly, row for row. A singular
-- test passes when it returns zero rows - every row returned here is a mismatch.
-- FULL OUTER JOIN also catches a row existing on only one side (a coverage/month
-- dbt computed that legacy didn't, or vice versa), not just differing values.
--
-- Why the legacy procedure never needed the CAST(...AS NUMBER(12,2)) calls added to
-- fct_earned_premium_monthly: its target table was CREATE TABLE'd up front with
-- NUMBER(12,2) columns (legacy/0001), so Snowflake implicitly rounds to that
-- precision on every INSERT regardless of any floating-point residue mid-calculation.
-- dbt's CREATE TABLE AS SELECT has no pre-declared schema - it infers column types
-- from the SELECT itself - so the same precision has to be forced explicitly in the
-- query instead of getting it for free from a fixed target schema.
with dbt_model as (
    select * from {{ ref('fct_earned_premium_monthly') }}
),

legacy as (
    select * from LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY
)

select
    coalesce(d.policy_coverage_id, l.policy_coverage_id) as policy_coverage_id,
    coalesce(d.period_month, l.period_month)             as period_month,
    d.written_premium                                    as dbt_written_premium,
    l.written_premium                                    as legacy_written_premium,
    d.earned_premium                                      as dbt_earned_premium,
    l.earned_premium                                      as legacy_earned_premium,
    d.unearned_premium                                    as dbt_unearned_premium,
    l.unearned_premium                                    as legacy_unearned_premium
from dbt_model d
full outer join legacy l
    on l.policy_coverage_id = d.policy_coverage_id
    and l.period_month = d.period_month
where d.policy_coverage_id is null
   or l.policy_coverage_id is null
   or d.written_premium != l.written_premium
   or d.earned_premium != l.earned_premium
   or d.unearned_premium != l.unearned_premium
