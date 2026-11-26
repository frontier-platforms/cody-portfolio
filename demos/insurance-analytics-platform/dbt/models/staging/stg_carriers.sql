with source as (
    select * from {{ source('airbyte', 'CARRIERS') }}
)

select
    ID                             as carrier_id,
    TENANTID                       as tenant_id,
    NAME                           as name,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
