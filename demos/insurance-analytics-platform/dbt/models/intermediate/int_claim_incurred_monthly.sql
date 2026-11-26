-- One row per program per month: incurred losses, cumulative as of month-end - same
-- convention as fct_earned_premium_monthly, deliberately, so the loss ratio mart divides
-- two consistently "to date" numbers instead of mixing a monthly delta against a
-- running total. Standard net-incurred formula: paid + reserve change - recoveries.
-- Confirmed against generator/daily.py and seed.py: payments and recoveries are always
-- positive dollar amounts (recoveries reduce incurred, hence subtracted), reserve
-- changes are already signed (a release is a negative Amount), so a plain SUM is
-- correct for that type without a CASE split.
with claim_transactions as (
    select * from {{ ref('stg_claim_transactions') }}
    where not is_deleted
),

claims as (
    select * from {{ ref('stg_claims') }}
    where not is_deleted
),

policies as (
    select * from {{ ref('stg_policies') }}
    where not is_deleted
),

monthly as (
    select
        p.tenant_id,
        p.program_id,
        date_trunc('month', ct.transaction_date) as period_month,
        sum(case when ct.transaction_type in (0, 1) then ct.amount else 0 end)
            - sum(case when ct.transaction_type = 2 then ct.amount else 0 end) as incurred_this_month
    from claim_transactions ct
    inner join claims c on c.claim_id = ct.claim_id
    inner join policies p on p.policy_id = c.policy_id
    group by 1, 2, 3
)

select
    tenant_id,
    program_id,
    period_month,
    sum(incurred_this_month) over (
        partition by program_id order by period_month
        rows between unbounded preceding and current row
    ) as incurred_losses
from monthly
