{# Fails when the newest value in `column_name` is older than `max_age_days`. #}
{% test recency(model, column_name, max_age_days) %}
select max({{ column_name }}) as latest from {{ model }}
having max({{ column_name }}) < current_date - interval {{ max_age_days }} day
{% endtest %}
