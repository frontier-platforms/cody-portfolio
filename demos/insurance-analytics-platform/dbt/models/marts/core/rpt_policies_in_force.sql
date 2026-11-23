{{ config(materialized='view', secure=true) }}

select * from {{ ref('fct_policies_in_force') }}
