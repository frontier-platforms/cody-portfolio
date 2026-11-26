-- Schedules the deployed DBT PROJECT to build and test prod on its own cron, mirroring
-- legacy/0004_tasks.sql's pattern. This is a cron OFFSET, not a strict AFTER
-- dependency on LEGACY.PUBLIC's own tasks - Snowflake task graphs (the AFTER clause)
-- require the predecessor and successor to live in the same database and schema, and
-- this task lives in ANALYTICS_PROD.PROD, not LEGACY.PUBLIC. CLAUDE.md's own
-- orchestration notes call a cron offset a legitimate option ("a cron task timed after
-- Airbyte's sync"), not a workaround.
--
-- 7am gives a 1-hour buffer after LEGACY's own 6am rebuild (legacy/0004_tasks.sql), so
-- the parity tests that run as part of `dbt build` are comparing against a LEGACY
-- table that's also been freshly rebuilt from roughly the same RAW snapshot - the same
-- reasoning that mattered when we were debugging the parity test by hand earlier.
--
-- One task, not two like legacy's: `dbt build --target prod` already runs every
-- model AND every test (including the parity tests) in correct dependency order on
-- its own - there's no second stored procedure to chain after.
CREATE OR REPLACE TASK ANALYTICS_PROD.PROD.TASK_RUN_DBT_PROJECT
    WAREHOUSE = TRANSFORM_WH
    SCHEDULE = 'USING CRON 0 7 * * * America/Edmonton' -- adjust the timezone if you're not on Mountain time
AS
    EXECUTE DBT PROJECT ANALYTICS_PROD.PROD.insurance_analytics ARGS = 'build --target prod';

-- Tasks are created SUSPENDED by default - nothing runs until resumed.
ALTER TASK ANALYTICS_PROD.PROD.TASK_RUN_DBT_PROJECT RESUME;

-- Done criteria check: confirms the task is live and shows its next scheduled run.
SHOW TASKS IN SCHEMA ANALYTICS_PROD.PROD;
