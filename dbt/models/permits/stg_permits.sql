{{ config(meta={"layer": "silver"}) }}

select
    permitnum                                              as permit_id,
    cast(cast(applieddate as timestamp) as date)           as applied_date,
    cast(try_cast(issueddate as timestamp) as date)        as issued_date,
    cast(try_cast(completeddate as timestamp) as date)     as completed_date,
    statuscurrent                                          as status,
    permittypemapped                                       as permit_type,
    permitclassmapped                                      as permit_class,
    permitclassgroup                                       as class_group,
    workclassgroup                                         as work_group,
    coalesce(try_cast(housingunits as integer), 0)         as housing_units,
    try_cast(estprojectcost as double)                     as est_cost,
    try_cast(totalsqft as double)                          as sqft,
    communityname                                          as community,
    nullif(round(try_cast(latitude as double), 4), 0)      as lat,
    nullif(round(try_cast(longitude as double), 4), 0)     as lon,
    try_cast(source_updated_at as timestamp)               as updated_at
from {{ source('permits', 'raw_permits') }}
where permitnum is not null
qualify row_number() over (partition by permitnum order by source_updated_at desc) = 1
