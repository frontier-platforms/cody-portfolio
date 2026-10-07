{{ config(meta={"layer": "gold", "served_file": "flames-games.parquet", "merge_key": "game_id"}) }}

select
    game_id, season, game_date, home, opponent, goals_for, goals_against,
    case when goals_for > goals_against then 'W' when decided_in = 'REG' then 'L' else 'OTL' end as result,
    decided_in,
    case when goals_for > goals_against then 2 when decided_in = 'REG' then 0 else 1 end         as points
from {{ ref('stg_games') }}
order by game_date
