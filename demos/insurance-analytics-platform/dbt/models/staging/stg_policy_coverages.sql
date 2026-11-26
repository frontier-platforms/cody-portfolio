-- "LIMIT" is a reserved SQL keyword, and the source table has a column literally
-- named that (from Postgres's "Limit" column, straight-uppercased by Airbyte like
-- every other column) - it has to stay double-quoted here or Snowflake reads it as
-- the LIMIT clause keyword instead of a column reference.
with source as (
    select * from {{ source('airbyte', 'POLICYCOVERAGES') }}
)

select
    ID                             as policy_coverage_id,
    TENANTID                       as tenant_id,
    POLICYID                       as policy_id,
    -- 0=GeneralLiability, 1=Property, 2=Cyber, 3=Umbrella, 4=Excess
    COVERAGETYPE                   as coverage_type,
    "LIMIT"                        as coverage_limit,
    DEDUCTIBLE                     as deductible,
    PREMIUM                        as premium,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
