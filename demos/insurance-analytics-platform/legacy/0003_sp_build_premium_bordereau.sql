-- Bordereau = a carrier-facing ledger of their share of premium. Unlike earned
-- premium, this is intentionally simple: one row per policy transaction per carrier,
-- no proration, no monthly bucketing - a bordereau reports what was actually written,
-- at the transaction level, by processed date. That's also why ProgramCarrierShares
-- exists in the schema at all: a program split 60/40 across two carriers means every
-- transaction on that program produces two bordereau rows, one per carrier's cut.
CREATE OR REPLACE PROCEDURE LEGACY.PUBLIC.SP_BUILD_PREMIUM_BORDEREAU()
RETURNS STRING
LANGUAGE SQL
AS
$$
BEGIN
    TRUNCATE TABLE LEGACY.PUBLIC.PREMIUM_BORDEREAU;

    INSERT INTO LEGACY.PUBLIC.PREMIUM_BORDEREAU
        (TENANT_ID, CARRIER_ID, POLICY_ID, POLICY_COVERAGE_ID, POLICY_TRANSACTION_ID,
         PROCESSED_DATE, TRANSACTION_TYPE, CARRIER_SHARE_PERCENTAGE,
         CARRIER_PREMIUM_SHARE, BUILT_AT)
    SELECT
        pt.TENANTID          AS TENANT_ID,
        pcs.CARRIERID        AS CARRIER_ID,
        pt.POLICYID          AS POLICY_ID,
        pt.POLICYCOVERAGEID  AS POLICY_COVERAGE_ID,
        pt.ID                AS POLICY_TRANSACTION_ID,
        pt.PROCESSEDDATE     AS PROCESSED_DATE,
        pt.TRANSACTIONTYPE   AS TRANSACTION_TYPE,
        pcs.SHAREPERCENTAGE  AS CARRIER_SHARE_PERCENTAGE,
        ROUND(pt.PREMIUMCHANGE * pcs.SHAREPERCENTAGE / 100, 2) AS CARRIER_PREMIUM_SHARE,
        CURRENT_TIMESTAMP()::TIMESTAMP_NTZ AS BUILT_AT
    FROM RAW.AIRBYTE.POLICYTRANSACTIONS pt
    JOIN RAW.AIRBYTE.POLICIES p
        ON p.ID = pt.POLICYID
        AND p._AB_CDC_DELETED_AT IS NULL
    JOIN RAW.AIRBYTE.PROGRAMCARRIERSHARES pcs
        ON pcs.PROGRAMID = p.PROGRAMID
        AND pcs._AB_CDC_DELETED_AT IS NULL
    WHERE pt._AB_CDC_DELETED_AT IS NULL;

    RETURN 'PREMIUM_BORDEREAU rebuilt: ' ||
        (SELECT COUNT(*) FROM LEGACY.PUBLIC.PREMIUM_BORDEREAU) || ' rows';
END;
$$;

-- Run it once by hand before the task (0004) takes over scheduling it. Run this AFTER
-- 0002's procedure has been created (no dependency at run time, just tidy ordering).
CALL LEGACY.PUBLIC.SP_BUILD_PREMIUM_BORDEREAU();
