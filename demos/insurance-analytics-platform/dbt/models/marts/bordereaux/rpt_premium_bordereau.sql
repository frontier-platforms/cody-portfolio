-- Same reasoning as rpt_earned_premium_monthly.sql - a secure, thin pass-through over
-- bdx_premium, which already carries the attached row access policy.
{{ config(materialized='view', secure=true) }}

select * from {{ ref('bdx_premium') }}
