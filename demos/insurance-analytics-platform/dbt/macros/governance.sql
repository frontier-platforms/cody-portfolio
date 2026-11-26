{# Row access and masking-policy attachment both need reapplying after every dbt run:
   dbt's `table` materialization does CREATE OR REPLACE TABLE, which creates a brand
   new object identity each time - an ALTER-attached row access policy doesn't survive
   that. Masking works differently (see apply_pii_tags below), which is why only this
   one needs a post-hook per model; the masking side is a cheap tag reapplication, not
   a direct policy attachment. #}
{% macro apply_tenant_row_access_policy() %}
  alter table {{ this }} add row access policy GOVERNANCE.PUBLIC.TENANT_ACCESS on (tenant_id);
{% endmacro %}

{# Reapplies the PII tag to whichever columns declare `meta: {pii: '<category>'}` in
   their schema.yml - the tag value itself (the category string) is purely
   descriptive/catalog metadata; masking enforcement comes from the tag being BOUND to
   GOVERNANCE.PUBLIC.MASK_PII_TEXT/MASK_PII_DATE (set up once in Terraform), which
   applies automatically to any column carrying the tag regardless of its value. Only
   the tag ASSIGNMENT needs reapplying here - the policy binding does not, since it's a
   property of the tag object, not of this particular table. `model.columns` is
   populated from schema.yml's column-level config, available in post-hook context. #}
{% macro apply_pii_tags() %}
  {% for column_name, column in model.columns.items() %}
    {% if column.meta.pii is defined %}
alter table {{ this }} modify column {{ column_name }} set tag GOVERNANCE.PUBLIC.PII = '{{ column.meta.pii }}';
    {% endif %}
  {% endfor %}
{% endmacro %}
