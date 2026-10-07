{{ config(meta={"layer": "silver"}) }}
{% set team = var('flames_team_id') %}

-- Finished regular-season games, re-expressed from the Flames' side of the ice.
select
    game_id,
    substr(season, 1, 4) || '-' || substr(season, 7, 2)                    as season,
    cast(game_date as date)                                                 as game_date,
    home_id = {{ team }}                                                    as home,
    case when home_id = {{ team }} then away_abbrev else home_abbrev end    as opponent,
    case when home_id = {{ team }} then home_score else away_score end      as goals_for,
    case when home_id = {{ team }} then away_score else home_score end      as goals_against,
    coalesce(last_period_type, 'REG')                                       as decided_in
from {{ source('flames', 'raw_games') }}
where game_type = 2
  and game_state in ('OFF', 'FINAL')
qualify row_number() over (partition by game_id) = 1
