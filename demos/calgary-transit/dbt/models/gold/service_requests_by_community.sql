select
    year(request_month) as year,
    community_code,
    community_name,
    service_category,
    count(*) as requests,
    round(avg(latitude), 5) as latitude,
    round(avg(longitude), 5) as longitude
from {{ ref('fct_service_requests') }}
where not is_internal
    and department = 'Calgary Transit'
    and community_code is not null
group by all
