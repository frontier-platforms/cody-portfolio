{{ config(meta={"layer": "metrics"}) }}

-- Headline findings for the lab header. Formatting happens at publish time.
with last as (select year(max(issued_date)) - 1 as yr from {{ ref('permits') }}),
last_applied as (select year(max(applied_date)) - 1 as yr from {{ ref('permits') }})

select 1 as sort, 'New homes permitted' as label, 'count' as format,
       sum(housing_units)::double as value_number, null::varchar as value_text,
       'in ' || (select yr from last) as detail
from {{ ref('permits') }}
where work_group = 'New' and year(issued_date) = (select yr from last)

union all

select 2, 'Of new homes were apartments', 'percent',
       sum(housing_units) filter (where class_group = 'Apartment') / sum(housing_units), null,
       'by units permitted in ' || (select yr from last)
from {{ ref('permits') }}
where work_group = 'New' and year(issued_date) = (select yr from last)

union all

select 3, 'Median wait for a new-home permit', 'text',
       null, cast(round(median(issued_date - applied_date)) as integer) || ' days',
       'applications in ' || (select yr from last_applied)
from {{ ref('permits') }}
where work_group = 'New' and permit_class = 'Residential' and issued_date is not null
  and year(applied_date) = (select yr from last_applied)
