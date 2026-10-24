-- One row per month x mode.
with base as (
    select cast(strptime(record->>'date', '%Y/%m') as date) as month, record
    from {{ source('bronze', 'service_hours_monthly') }}
)

select month, mode, service_hours
from (
    select month, 'Bus' as mode, try_cast(record->>'large_bus_operating_hours' as bigint) as service_hours from base
    union all
    select month, 'CTrain', try_cast(record->>'ctrain_operating_hours' as bigint) from base
    union all
    select month, 'Community shuttle', try_cast(record->>'community_shuttle_operating_hours' as bigint) from base
)
where service_hours is not null
