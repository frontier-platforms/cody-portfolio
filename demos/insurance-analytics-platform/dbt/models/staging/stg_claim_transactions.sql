with source as (
    select * from {{ source('airbyte', 'CLAIMTRANSACTIONS') }}
)

select
    ID                             as claim_transaction_id,
    TENANTID                       as tenant_id,
    CLAIMID                        as claim_id,
    -- 0=Payment, 1=ReserveChange, 2=Recovery
    TRANSACTIONTYPE                as transaction_type,
    TRANSACTIONDATE                as transaction_date,
    AMOUNT                         as amount,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
