with hours as (
    select
        month,
        cast(sum(service_hours) as bigint) as service_hours,
        cast(sum(service_hours) filter (where mode = 'Bus') as bigint) as bus_service_hours,
        cast(sum(service_hours) filter (where mode = 'CTrain') as bigint) as ctrain_service_hours,
        cast(sum(service_hours) filter (where mode = 'Community shuttle') as bigint) as shuttle_service_hours
    from {{ ref('fct_service_hours_monthly') }}
    group by month
),

requests as (
    select
        request_month as month,
        count(*) as customer_requests_311,
        count(*) filter (where comparable_across_years) as rider_feedback_311
    from {{ ref('fct_service_requests') }}
    where department = 'Calgary Transit' and not is_internal
    group by request_month
)

select
    d.month,
    d.year,
    d.quarter,
    d.month_name,
    r.trips,
    r.boardings,
    r.bus_boardings,
    r.ctrain_boardings,
    round(r.boardings / nullif(r.trips, 0), 2) as boardings_per_trip,
    h.service_hours,
    h.bus_service_hours,
    h.ctrain_service_hours,
    h.shuttle_service_hours,
    round(r.trips / nullif(h.service_hours, 0), 1) as trips_per_service_hour,
    coalesce(q.customer_requests_311, 0) as customer_requests_311,
    round(q.customer_requests_311 * 100000.0 / nullif(r.trips, 0), 1) as requests_per_100k_trips,
    coalesce(q.rider_feedback_311, 0) as rider_feedback_311,
    round(q.rider_feedback_311 * 100000.0 / nullif(r.trips, 0), 1) as rider_feedback_per_100k_trips,
    r.trips is not null as has_ridership_data
from {{ ref('dim_month') }} d
left join {{ ref('fct_ridership_monthly') }} r on r.month = d.month
left join hours h on h.month = d.month
left join requests q on q.month = d.month
-- 2012 is the first year all three sources overlap; 311 transit records before then are near-empty.
where d.month >= date '2012-01-01'
