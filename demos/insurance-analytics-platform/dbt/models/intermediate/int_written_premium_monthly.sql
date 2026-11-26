-- Written premium is booked when a transaction is PROCESSED, not when it takes
-- effect - standard P&C convention, matching the legacy procedure's `written` CTE and
-- the generator's own separate ProcessedDate/EffectiveDate fields.
with policy_transactions as (
    select * from {{ ref('stg_policy_transactions') }}
    where not is_deleted
)

select
    policy_coverage_id,
    date_trunc('month', processed_date) as period_month,
    -- Explicit cast before the aggregate, not just relying on premium_change's own
    -- column type - Snowflake's own numeric-types docs warn that floating-point
    -- rounding error can creep in during aggregation, and casting to a fixed-point
    -- type first is the documented mitigation.
    cast(sum(premium_change) as number(12, 2)) as written_this_month
from policy_transactions
group by 1, 2
