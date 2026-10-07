{# Every row must satisfy `expression`. Returns the rows that don't. #}
{% test expression_is_true(model, expression) %}
select * from {{ model }} where not ({{ expression }})
{% endtest %}
