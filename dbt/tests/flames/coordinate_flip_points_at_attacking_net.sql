{{ config(severity="warn", meta={
    "label": "Coordinate flip points shots at the attacking net",
    "description": "At least 95% of unblocked attempts should land in the attacking half. If the API changes its side convention, this catches it."
}) }}

select avg((x > 0)::integer) as share_in_attacking_half
from {{ ref('flames_shots') }}
where event <> 'blocked-shot'
having avg((x > 0)::integer) < 0.95
