{{ config(meta={"layer": "metrics"}) }}

select 1 as sort, 'Median detached home' as label, 'money' as format,
       median(assessed_value)::double as value_number, null::varchar as value_text, '2026 assessment' as detail
from {{ ref('housing_homes') }} where property_group = 'Detached'

union all

select 2, 'Homes assessed at $1M or more', 'percent',
       avg((assessed_value >= 1000000)::integer), null, 'of all homes'
from {{ ref('housing_homes') }}

union all

select * from (
    select 3, 'Highest-value community', 'text', null, community, 'by median detached value'
    from {{ ref('housing_homes') }}
    where property_group = 'Detached' and community not like 'RESIDUAL%'
    group by community having count(*) >= 50
    order by median(assessed_value) desc limit 1
)
