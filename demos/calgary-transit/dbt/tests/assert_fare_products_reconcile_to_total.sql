-- Accuracy rule from the data contract: fare products plus unallocated rows equal published ridership.
select f.month, sum(f.trips) as fare_product_trips, any_value(t.trips) as published_trips
from {{ ref('ridership_by_fare_product') }} f
join {{ ref('fct_ridership_monthly') }} t on t.month = f.month
group by f.month
having sum(f.trips) <> any_value(t.trips)
