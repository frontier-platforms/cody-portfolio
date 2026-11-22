with source as (
    select * from {{ source('airbyte', 'PROGRAMCARRIERSHARES') }}
)

select
    ID                             as program_carrier_share_id,
    TENANTID                       as tenant_id,
    PROGRAMID                      as program_id,
    CARRIERID                      as carrier_id,
    SHAREPERCENTAGE                as share_percentage,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
