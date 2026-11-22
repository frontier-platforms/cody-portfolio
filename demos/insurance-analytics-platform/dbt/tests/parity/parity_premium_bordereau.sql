-- Same idea as parity_earned_premium_monthly.sql, for the bordereau mart: dbt's
-- bdx_premium must reproduce LEGACY.PUBLIC.PREMIUM_BORDEREAU exactly, one row per
-- policy transaction per carrier. Zero rows returned = pass.
with dbt_model as (
    select * from {{ ref('bdx_premium') }}
),

legacy as (
    select * from LEGACY.PUBLIC.PREMIUM_BORDEREAU
)

select
    coalesce(d.policy_transaction_id, l.policy_transaction_id) as policy_transaction_id,
    coalesce(d.carrier_id, l.carrier_id)                       as carrier_id,
    d.carrier_premium_share                                    as dbt_carrier_premium_share,
    l.carrier_premium_share                                    as legacy_carrier_premium_share
from dbt_model d
full outer join legacy l
    on l.policy_transaction_id = d.policy_transaction_id
    and l.carrier_id = d.carrier_id
where d.policy_transaction_id is null
   or l.policy_transaction_id is null
   or d.carrier_premium_share != l.carrier_premium_share
