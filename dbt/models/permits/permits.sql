{{ config(meta={"layer": "gold", "served_file": "permits.parquet", "merge_key": "permit_id"}) }}

select *
from {{ ref('stg_permits') }}
where applied_date >= date '2015-01-01'
order by applied_date, permit_id
