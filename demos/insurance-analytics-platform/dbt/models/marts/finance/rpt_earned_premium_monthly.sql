-- CLAUDE.md's "secure views for anything client-facing" - a thin pass-through, not a
-- rework of the mart's logic. Row access enforcement doesn't need repeating here:
-- Snowflake's row access policy is attached to the base table (fct_earned_premium_
-- monthly), and it's enforced on ANY path to that table's rows, view or no view -
-- what SECURE actually buys here is hiding the view's own definition from anyone who
-- can query it but shouldn't see how it's built, which Snowflake's docs specifically
-- recommend pairing with row access policies as defense in depth.
{{ config(materialized='view', secure=true) }}

select * from {{ ref('fct_earned_premium_monthly') }}
