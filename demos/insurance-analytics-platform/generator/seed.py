"""Initial-load synthetic data generator.

Seeds ~5,000 policies across 3 tenants and 2-3 lines of business into the
EF-style schema from source_db/0001_InitialCreate.sql. Deterministic: the
same SEED always produces the same data, so re-running against a fresh
database reproduces identical results.

Run with: uv run python -m generator.seed
"""

import random
from datetime import date, datetime, timedelta, timezone

from faker import Faker

from generator.db import get_connection

SEED = 42
NUM_TENANTS = 3
CARRIERS_PER_TENANT = 4
BROKERS_PER_TENANT = 10
INSUREDS_PER_TENANT = 1800  # ~5,400 insureds total, enough for ~5,000 policies with some overlap

rng = random.Random(SEED)
fake = Faker()
fake.seed_instance(SEED)


def now() -> datetime:
    return datetime.now(timezone.utc)


def insert_tenants(cur) -> list[int]:
    names = ["Northbridge MGA", "Harborview Underwriters", "Cascade Risk Partners"][:NUM_TENANTS]
    ids = []
    for name in names:
        ts = now()
        cur.execute(
            """
            INSERT INTO "Tenants" ("Name", "CreatedAt", "UpdatedAt")
            VALUES (%s, %s, %s) RETURNING "Id"
            """,
            (name, ts, ts),
        )
        ids.append(cur.fetchone()[0])
    return ids


def insert_carriers(cur, tenant_ids: list[int]) -> dict[int, list[int]]:
    """Returns {tenant_id: [carrier_id, ...]}."""
    by_tenant: dict[int, list[int]] = {}
    for tenant_id in tenant_ids:
        carrier_ids = []
        for _ in range(CARRIERS_PER_TENANT):
            ts = now()
            name = f"{fake.company()} Insurance"
            cur.execute(
                """
                INSERT INTO "Carriers" ("TenantId", "Name", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s) RETURNING "Id"
                """,
                (tenant_id, name, ts, ts),
            )
            carrier_ids.append(cur.fetchone()[0])
        by_tenant[tenant_id] = carrier_ids
    return by_tenant


def insert_brokers(cur, tenant_ids: list[int]) -> dict[int, list[int]]:
    by_tenant: dict[int, list[int]] = {}
    for tenant_id in tenant_ids:
        broker_ids = []
        for _ in range(BROKERS_PER_TENANT):
            ts = now()
            name = f"{fake.last_name()} Insurance Brokers"
            license_number = f"BRK-{rng.randint(100000, 999999)}"
            cur.execute(
                """
                INSERT INTO "Brokers" ("TenantId", "Name", "LicenseNumber", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s) RETURNING "Id"
                """,
                (tenant_id, name, license_number, ts, ts),
            )
            broker_ids.append(cur.fetchone()[0])
        by_tenant[tenant_id] = broker_ids
    return by_tenant


def insert_insureds(conn, tenant_ids: list[int]) -> dict[int, list[int]]:
    by_tenant: dict[int, list[int]] = {}
    total_done = 0
    for tenant_id in tenant_ids:
        insured_ids = []
        with conn.cursor() as cur:
            for i in range(INSUREDS_PER_TENANT):
                ts = now()
                first = fake.first_name()
                last = fake.last_name()
                email = fake.unique.email()
                dob = fake.date_of_birth(minimum_age=18, maximum_age=85)
                cur.execute(
                    """
                    INSERT INTO "Insureds"
                        ("TenantId", "FirstName", "LastName", "Email", "DateOfBirth",
                         "AddressLine1", "AddressLine2", "City", "Province", "PostalCode",
                         "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING "Id"
                    """,
                    (
                        tenant_id, first, last, email, dob,
                        fake.street_address(), None, fake.city(),
                        rng.choice(["ON", "BC", "AB", "QC", "NS"]),
                        fake.postcode(),
                        ts, ts,
                    ),
                )
                insured_ids.append(cur.fetchone()[0])
                total_done += 1

                # Commit periodically: a long row-by-row loop over a WAN connection is
                # slow enough to interrupt, and committing only once at the very end
                # means an interruption anywhere loses the entire run, not just the tail.
                if total_done % 500 == 0:
                    conn.commit()
                    print(f"  ...{total_done} insureds so far")
        by_tenant[tenant_id] = insured_ids
    conn.commit()
    return by_tenant


LINES_OF_BUSINESS = [0, 1, 2]  # 0=GeneralLiability, 1=CommercialProperty, 2=Cyber
LOB_NAMES = {0: "General Liability", 1: "Commercial Property", 2: "Cyber"}


def insert_programs(cur, tenant_ids: list[int]) -> dict[int, list[tuple[int, int]]]:
    """Returns {tenant_id: [(program_id, line_of_business), ...]}."""
    by_tenant: dict[int, list[tuple[int, int]]] = {}
    for tenant_id in tenant_ids:
        programs = []
        for lob in LINES_OF_BUSINESS:
            ts = now()
            name = f"{LOB_NAMES[lob]} Program"
            cur.execute(
                """
                INSERT INTO "Programs" ("TenantId", "Name", "LineOfBusiness", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s) RETURNING "Id"
                """,
                (tenant_id, name, lob, ts, ts),
            )
            programs.append((cur.fetchone()[0], lob))
        by_tenant[tenant_id] = programs
    return by_tenant


def insert_program_carrier_shares(
    cur, programs_by_tenant: dict[int, list[tuple[int, int]]], carriers_by_tenant: dict[int, list[int]]
) -> None:
    for tenant_id, programs in programs_by_tenant.items():
        for program_id, _lob in programs:
            carrier_a, carrier_b = rng.sample(carriers_by_tenant[tenant_id], 2)
            primary_share = rng.choice([55, 60, 65, 70, 75])
            for carrier_id, share in ((carrier_a, primary_share), (carrier_b, 100 - primary_share)):
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "ProgramCarrierShares"
                        ("TenantId", "ProgramId", "CarrierId", "SharePercentage", "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (tenant_id, program_id, carrier_id, share, ts, ts),
                )


NUM_POLICIES = 5000

# Fixed reference point for historical business dates, deliberately NOT datetime.now() -
# the spec requires this generator to be deterministic given a seed, and a date computed
# as "today minus N random days" would silently change every day the script is run.
AS_OF = date(2026, 11, 19)

COVERAGE_BY_LOB = {0: 0, 1: 1, 2: 2}  # Program.LineOfBusiness -> primary PolicyCoverages.CoverageType
EXTRA_COVERAGE_TYPES = [3, 4]  # 3=Umbrella, 4=Excess
EXTRA_COVERAGE_CHANCE = 0.2

STATUS_CHOICES = [0, 1, 2, 3]  # Active, Cancelled, Expired, NonRenewed
STATUS_WEIGHTS = [0.85, 0.07, 0.06, 0.02]


def insert_policies_and_coverages(
    conn,
    tenant_ids: list[int],
    programs_by_tenant: dict[int, list[tuple[int, int]]],
    brokers_by_tenant: dict[int, list[int]],
    insureds_by_tenant: dict[int, list[int]],
) -> dict[int, list[int]]:
    """Returns {tenant_id: [policy_id, ...]}. Also inserts PolicyCoverages per policy."""
    policy_ids_by_tenant: dict[int, list[int]] = {t: [] for t in tenant_ids}
    policies_per_tenant = NUM_POLICIES // len(tenant_ids)
    seq = 0

    for tenant_id in tenant_ids:
        programs = programs_by_tenant[tenant_id]
        brokers = brokers_by_tenant[tenant_id]
        insureds = insureds_by_tenant[tenant_id]

        with conn.cursor() as cur:
            for i in range(policies_per_tenant):
                seq += 1
                program_id, lob = rng.choice(programs)
                broker_id = rng.choice(brokers)
                insured_id = rng.choice(insureds)  # with replacement: some insureds hold multiple policies
                policy_number = f"POL-{seq:07d}"

                effective_date = AS_OF - timedelta(days=rng.randint(0, 730))
                expiration_date = effective_date + timedelta(days=365)
                status = rng.choices(STATUS_CHOICES, weights=STATUS_WEIGHTS, k=1)[0]

                ts = now()
                cur.execute(
                    """
                    INSERT INTO "Policies"
                        ("TenantId", "ProgramId", "BrokerId", "InsuredId", "PolicyNumber",
                         "EffectiveDate", "ExpirationDate", "Status", "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING "Id"
                    """,
                    (
                        tenant_id, program_id, broker_id, insured_id, policy_number,
                        effective_date, expiration_date, status, ts, ts,
                    ),
                )
                policy_id = cur.fetchone()[0]
                policy_ids_by_tenant[tenant_id].append(policy_id)

                coverage_types = [COVERAGE_BY_LOB[lob]]
                if rng.random() < EXTRA_COVERAGE_CHANCE:
                    coverage_types.append(rng.choice(EXTRA_COVERAGE_TYPES))

                for coverage_type in coverage_types:
                    limit = rng.choice([1_000_000, 2_000_000, 5_000_000])
                    deductible = rng.choice([1_000, 2_500, 5_000, 10_000])
                    premium = round(rng.uniform(800, 15_000), 2)
                    ts = now()
                    cur.execute(
                        """
                        INSERT INTO "PolicyCoverages"
                            ("TenantId", "PolicyId", "CoverageType", "Limit", "Deductible", "Premium",
                             "CreatedAt", "UpdatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (tenant_id, policy_id, coverage_type, limit, deductible, premium, ts, ts),
                    )

                if seq % 500 == 0:
                    conn.commit()
                    print(f"  ...{seq} policies so far")

        conn.commit()
    return policy_ids_by_tenant


CLAIM_CHANCE = 0.15
CLAIM_STATUS_RECENT = [0, 2]  # Open, Reopened
CLAIM_STATUS_RECENT_WEIGHTS = [0.9, 0.1]
CLAIM_STATUS_OLD = [0, 1, 2]  # Open, Closed, Reopened
CLAIM_STATUS_OLD_WEIGHTS = [0.05, 0.85, 0.10]


def fetch_policy_coverages(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pc."TenantId", pc."PolicyId", pc."Id", pc."Premium", p."EffectiveDate"
            FROM "PolicyCoverages" pc
            JOIN "Policies" p ON p."Id" = pc."PolicyId"
            """
        )
        cols = ["TenantId", "PolicyId", "PolicyCoverageId", "Premium", "EffectiveDate"]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def fetch_policies(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute('SELECT "Id", "TenantId", "EffectiveDate", "ExpirationDate" FROM "Policies"')
        cols = ["PolicyId", "TenantId", "EffectiveDate", "ExpirationDate"]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def insert_policy_transactions(conn) -> int:
    coverages = fetch_policy_coverages(conn)
    with conn.cursor() as cur:
        for i, cov in enumerate(coverages, start=1):
            ts = now()
            processed_date = cov["EffectiveDate"] + timedelta(days=rng.randint(0, 5))
            cur.execute(
                """
                INSERT INTO "PolicyTransactions"
                    ("TenantId", "PolicyId", "PolicyCoverageId", "TransactionType",
                     "EffectiveDate", "ProcessedDate", "PremiumChange", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    cov["TenantId"], cov["PolicyId"], cov["PolicyCoverageId"], 0,  # 0=NewBusiness
                    cov["EffectiveDate"], processed_date, cov["Premium"], ts, ts,
                ),
            )
            if i % 1000 == 0:
                conn.commit()
                print(f"  ...{i} policy transactions so far")
    conn.commit()
    return len(coverages)


def insert_claims(conn) -> int:
    policies = fetch_policies(conn)
    claim_seq = 0
    with conn.cursor() as cur:
        for policy in policies:
            if rng.random() >= CLAIM_CHANCE:
                continue
            claim_seq += 1

            loss_window_end = min(policy["ExpirationDate"], AS_OF)
            window_days = max((loss_window_end - policy["EffectiveDate"]).days, 0)
            date_of_loss = policy["EffectiveDate"] + timedelta(days=rng.randint(0, window_days))
            reported_date = date_of_loss + timedelta(days=rng.randint(0, 14))
            days_since_report = (AS_OF - reported_date).days

            if days_since_report > 90:
                status = rng.choices(CLAIM_STATUS_OLD, weights=CLAIM_STATUS_OLD_WEIGHTS, k=1)[0]
            else:
                status = rng.choices(CLAIM_STATUS_RECENT, weights=CLAIM_STATUS_RECENT_WEIGHTS, k=1)[0]

            ts = now()
            cur.execute(
                """
                INSERT INTO "Claims"
                    ("TenantId", "PolicyId", "ClaimNumber", "DateOfLoss", "ReportedDate", "Status",
                     "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING "Id"
                """,
                (
                    policy["TenantId"], policy["PolicyId"], f"CLM-{claim_seq:07d}",
                    date_of_loss, reported_date, status, ts, ts,
                ),
            )
            claim_id = cur.fetchone()[0]

            # 1=ReserveChange: every claim gets an initial reserve set up.
            reserve_amount = round(rng.uniform(2_000, 75_000), 2)
            ts = now()
            cur.execute(
                """
                INSERT INTO "ClaimTransactions"
                    ("TenantId", "ClaimId", "TransactionType", "TransactionDate", "Amount", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (policy["TenantId"], claim_id, 1, reported_date, reserve_amount, ts, ts),
            )

            if status == 1:  # Closed claims get a payment, usually less than the reserve
                payment_amount = round(reserve_amount * rng.uniform(0.6, 1.0), 2)
                payment_date = reported_date + timedelta(days=rng.randint(10, 60))
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "ClaimTransactions"
                        ("TenantId", "ClaimId", "TransactionType", "TransactionDate", "Amount",
                         "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (policy["TenantId"], claim_id, 0, payment_date, payment_amount, ts, ts),  # 0=Payment
                )

                if rng.random() < 0.1:  # occasional subrogation/salvage recovery
                    recovery_amount = round(payment_amount * rng.uniform(0.1, 0.4), 2)
                    recovery_date = payment_date + timedelta(days=rng.randint(5, 30))
                    ts = now()
                    cur.execute(
                        """
                        INSERT INTO "ClaimTransactions"
                            ("TenantId", "ClaimId", "TransactionType", "TransactionDate", "Amount",
                             "CreatedAt", "UpdatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (policy["TenantId"], claim_id, 2, recovery_date, recovery_amount, ts, ts),  # 2=Recovery
                    )

            if claim_seq % 200 == 0:
                conn.commit()
                print(f"  ...{claim_seq} claims so far")
    conn.commit()
    return claim_seq


def main() -> None:
    fake.unique.clear()
    with get_connection() as conn:
        with conn.cursor() as cur:
            tenant_ids = insert_tenants(cur)
        conn.commit()
        print(f"Tenants: {len(tenant_ids)}")

        with conn.cursor() as cur:
            carriers_by_tenant = insert_carriers(cur, tenant_ids)
        conn.commit()
        print(f"Carriers: {sum(len(v) for v in carriers_by_tenant.values())}")

        with conn.cursor() as cur:
            brokers_by_tenant = insert_brokers(cur, tenant_ids)
        conn.commit()
        print(f"Brokers: {sum(len(v) for v in brokers_by_tenant.values())}")

        insureds_by_tenant = insert_insureds(conn, tenant_ids)
        print(f"Insureds: {sum(len(v) for v in insureds_by_tenant.values())}")

        with conn.cursor() as cur:
            programs_by_tenant = insert_programs(cur, tenant_ids)
        conn.commit()
        print(f"Programs: {sum(len(v) for v in programs_by_tenant.values())}")

        with conn.cursor() as cur:
            insert_program_carrier_shares(cur, programs_by_tenant, carriers_by_tenant)
        conn.commit()
        print("ProgramCarrierShares: done")

        policy_ids_by_tenant = insert_policies_and_coverages(
            conn, tenant_ids, programs_by_tenant, brokers_by_tenant, insureds_by_tenant
        )
        print(f"Policies: {sum(len(v) for v in policy_ids_by_tenant.values())}")

        num_policy_transactions = insert_policy_transactions(conn)
        print(f"PolicyTransactions: {num_policy_transactions}")

        num_claims = insert_claims(conn)
        print(f"Claims: {num_claims}")


if __name__ == "__main__":
    main()
