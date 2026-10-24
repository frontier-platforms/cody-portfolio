{{ config(severity = 'warn') }}

-- Months where the City's published breakdown adds up to more than its own subtotal.
-- Kept as a warning: the numbers are surfaced, not hidden, and the owner is asked to confirm.
select month, rider_group, fare_product, trips
from {{ ref('ridership_by_fare_product') }}
where is_unallocated and trips < 0
