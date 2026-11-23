-- Loss ratio = incurred losses / earned premium, by program and month - both sides
-- cumulative-as-of-month-end (see int_claim_incurred_monthly's comment for why).
-- Earned premium needs rolling up from fct_earned_premium_monthly's policy-coverage
-- grain to program grain via policy -> program; incurred losses already lands at that
-- grain.
with earned as (
    select
        p.tenant_id,
        p.program_id,
        e.period_month,
        sum(e.earned_premium) as earned_premium
    from {{ ref('fct_earned_premium_monthly') }} e
    inner join {{ ref('stg_policies') }} p
        on p.policy_id = e.policy_id
        and not p.is_deleted
    group by 1, 2, 3
),

incurred as (
    select * from {{ ref('int_claim_incurred_monthly') }}
)

select
    coalesce(e.tenant_id, i.tenant_id) as tenant_id,
    coalesce(e.program_id, i.program_id) as program_id,
    coalesce(e.period_month, i.period_month) as period_month,
    coalesce(e.earned_premium, 0) as earned_premium,
    coalesce(i.incurred_losses, 0) as incurred_losses,
    case
        when coalesce(e.earned_premium, 0) = 0 then null
        else round(coalesce(i.incurred_losses, 0) / e.earned_premium, 4)
    end as loss_ratio
from earned e
full outer join incurred i
    on i.program_id = e.program_id
    and i.period_month = e.period_month
