{{ config(materialized='view', secure=true) }}

select * from {{ ref('fct_loss_ratio_monthly') }}
