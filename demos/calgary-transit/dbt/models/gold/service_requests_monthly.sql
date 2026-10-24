select
    request_month as month,
    year(request_month) as year,
    department,
    program,
    service_category,
    comparable_across_years,
    count(*) as requests,
    count(*) filter (where is_open) as open_requests,
    count(*) filter (where not is_open) as closed_requests,
    median(days_to_close) as median_days_to_close,
    quantile_cont(days_to_close, 0.9) as p90_days_to_close,
    round(100.0 * count(*) filter (where days_to_close <= 7) / nullif(count(days_to_close), 0), 1)
        as pct_closed_within_7_days
from {{ ref('fct_service_requests') }}
where not is_internal
group by all
