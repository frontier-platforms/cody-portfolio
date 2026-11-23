-- Lean "policies in force" snapshot: currently-active policies only, as of today - not
-- a full type-2 history (CLAUDE.md's original dim_policy snapshot idea). The bake-off
-- report just needs a current count per tenant/program, not a historical trend, so
-- this stays a simple current-state model rather than a proper SCD.
select
    policy_id,
    tenant_id,
    program_id,
    broker_id,
    insured_id,
    policy_number,
    effective_date,
    expiration_date,
    status
from {{ ref('stg_policies') }}
where not is_deleted
  and status = 0 -- 0=Active
