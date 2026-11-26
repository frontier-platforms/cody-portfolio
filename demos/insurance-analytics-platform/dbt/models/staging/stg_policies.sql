with source as (
    select * from {{ source('airbyte', 'POLICIES') }}
)

select
    ID                             as policy_id,
    TENANTID                       as tenant_id,
    PROGRAMID                      as program_id,
    BROKERID                       as broker_id,
    INSUREDID                      as insured_id,
    POLICYNUMBER                   as policy_number,
    EFFECTIVEDATE                  as effective_date,
    EXPIRATIONDATE                 as expiration_date,
    -- 0=Active, 1=Cancelled, 2=Expired, 3=NonRenewed
    STATUS                         as status,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
