with source as (
    select * from {{ source('airbyte', 'CLAIMS') }}
)

select
    ID                             as claim_id,
    TENANTID                       as tenant_id,
    POLICYID                       as policy_id,
    CLAIMNUMBER                    as claim_number,
    DATEOFLOSS                     as date_of_loss,
    REPORTEDDATE                   as reported_date,
    -- 0=Open, 1=Closed, 2=Reopened
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
