-- Schedules the two procedures as a two-task DAG: the bordereau only rebuilds after
-- the earned premium table has successfully rebuilt (matching the project's actual
-- pattern of "downstream exports only run after a successful upstream build").
--
-- Reuses LOAD_WH (Airbyte's warehouse) rather than creating a dedicated one - these are
-- tiny queries against a few thousand rows, not worth a second XSMALL warehouse's worth
-- of cost-guardrail bookkeeping for a practice project.
CREATE OR REPLACE TASK LEGACY.PUBLIC.TASK_BUILD_EARNED_PREMIUM
    WAREHOUSE = LOAD_WH
    SCHEDULE = 'USING CRON 0 6 * * * America/Edmonton' -- adjust the timezone if you're not on Mountain time
AS
    CALL LEGACY.PUBLIC.SP_BUILD_EARNED_PREMIUM();

CREATE OR REPLACE TASK LEGACY.PUBLIC.TASK_BUILD_PREMIUM_BORDEREAU
    WAREHOUSE = LOAD_WH
    AFTER LEGACY.PUBLIC.TASK_BUILD_EARNED_PREMIUM
AS
    CALL LEGACY.PUBLIC.SP_BUILD_PREMIUM_BORDEREAU();

-- Tasks are created SUSPENDED by default - nothing runs until resumed. Snowflake's own
-- docs are explicit that child tasks must be resumed BEFORE the root task: resuming the
-- root validates the rest of the graph isn't suspended, so doing it last is required,
-- not just tidy.
ALTER TASK LEGACY.PUBLIC.TASK_BUILD_PREMIUM_BORDEREAU RESUME;
ALTER TASK LEGACY.PUBLIC.TASK_BUILD_EARNED_PREMIUM RESUME;

-- Done criteria check: confirms both tasks are live and shows their next scheduled run.
SHOW TASKS IN SCHEMA LEGACY.PUBLIC;
