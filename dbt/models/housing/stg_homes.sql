{{ config(meta={"layer": "silver"}) }}

-- Homes only: no parking stalls, storage units, vacant land or whole rental buildings.
select
    try_cast(a.roll_number as bigint)                               as roll_number,
    try_cast(a.roll_year as integer)                                as roll_year,
    a.comm_name                                                     as community,
    a.sub_property_use                                              as use_code,
    u.description                                                   as use,
    case a.sub_property_use
        when 'R110' then 'Detached' when 'R111' then 'Detached'
        when 'R120' then 'Duplex'
        when 'R401' then 'Townhouse' when 'R402' then 'Townhouse'
        when 'R201' then 'Condo apartment' when 'R301' then 'Condo apartment'
    end                                                             as property_group,
    nullif(trim(split_part(a.land_use_designation, ',', 1)), '')    as zoning,
    -- The City records 1800 when the build year is unknown.
    nullif(try_cast(try_cast(a.year_of_construction as double) as integer), 1800) as year_built,
    try_cast(try_cast(a.land_size_sf as double) as integer)         as lot_sqft,
    try_cast(try_cast(a.assessed_value as double) as integer)       as assessed_value,
    cast(try_cast(a.mod_date as timestamp) as date)                 as mod_date
from {{ source('housing', 'raw_assessments') }} a
left join {{ source('housing', 'raw_use_codes') }} u on u.code = a.sub_property_use
qualify row_number() over (partition by a.roll_number order by a.mod_date desc) = 1
