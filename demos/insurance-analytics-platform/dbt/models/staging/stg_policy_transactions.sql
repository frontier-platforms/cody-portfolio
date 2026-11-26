with source as (
    select * from {{ source('airbyte', 'POLICYTRANSACTIONS') }}
)

select
    ID                             as policy_transaction_id,
    TENANTID                       as tenant_id,
    POLICYID                       as policy_id,
    POLICYCOVERAGEID               as policy_coverage_id,
    -- 0=NewBusiness, 1=Endorsement, 2=Renewal, 3=Cancellation, 4=Reinstatement
    TRANSACTIONTYPE                as transaction_type,
    EFFECTIVEDATE                  as effective_date,
    PROCESSEDDATE                  as processed_date,
    PREMIUMCHANGE                  as premium_change,
    _AB_CDC_DELETED_AT is not null as is_deleted,
    CREATEDAT                      as created_at,
    UPDATEDAT                      as updated_at,
    _AIRBYTE_EXTRACTED_AT          as _loaded_at
from source
qualify row_number() over (
    partition by ID
    order by _AB_CDC_LSN desc
) = 1
