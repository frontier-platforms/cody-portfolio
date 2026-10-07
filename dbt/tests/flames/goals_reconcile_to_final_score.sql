{{ config(meta={
    "label": "Shot-level goals reconcile to the final score",
    "description": "Counts goal events per game and compares them to the official score, allowing for the extra goal a shootout winner is credited."
}) }}

-- Returns games whose shot-level goals don't match the official score.
with shot_goals as (
    select game_id,
           count(*) filter (where is_goal and team = 'CGY') as gf,
           count(*) filter (where is_goal and team = 'OPP') as ga
    from {{ ref('flames_shots') }}
    group by 1
)

select g.game_id
from {{ ref('flames_games') }} g
left join shot_goals s using (game_id)
where g.goals_for - (g.decided_in = 'SO' and g.result = 'W')::integer <> coalesce(s.gf, 0)
   or g.goals_against - (g.decided_in = 'SO' and g.result <> 'W')::integer <> coalesce(s.ga, 0)
