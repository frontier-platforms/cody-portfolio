{{ config(meta={"layer": "gold", "served_file": "flames-shots.parquet", "merge_key": "game_id"}) }}

select s.*
from {{ ref('stg_shots') }} s
semi join {{ ref('flames_games') }} g on g.game_id = s.game_id
order by s.game_id, s.period, s.period_seconds
