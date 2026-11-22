-- Rebuilds LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY from scratch every run: TRUNCATE +
-- INSERT, no incremental/merge logic. That's deliberately the "old, clunky way" -
-- a nightly full rebuild is simple to write and reason about, but it means the whole
-- table is recomputed even when only a handful of rows actually changed. Phase 4's dbt
-- incremental models are the fix for that; this phase intentionally doesn't have it.
--
-- Earned premium model (see the chat for the full reasoning): each policy coverage's
-- CURRENT Premium is assumed to earn in a straight line across its whole term
-- (Policies.EFFECTIVEDATE to Policies.EXPIRATIONDATE) - even though an endorsement
-- added mid-term technically wasn't "in force" before it existed. That's a known
-- simplification, not a bug: real legacy systems often make exactly this shortcut.
--
-- Why EFFECTIVEDATE/EXPIRATIONDATE work as the earning window even after renewals or a
-- cancellation: the generator never touches EFFECTIVEDATE after the policy is created,
-- and a cancellation overwrites EXPIRATIONDATE to the actual cancellation date - so
-- these two columns always already reflect the policy's true lifetime, whatever
-- happened to it.
CREATE OR REPLACE PROCEDURE LEGACY.PUBLIC.SP_BUILD_EARNED_PREMIUM()
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    TRUNCATE TABLE LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY;

    INSERT INTO LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY
        (TENANT_ID, POLICY_ID, POLICY_COVERAGE_ID, PERIOD_MONTH,
         WRITTEN_PREMIUM, EARNED_PREMIUM, UNEARNED_PREMIUM, BUILT_AT)
    WITH policy_coverage AS (
        SELECT
            pc.ID           AS POLICY_COVERAGE_ID,
            pc.POLICYID     AS POLICY_ID,
            pc.TENANTID     AS TENANT_ID,
            pc.PREMIUM      AS PREMIUM,
            p.EFFECTIVEDATE AS TERM_START,
            p.EXPIRATIONDATE AS TERM_END
        FROM RAW.AIRBYTE.POLICYCOVERAGES pc
        JOIN RAW.AIRBYTE.POLICIES p
            ON p.ID = pc.POLICYID
            AND p._AB_CDC_DELETED_AT IS NULL
        WHERE pc._AB_CDC_DELETED_AT IS NULL
    ),
    -- 1,200 sequential months (100 years) is far more than this dataset ever needs;
    -- GENERATOR is just a cheap way to produce N rows with a row number (SEQ4()) to
    -- offset from a start date - there's no Snowflake "date spine" table function.
    month_spine AS (
        SELECT DATEADD(
            'month',
            SEQ4(),
            DATE_TRUNC('month', (SELECT MIN(TERM_START) FROM policy_coverage))
        ) AS PERIOD_MONTH
        FROM TABLE(GENERATOR(ROWCOUNT => 1200))
    ),
    -- Cross-join each coverage to only the months that actually overlap its own term,
    -- capped at today (a policy can't have earned premium for months that haven't
    -- happened yet).
    coverage_months AS (
        SELECT
            pcg.TENANT_ID,
            pcg.POLICY_ID,
            pcg.POLICY_COVERAGE_ID,
            ms.PERIOD_MONTH,
            pcg.PREMIUM,
            GREATEST(
                DATEDIFF(
                    'day',
                    GREATEST(ms.PERIOD_MONTH, pcg.TERM_START),
                    LEAST(
                        DATEADD('month', 1, ms.PERIOD_MONTH) - 1, -- last day of this month
                        pcg.TERM_END,
                        CURRENT_DATE()
                    )
                ) + 1,
                0
            ) AS DAYS_IN_FORCE_THIS_MONTH,
            DATEDIFF('day', pcg.TERM_START, pcg.TERM_END) AS TOTAL_TERM_DAYS
        FROM policy_coverage pcg
        JOIN month_spine ms
            ON ms.PERIOD_MONTH >= DATE_TRUNC('month', pcg.TERM_START)
            AND ms.PERIOD_MONTH <= LEAST(pcg.TERM_END, CURRENT_DATE())
    ),
    earned AS (
        SELECT
            TENANT_ID,
            POLICY_ID,
            POLICY_COVERAGE_ID,
            PERIOD_MONTH,
            PREMIUM * DAYS_IN_FORCE_THIS_MONTH / NULLIF(TOTAL_TERM_DAYS, 0) AS EARNED_THIS_MONTH
        FROM coverage_months
    ),
    -- Written premium is booked when a transaction is PROCESSED, not when it takes
    -- effect - standard P&C convention, and also just matches how the generator
    -- records ProcessedDate separately from (sometimes backdated) EffectiveDate.
    written AS (
        SELECT
            pt.POLICYCOVERAGEID AS POLICY_COVERAGE_ID,
            DATE_TRUNC('month', pt.PROCESSEDDATE) AS PERIOD_MONTH,
            SUM(pt.PREMIUMCHANGE) AS WRITTEN_THIS_MONTH
        FROM RAW.AIRBYTE.POLICYTRANSACTIONS pt
        WHERE pt._AB_CDC_DELETED_AT IS NULL
        GROUP BY 1, 2
    ),
    combined AS (
        SELECT
            e.TENANT_ID,
            e.POLICY_ID,
            e.POLICY_COVERAGE_ID,
            e.PERIOD_MONTH,
            e.EARNED_THIS_MONTH,
            COALESCE(w.WRITTEN_THIS_MONTH, 0) AS WRITTEN_THIS_MONTH
        FROM earned e
        LEFT JOIN written w
            ON w.POLICY_COVERAGE_ID = e.POLICY_COVERAGE_ID
            AND w.PERIOD_MONTH = e.PERIOD_MONTH
    )
    -- Cumulative (as of each month-end), not each month's own activity - this is what
    -- makes WRITTEN = EARNED + UNEARNED hold on every row, the exact parity test
    -- Phase 4's dbt rebuild of this table will be checked against.
    SELECT
        TENANT_ID,
        POLICY_ID,
        POLICY_COVERAGE_ID,
        PERIOD_MONTH,
        SUM(WRITTEN_THIS_MONTH) OVER (
            PARTITION BY POLICY_COVERAGE_ID ORDER BY PERIOD_MONTH
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS WRITTEN_PREMIUM,
        SUM(EARNED_THIS_MONTH) OVER (
            PARTITION BY POLICY_COVERAGE_ID ORDER BY PERIOD_MONTH
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS EARNED_PREMIUM,
        SUM(WRITTEN_THIS_MONTH) OVER (
            PARTITION BY POLICY_COVERAGE_ID ORDER BY PERIOD_MONTH
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) - SUM(EARNED_THIS_MONTH) OVER (
            PARTITION BY POLICY_COVERAGE_ID ORDER BY PERIOD_MONTH
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS UNEARNED_PREMIUM,
        CURRENT_TIMESTAMP()::TIMESTAMP_NTZ AS BUILT_AT
    FROM combined;

    RETURN 'EARNED_PREMIUM_MONTHLY rebuilt: ' ||
        (SELECT COUNT(*) FROM LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY) || ' rows';
END;
$$;

-- Run it once by hand to populate the table and confirm it works before the task
-- (0004) takes over scheduling it:
CALL LEGACY.PUBLIC.SP_BUILD_EARNED_PREMIUM();
