-- dbt's rebuild of LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY: same naive whole-premium
-- straight-line proration, same cumulative-as-of-month-end grain (not each month's own
-- activity) - that's what makes WRITTEN = EARNED + UNEARNED hold on every row, not
-- just in aggregate. See docs/adr/0002 for why this simplification was chosen, and
-- the parity test (tests/parity/) that checks this model actually matches the legacy
-- table it's replacing.
with earned as (
    select
        tenant_id,
        policy_id,
        policy_coverage_id,
        period_month,
        -- Deliberately NOT rounded per month - the legacy procedure never rounds
        -- EARNED_THIS_MONTH either, only its final cumulative total (implicitly, via
        -- the NUMBER(12,2) target column on INSERT). Rounding each month individually
        -- before summing cumulatively gives a different answer than summing the exact
        -- values and rounding once at the end - a real one-cent-level drift, not
        -- floating-point noise, found by comparing against the legacy table directly.
        -- The final cast on earned_premium below (after the cumulative SUM) is the
        -- only rounding point, matching legacy's behavior exactly.
        premium * days_in_force_this_month / nullif(total_term_days, 0) as earned_this_month
    from {{ ref('int_earned_premium_monthly') }}
),

written as (
    select * from {{ ref('int_written_premium_monthly') }}
),

combined as (
    select
        e.tenant_id,
        e.policy_id,
        e.policy_coverage_id,
        e.period_month,
        e.earned_this_month,
        coalesce(w.written_this_month, 0) as written_this_month
    from earned e
    left join written w
        on w.policy_coverage_id = e.policy_coverage_id
        and w.period_month = e.period_month
)

-- unearned_premium is deliberately a THIRD independent window subtraction here, not
-- written_premium - earned_premium from the two already-rounded columns below - a
-- "more correct" construction was tried and it broke true parity with the legacy
-- table on a handful of edge-case rows, because the legacy procedure has the exact
-- same "independent window, independently rounded" quirk. Phase 4's job is to
-- reproduce the legacy output exactly first (see docs/adr/0002); matching that quirk
-- is a decision to improve on later, not a silent thing to fix now.
select
    tenant_id,
    policy_id,
    policy_coverage_id,
    period_month,
    cast(sum(written_this_month) over (
        partition by policy_coverage_id order by period_month
        rows between unbounded preceding and current row
    ) as number(12, 2)) as written_premium,
    cast(sum(earned_this_month) over (
        partition by policy_coverage_id order by period_month
        rows between unbounded preceding and current row
    ) as number(12, 2)) as earned_premium,
    cast(sum(written_this_month) over (
        partition by policy_coverage_id order by period_month
        rows between unbounded preceding and current row
    ) - sum(earned_this_month) over (
        partition by policy_coverage_id order by period_month
        rows between unbounded preceding and current row
    ) as number(12, 2)) as unearned_premium
from combined
