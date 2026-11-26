-- One row per policy coverage with its earning-window boundaries. Same reasoning as
-- the legacy SP_BUILD_EARNED_PREMIUM procedure's policy_coverage CTE: EFFECTIVEDATE/
-- EXPIRATIONDATE on the policy always reflect its true lifetime, even after a renewal
-- (which extends EXPIRATIONDATE) or a cancellation (which overwrites it to the
-- cancellation date) - see docs/adr/0002 for the full reasoning.
with policy_coverages as (
    select * from {{ ref('stg_policy_coverages') }}
    where not is_deleted
),

policies as (
    select * from {{ ref('stg_policies') }}
    where not is_deleted
)

select
    pc.policy_coverage_id,
    pc.policy_id,
    pc.tenant_id,
    pc.premium,
    p.effective_date  as term_start,
    p.expiration_date as term_end
from policy_coverages pc
inner join policies p
    on p.policy_id = pc.policy_id
