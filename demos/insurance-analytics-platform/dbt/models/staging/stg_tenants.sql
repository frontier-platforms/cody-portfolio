-- Every staging model follows this same shape: dedupe to the latest row per key
-- with QUALIFY (a Snowflake-only clause - it lets a window function filter rows
-- without wrapping the query in a subquery, which Postgres has no equivalent for),
-- ordered by _AB_CDC_LSN (the CDC log sequence number - the true "latest" ordering,
-- since timestamps can collide or be backdated but the log position never can).
-- _AB_CDC_DELETED_AT becomes a boolean flag here, not a filter - whether to exclude
-- deleted rows is a decision for intermediate/marts models, not staging.
with source as (
    select * from {{ source('airbyte', 'TENANTS') }}
)

select
    ID                             as tenant_id,
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
