with source as (
    select * from {{ source('airbyte', 'PROGRAMS') }}
)

select
    ID                             as program_id,
    TENANTID                       as tenant_id,
    NAME                           as name,
    -- Plain int enum, same as the Postgres source - 0=GeneralLiability,
    -- 1=CommercialProperty, 2=Cyber. Decoded to text in the marts layer, not here.
    LINEOFBUSINESS                 as line_of_business,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
