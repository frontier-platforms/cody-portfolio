-- Cross-joins each coverage to only the months that actually overlap its own term,
-- capped at today - mirrors the legacy procedure's coverage_months CTE exactly, down
-- to the day-count formula. The difference is how the month spine itself gets built:
-- the legacy procedure, with no package ecosystem available inside a stored
-- procedure, faked one with GENERATOR(ROWCOUNT=>1200) (100 years, just to be safely
-- longer than it'd ever need). dbt_utils.date_spine does the same job properly.
-- 2015-01-01 is a safely-early static anchor, not a computed MIN(term_start) - the
-- join below already discards every spine month before a coverage's own term_start,
-- so an anchor further back than any real policy costs nothing but a few harmless
-- unused rows.
with coverage_terms as (
    select * from {{ ref('int_policy_coverage_terms') }}
),

month_spine as (
    {{ dbt_utils.date_spine(
        datepart="month",
        start_date="cast('2015-01-01' as date)",
        end_date="dateadd('month', 1, date_trunc('month', current_date()))"
    ) }}
)

select
    ct.tenant_id,
    ct.policy_id,
    ct.policy_coverage_id,
    ms.date_month as period_month,
    ct.premium,
    greatest(
        datediff(
            'day',
            greatest(ms.date_month, ct.term_start),
            least(
                dateadd('month', 1, ms.date_month) - 1, -- last day of this month
                ct.term_end,
                current_date()
            )
        ) + 1,
        0
    ) as days_in_force_this_month,
    datediff('day', ct.term_start, ct.term_end) as total_term_days
from coverage_terms ct
inner join month_spine ms
    on ms.date_month >= date_trunc('month', ct.term_start)
    and ms.date_month <= least(ct.term_end, current_date())
