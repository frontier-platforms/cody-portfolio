-- Sets up CDC (logical replication) for Airbyte's Postgres source connector.
-- Run once, after 0001_InitialCreate.sql, against the "insurance" database.
--
-- A dedicated airbyte_svc role is used instead of pgadmin (the admin user) for the
-- same reason the Snowflake side uses a separate airbyte_svc service user instead of
-- ACCOUNTADMIN: least privilege, and a clear audit trail of what Airbyte actually did.
--
-- The role's password is deliberately NOT set here - run a separate
-- `ALTER USER airbyte_svc WITH PASSWORD '...'` yourself, directly in psql, so a real
-- secret never ends up in a committed file.
CREATE USER airbyte_svc WITH LOGIN;
ALTER USER airbyte_svc REPLICATION;

GRANT USAGE ON SCHEMA public TO airbyte_svc;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO airbyte_svc;
-- So tables created later (there aren't any planned, but just in case) are
-- automatically readable too, without a follow-up grant.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO airbyte_svc;

-- REPLICA IDENTITY controls what "before" data Postgres includes in the WAL for
-- UPDATEs/DELETEs. DEFAULT (uses the primary key) is sufficient since every table
-- here has one.
ALTER TABLE "Tenants" REPLICA IDENTITY DEFAULT;
ALTER TABLE "Carriers" REPLICA IDENTITY DEFAULT;
ALTER TABLE "Programs" REPLICA IDENTITY DEFAULT;
ALTER TABLE "ProgramCarrierShares" REPLICA IDENTITY DEFAULT;
ALTER TABLE "Brokers" REPLICA IDENTITY DEFAULT;
ALTER TABLE "Insureds" REPLICA IDENTITY DEFAULT;
ALTER TABLE "Policies" REPLICA IDENTITY DEFAULT;
ALTER TABLE "PolicyCoverages" REPLICA IDENTITY DEFAULT;
ALTER TABLE "PolicyTransactions" REPLICA IDENTITY DEFAULT;
ALTER TABLE "Claims" REPLICA IDENTITY DEFAULT;
ALTER TABLE "ClaimTransactions" REPLICA IDENTITY DEFAULT;

CREATE PUBLICATION airbyte_publication FOR TABLE
    "Tenants", "Carriers", "Programs", "ProgramCarrierShares", "Brokers",
    "Insureds", "Policies", "PolicyCoverages", "PolicyTransactions",
    "Claims", "ClaimTransactions";

-- Everything above this line runs as pgadmin (via psql -f). The replication slot
-- below is NOT included in this file on purpose: Airbyte's own docs are explicit
-- that pg_create_logical_replication_slot() must be run connected AS airbyte_svc,
-- not as the admin user - run it as a separate, later step, connected as airbyte_svc:
--
--   SELECT pg_create_logical_replication_slot('airbyte_slot', 'pgoutput');
