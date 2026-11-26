-- Created by hand in Snowsight, not Terraform - deliberately. Terraform owns
-- platform-level objects (RAW, warehouses, roles); this is where that stops and
-- "legacy" hand-run SQL begins, matching how these objects would really have been
-- created before anyone wired up IaC for this account.
--
-- Run this whole file as one Snowsight worksheet, as ACCOUNTADMIN (or SYSADMIN - either
-- already has CREATE DATABASE at the account level).

CREATE DATABASE IF NOT EXISTS LEGACY;

-- One row per policy coverage per calendar month, CUMULATIVE as of that month's end.
-- "Cumulative" (not "this month's activity") is what makes WRITTEN = EARNED + UNEARNED
-- hold true on every single row, not just in an aggregate - the actual parity test
-- Phase 4 will run against dbt's rebuild of this same table.
CREATE TABLE IF NOT EXISTS LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY (
    TENANT_ID           INTEGER       NOT NULL,
    POLICY_ID           INTEGER       NOT NULL,
    POLICY_COVERAGE_ID  INTEGER       NOT NULL,
    PERIOD_MONTH        DATE          NOT NULL, -- first day of the month
    WRITTEN_PREMIUM     NUMBER(12, 2) NOT NULL, -- cumulative, all transactions to date
    EARNED_PREMIUM      NUMBER(12, 2) NOT NULL, -- cumulative, straight-line by day in force
    UNEARNED_PREMIUM    NUMBER(12, 2) NOT NULL, -- WRITTEN_PREMIUM - EARNED_PREMIUM
    BUILT_AT            TIMESTAMP_NTZ NOT NULL,
    PRIMARY KEY (POLICY_COVERAGE_ID, PERIOD_MONTH) -- not enforced, documents intent only
);

-- One row per policy transaction PER CARRIER (a program split 60/40 across two carriers
-- produces two rows for the same transaction, one per carrier's share).
CREATE TABLE IF NOT EXISTS LEGACY.PUBLIC.PREMIUM_BORDEREAU (
    TENANT_ID                 INTEGER       NOT NULL,
    CARRIER_ID                INTEGER       NOT NULL,
    POLICY_ID                 INTEGER       NOT NULL,
    POLICY_COVERAGE_ID        INTEGER       NOT NULL,
    POLICY_TRANSACTION_ID     INTEGER       NOT NULL,
    PROCESSED_DATE             DATE          NOT NULL,
    TRANSACTION_TYPE           INTEGER       NOT NULL, -- 0=NB,1=Endorsement,2=Renewal,3=Cancellation
    CARRIER_SHARE_PERCENTAGE   NUMBER(5, 2)  NOT NULL,
    CARRIER_PREMIUM_SHARE      NUMBER(12, 2) NOT NULL, -- PremiumChange * SharePercentage / 100
    BUILT_AT                   TIMESTAMP_NTZ NOT NULL,
    PRIMARY KEY (POLICY_TRANSACTION_ID, CARRIER_ID)
);
