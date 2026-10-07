{{ config(meta={"layer": "metrics"}) }}

with last as (
    select season from {{ ref('flames_games') }} group by 1 having count(*) >= 82 order by season desc limit 1
),
season_record as (
    select season,
           count(*) filter (where result = 'W') as w,
           count(*) filter (where result = 'L') as l,
           count(*) filter (where result = 'OTL') as otl,
           sum(points) as pts
    from {{ ref('flames_games') }}
    where season = (select season from last)
    group by 1
),
top_scorer as (
    select s.shooter, count(*) as goals
    from {{ ref('flames_shots') }} s
    join {{ ref('flames_games') }} g using (game_id)
    where s.team = 'CGY' and s.is_goal and g.season = (select season from last)
    group by 1 order by goals desc limit 1
)

select 1 as sort, 'Last full season' as label, 'text' as format, null::double as value_number,
       w || '-' || l || '-' || otl as value_text, season || ', ' || pts || ' points' as detail
from season_record

union all

select 2, 'Top goal scorer', 'text', null, shooter, goals || ' goals in ' || (select season from last)
from top_scorer

union all

select 3, 'Games reconciled to the official score', 'count', count(*)::double, null, 'every game, every season'
from {{ ref('flames_games') }}
