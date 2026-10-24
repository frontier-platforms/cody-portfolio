-- One row per 311 request: latest version of each request across incremental batches.
with latest as (
    select record
    from {{ source('bronze', 'service_requests_311') }}
    qualify row_number() over (
        partition by record->>'service_request_id'
        order by record->>'updated_date' desc nulls last, _loaded_at desc
    ) = 1
),

typed as (
    select
        record->>'service_request_id' as service_request_id,
        cast(record->>'requested_date' as timestamp) as requested_at,
        cast(record->>'updated_date' as timestamp) as updated_at,
        cast(record->>'closed_date' as timestamp) as closed_at,
        record->>'status_description' as status,
        record->>'source' as intake_channel,
        record->>'service_name' as service_name,
        record->>'agency_responsible' as agency_responsible,
        nullif(record->>'comm_code', '') as community_code,
        nullif(record->>'comm_name', '') as community_name,
        try_cast(record->>'latitude' as double) as latitude,
        try_cast(record->>'longitude' as double) as longitude
    from latest
)

select
    t.service_request_id,
    t.requested_at,
    cast(t.requested_at as date) as requested_date,
    cast(date_trunc('month', t.requested_at) as date) as request_month,
    t.updated_at,
    t.closed_at,
    t.status,
    t.status = 'Open' as is_open,
    case when t.closed_at is not null then date_diff('day', t.requested_at, t.closed_at) end as days_to_close,
    t.intake_channel,
    t.service_name,
    c.service_category,
    c.program,
    c.is_retired as is_retired_service_name,
    c.is_internal,
    c.comparable_across_years,
    t.agency_responsible,
    a.department,
    a.org_unit_code,
    t.community_code,
    t.community_name,
    t.latitude,
    t.longitude
from typed t
left join {{ ref('service_category_map') }} c on t.service_name = c.service_name
left join {{ ref('agency_map') }} a on t.agency_responsible = a.agency_responsible
where t.status <> 'TO BE DELETED'
