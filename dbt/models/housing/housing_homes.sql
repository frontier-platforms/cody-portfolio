{{ config(meta={"layer": "gold", "served_file": "housing-homes.parquet", "merge_key": "roll_number"}) }}

select roll_number, roll_year, community, use, property_group, zoning, year_built, lot_sqft, assessed_value, mod_date
from {{ ref('stg_homes') }}
where assessed_value > 0
order by community, roll_number
