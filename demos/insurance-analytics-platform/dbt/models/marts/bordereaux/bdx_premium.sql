-- dbt's rebuild of LEGACY.PUBLIC.PREMIUM_BORDEREAU: one row per policy transaction per
-- carrier, no proration, no monthly bucketing - a bordereau reports what was actually
-- written, at the transaction level, by processed date. A program split 60/40 across
-- two carriers produces two rows for the same transaction, one per carrier's cut,
-- which is exactly what the join to program_carrier_shares does.
with policy_transactions as (
    select * from {{ ref('stg_policy_transactions') }}
    where not is_deleted
),

policies as (
    select * from {{ ref('stg_policies') }}
    where not is_deleted
),

program_carrier_shares as (
    select * from {{ ref('stg_program_carrier_shares') }}
    where not is_deleted
)

select
    pt.tenant_id,
    pcs.carrier_id,
    pt.policy_id,
    pt.policy_coverage_id,
    pt.policy_transaction_id,
    pt.processed_date,
    pt.transaction_type,
    pcs.share_percentage                                     as carrier_share_percentage,
    round(pt.premium_change * pcs.share_percentage / 100, 2) as carrier_premium_share
from policy_transactions pt
inner join policies p
    on p.policy_id = pt.policy_id
inner join program_carrier_shares pcs
    on pcs.program_id = p.program_id
