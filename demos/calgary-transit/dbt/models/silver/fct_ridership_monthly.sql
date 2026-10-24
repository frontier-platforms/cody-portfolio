-- One row per month that has published ridership. Placeholder months (date only, no values) are dropped.
-- trips counts a journey once; boardings counts every vehicle boarded, so a transfer is two boardings.
select
    cast(strptime(record->>'date', '%Y/%m') as date) as month,
    cast(record->>'ridership' as bigint) as trips,
    try_cast(record->>'boarding_passengers' as bigint) as boardings,
    try_cast(record->>'bus_boarding_passengers' as bigint) as bus_boardings,
    try_cast(record->>'ctrain_boarding_passengers' as bigint) as ctrain_boardings
from {{ source('bronze', 'ridership_monthly') }}
where record->>'ridership' is not null
