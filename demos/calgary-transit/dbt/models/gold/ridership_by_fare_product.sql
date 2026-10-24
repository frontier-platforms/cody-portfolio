select
    f.month,
    year(f.month) as year,
    f.rider_group,
    f.fare_product,
    f.is_unallocated,
    f.trips,
    round(f.trips * 100.0 / nullif(t.trips, 0), 2) as pct_of_month_trips
from {{ ref('fct_ridership_by_fare_product') }} f
join {{ ref('fct_ridership_monthly') }} t on t.month = f.month
