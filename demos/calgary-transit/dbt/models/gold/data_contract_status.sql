with latest_data as (
    select 'ridership_monthly' as source_table, max(month) as latest_data_date
    from {{ ref('fct_ridership_monthly') }}
    union all
    select 'service_hours_monthly', max(month) from {{ ref('fct_service_hours_monthly') }}
    union all
    select 'service_requests_311', max(requested_date) from {{ ref('fct_service_requests') }}
),

loads as (
    select
        source_table,
        max(finished_at) as last_loaded_at,
        arg_max(load_mode, finished_at) as last_load_mode,
        arg_max(rows_loaded, finished_at) as last_rows_loaded
    from {{ source('bronze', '_load_log') }}
    group by source_table
)

select
    c.domain,
    c.source_dataset_id,
    c.data_owner,
    c.publish_cadence,
    c.incident_tier,
    c.accuracy_rule,
    c.freshness_target_days,
    d.latest_data_date,
    date_diff('day', d.latest_data_date, current_date) as days_since_latest_data,
    cast(timezone('UTC', l.last_loaded_at) as timestamp) as last_loaded_at_utc,
    l.last_load_mode,
    l.last_rows_loaded,
    case
        when date_diff('day', d.latest_data_date, current_date) <= c.freshness_target_days then 'Meeting target'
        else 'Behind target'
    end as freshness_status
from {{ ref('data_contract') }} c
left join latest_data d on d.source_table = c.source_table
left join loads l on l.source_table = c.source_table
