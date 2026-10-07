{{ config(meta={"layer": "silver"}) }}
{% set team = var('flames_team_id') %}

with attempts as (
    select
        p.*,
        p.owner_team_id = p.home_team_id                        as shooter_is_home,
        try_cast(substr(p.situation_code, 1, 1) as integer)     as away_goalie,
        try_cast(substr(p.situation_code, 2, 1) as integer)     as away_skaters,
        try_cast(substr(p.situation_code, 3, 1) as integer)     as home_skaters,
        try_cast(substr(p.situation_code, 4, 1) as integer)     as home_goalie
    from {{ source('flames', 'raw_plays') }} p
    where p.event_type in ('goal', 'shot-on-goal', 'missed-shot', 'blocked-shot')
      and p.period_type <> 'SO'
      and p.x is not null and p.y is not null
),

sided as (
    select
        *,
        -- A team attacks the net opposite the end it defends.
        case when shooter_is_home = coalesce(home_defending_side = 'right', false) then -1 else 1 end as flip,
        case when shooter_is_home then home_skaters else away_skaters end as own_skaters,
        case when shooter_is_home then away_skaters else home_skaters end as opp_skaters,
        case when shooter_is_home then away_goalie else home_goalie end  as opp_goalie
    from attempts
)

select
    s.game_id,
    s.period,
    cast(split_part(s.time_in_period, ':', 1) as integer) * 60
        + cast(split_part(s.time_in_period, ':', 2) as integer)            as period_seconds,
    case when s.owner_team_id = {{ team }} then 'CGY' else 'OPP' end        as team,
    s.event_type                                                            as event,
    s.event_type = 'goal'                                                   as is_goal,
    s.shot_type,
    case
        when s.own_skaters is null or s.opp_goalie is null then 'other'
        when s.opp_goalie = 0 then 'EN'
        when s.own_skaters = s.opp_skaters and s.own_skaters = 5 then '5v5'
        when s.own_skaters = s.opp_skaters then 'even'
        when s.own_skaters > s.opp_skaters then 'PP'
        else 'SH'
    end                                                                     as strength,
    s.x * s.flip                                                            as x,
    s.y * s.flip                                                            as y,
    r.first_name || ' ' || r.last_name                                      as shooter
from sided s
left join {{ source('flames', 'raw_roster') }} r
    on r.game_id = s.game_id and r.player_id = s.shooter_id
