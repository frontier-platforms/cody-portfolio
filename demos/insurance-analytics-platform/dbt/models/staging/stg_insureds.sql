-- PII columns pass through unmasked here on purpose - CLAUDE.md's masking policy
-- (tag-based, applied by a post-hook macro off `meta: {pii: ...}` in schema.yml) is a
-- Phase 5 governance concern, not a staging concern. Staging's job is just to expose
-- a clean, typed, deduped row; who's allowed to see which columns is enforced later.
with source as (
    select * from {{ source('airbyte', 'INSUREDS') }}
)

select
    ID                             as insured_id,
    TENANTID                       as tenant_id,
    FIRSTNAME                      as first_name,
    LASTNAME                       as last_name,
    EMAIL                          as email,
    DATEOFBIRTH                    as date_of_birth,
    ADDRESSLINE1                   as address_line_1,
    ADDRESSLINE2                   as address_line_2,
    CITY                           as city,
    PROVINCE                       as province,
    POSTALCODE                     as postal_code,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
