-- One row per month x rider group x fare product.
-- The published categories never add up to the published total, so the gap is carried as explicit
-- "not broken out" / "unallocated" rows. Summing trips for a month always equals the official total.
with months as (
    select cast(strptime(record->>'date', '%Y/%m') as date) as month, record
    from {{ source('bronze', 'ridership_monthly') }}
    where record->>'ridership' is not null
),

values_long as (
    select
        m.month,
        p.rider_group,
        p.fare_product,
        p.level,
        try_cast(m.record->>p.source_column as bigint) as trips
    from months m
    cross join {{ ref('fare_product_map') }} p
),

products as (
    select month, rider_group, fare_product, trips
    from values_long
    where level = 'product' and trips is not null
),

group_gaps as (
    select
        g.month,
        g.rider_group,
        'Not broken out by product' as fare_product,
        g.trips - coalesce(sum(p.trips), 0) as trips
    from values_long g
    left join products p on p.month = g.month and p.rider_group = g.rider_group
    where g.level = 'group_total' and g.trips is not null
    group by g.month, g.rider_group, g.trips
),

group_totals as (
    select month, rider_group, sum(trips) as trips
    from (
        select month, rider_group, trips from products
        union all
        select month, rider_group, trips from group_gaps
    )
    group by month, rider_group
),

system_gap as (
    select
        s.month,
        'Unallocated' as rider_group,
        'Not attributed to a rider group' as fare_product,
        s.trips - coalesce(sum(g.trips), 0) as trips
    from values_long s
    left join group_totals g on g.month = s.month
    where s.level = 'system_total'
    group by s.month, s.trips
)

select month, rider_group, fare_product, cast(trips as bigint) as trips, is_unallocated
from (
    select month, rider_group, fare_product, trips, false as is_unallocated from products
    union all
    select month, rider_group, fare_product, trips, true from group_gaps where trips <> 0
    union all
    select month, rider_group, fare_product, trips, true from system_gap where trips <> 0
)
