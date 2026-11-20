"""Daily change simulator.

Represents one real day of business activity against the already-seeded
database: new business, renewals, endorsements (some backdated), cancellations,
new claims, activity on existing claims, and an occasional hard delete (to test
that CDC catches deletes, not just inserts/updates).

Unlike seed.py, this is deliberately tied to the REAL current date, not a fixed
reference point - it's meant to be run once per actual day, so "today" should
mean today.

Run with: uv run python -m generator.daily
"""

from datetime import date, timedelta

from generator.db import get_connection
from generator.seed import (
    COVERAGE_BY_LOB,
    EXTRA_COVERAGE_TYPES,
    fake,
    now,
    rng,
)

TODAY = date.today()

NEW_POLICIES_PER_DAY = 10
RENEWAL_WINDOW_DAYS = 30
ENDORSEMENT_COUNT = 15
BACKDATED_ENDORSEMENT_CHANCE = 0.3
CANCELLATION_COUNT = 5
NEW_CLAIMS_COUNT = 10
CLAIM_ACTIVITY_COUNT = 20
HARD_DELETE_CHANCE = 0.3


def fetch_active_policies(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT p."Id", p."TenantId", p."ProgramId", p."BrokerId", p."InsuredId",
                   p."EffectiveDate", p."ExpirationDate", pr."LineOfBusiness"
            FROM "Policies" p
            JOIN "Programs" pr ON pr."Id" = p."ProgramId"
            WHERE p."Status" = 0
            """
        )
        cols = ["PolicyId", "TenantId", "ProgramId", "BrokerId", "InsuredId",
                "EffectiveDate", "ExpirationDate", "LineOfBusiness"]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def fetch_policy_coverages(conn, policy_ids: list[int]) -> list[dict]:
    if not policy_ids:
        return []
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT "Id", "TenantId", "PolicyId", "Premium"
            FROM "PolicyCoverages"
            WHERE "PolicyId" = ANY(%s)
            """,
            (policy_ids,),
        )
        cols = ["PolicyCoverageId", "TenantId", "PolicyId", "Premium"]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def fetch_open_claims(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute('SELECT "Id", "TenantId" FROM "Claims" WHERE "Status" IN (0, 2)')
        return [{"ClaimId": row[0], "TenantId": row[1]} for row in cur.fetchall()]


def insert_new_business(conn, active_policies: list[dict]) -> int:
    """Writes a handful of brand-new policies, same shape as seed.py's initial load."""
    tenant_ids = sorted({p["TenantId"] for p in active_policies})
    with conn.cursor() as cur:
        cur.execute('SELECT MAX(CAST(SUBSTRING("PolicyNumber" FROM 5) AS INTEGER)) FROM "Policies"')
        next_seq = (cur.fetchone()[0] or 0) + 1

        cur.execute(
            """
            SELECT pr."TenantId", pr."Id", pr."LineOfBusiness"
            FROM "Programs" pr
            """
        )
        programs_by_tenant: dict[int, list[tuple[int, int]]] = {}
        for tenant_id, program_id, lob in cur.fetchall():
            programs_by_tenant.setdefault(tenant_id, []).append((program_id, lob))

        cur.execute('SELECT "TenantId", "Id" FROM "Brokers"')
        brokers_by_tenant: dict[int, list[int]] = {}
        for tenant_id, broker_id in cur.fetchall():
            brokers_by_tenant.setdefault(tenant_id, []).append(broker_id)

        cur.execute('SELECT "TenantId", "Id" FROM "Insureds"')
        insureds_by_tenant: dict[int, list[int]] = {}
        for tenant_id, insured_id in cur.fetchall():
            insureds_by_tenant.setdefault(tenant_id, []).append(insured_id)

        for _ in range(NEW_POLICIES_PER_DAY):
            tenant_id = rng.choice(tenant_ids)
            program_id, lob = rng.choice(programs_by_tenant[tenant_id])
            broker_id = rng.choice(brokers_by_tenant[tenant_id])
            insured_id = rng.choice(insureds_by_tenant[tenant_id])

            effective_date = TODAY
            expiration_date = effective_date + timedelta(days=365)
            ts = now()
            cur.execute(
                """
                INSERT INTO "Policies"
                    ("TenantId", "ProgramId", "BrokerId", "InsuredId", "PolicyNumber",
                     "EffectiveDate", "ExpirationDate", "Status", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, 0, %s, %s)
                RETURNING "Id"
                """,
                (tenant_id, program_id, broker_id, insured_id, f"POL-{next_seq:07d}",
                 effective_date, expiration_date, ts, ts),
            )
            policy_id = cur.fetchone()[0]
            next_seq += 1

            coverage_types = [COVERAGE_BY_LOB[lob]]
            if rng.random() < 0.2:
                coverage_types.append(rng.choice(EXTRA_COVERAGE_TYPES))

            for coverage_type in coverage_types:
                premium = round(rng.uniform(800, 15_000), 2)
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "PolicyCoverages"
                        ("TenantId", "PolicyId", "CoverageType", "Limit", "Deductible", "Premium",
                         "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING "Id"
                    """,
                    (tenant_id, policy_id, coverage_type,
                     rng.choice([1_000_000, 2_000_000, 5_000_000]),
                     rng.choice([1_000, 2_500, 5_000, 10_000]),
                     premium, ts, ts),
                )
                coverage_id = cur.fetchone()[0]
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "PolicyTransactions"
                        ("TenantId", "PolicyId", "PolicyCoverageId", "TransactionType",
                         "EffectiveDate", "ProcessedDate", "PremiumChange", "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, 0, %s, %s, %s, %s, %s)
                    """,
                    (tenant_id, policy_id, coverage_id, effective_date, TODAY, premium, ts, ts),
                )
    conn.commit()
    return NEW_POLICIES_PER_DAY


def insert_renewals(conn, active_policies: list[dict]) -> int:
    due = [p for p in active_policies if 0 <= (p["ExpirationDate"] - TODAY).days <= RENEWAL_WINDOW_DAYS]
    with conn.cursor() as cur:
        for policy in due:
            new_expiration = policy["ExpirationDate"] + timedelta(days=365)
            cur.execute(
                'UPDATE "Policies" SET "ExpirationDate" = %s, "UpdatedAt" = %s WHERE "Id" = %s',
                (new_expiration, now(), policy["PolicyId"]),
            )
            for cov in fetch_policy_coverages(conn, [policy["PolicyId"]]):
                old_premium = cov["Premium"]
                new_premium = round(float(old_premium) * rng.uniform(0.95, 1.15), 2)
                change = round(new_premium - float(old_premium), 2)
                cur.execute(
                    'UPDATE "PolicyCoverages" SET "Premium" = %s, "UpdatedAt" = %s WHERE "Id" = %s',
                    (new_premium, now(), cov["PolicyCoverageId"]),
                )
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "PolicyTransactions"
                        ("TenantId", "PolicyId", "PolicyCoverageId", "TransactionType",
                         "EffectiveDate", "ProcessedDate", "PremiumChange", "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, 2, %s, %s, %s, %s, %s)
                    """,
                    (policy["TenantId"], policy["PolicyId"], cov["PolicyCoverageId"],
                     policy["ExpirationDate"], TODAY, change, ts, ts),
                )
    conn.commit()
    return len(due)


def insert_endorsements(conn, active_policies: list[dict]) -> int:
    sample_size = min(ENDORSEMENT_COUNT, len(active_policies))
    chosen = rng.sample(active_policies, sample_size)
    with conn.cursor() as cur:
        for policy in chosen:
            coverages = fetch_policy_coverages(conn, [policy["PolicyId"]])
            if not coverages:
                continue
            cov = rng.choice(coverages)
            old_premium = float(cov["Premium"])
            change = round(old_premium * rng.uniform(-0.2, 0.2), 2)
            new_premium = round(old_premium + change, 2)

            is_backdated = rng.random() < BACKDATED_ENDORSEMENT_CHANCE
            effective_date = TODAY - timedelta(days=rng.randint(5, 45)) if is_backdated else TODAY

            cur.execute(
                'UPDATE "PolicyCoverages" SET "Premium" = %s, "UpdatedAt" = %s WHERE "Id" = %s',
                (new_premium, now(), cov["PolicyCoverageId"]),
            )
            ts = now()
            cur.execute(
                """
                INSERT INTO "PolicyTransactions"
                    ("TenantId", "PolicyId", "PolicyCoverageId", "TransactionType",
                     "EffectiveDate", "ProcessedDate", "PremiumChange", "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, 1, %s, %s, %s, %s, %s)
                """,
                (policy["TenantId"], policy["PolicyId"], cov["PolicyCoverageId"],
                 effective_date, TODAY, change, ts, ts),
            )
    conn.commit()
    return sample_size


def insert_cancellations(conn, active_policies: list[dict]) -> int:
    sample_size = min(CANCELLATION_COUNT, len(active_policies))
    chosen = rng.sample(active_policies, sample_size)
    with conn.cursor() as cur:
        for policy in chosen:
            cur.execute(
                'UPDATE "Policies" SET "Status" = 1, "ExpirationDate" = %s, "UpdatedAt" = %s WHERE "Id" = %s',
                (TODAY, now(), policy["PolicyId"]),
            )
            remaining_days = max((policy["ExpirationDate"] - TODAY).days, 0)
            term_days = max((policy["ExpirationDate"] - policy["EffectiveDate"]).days, 1)
            unearned_fraction = remaining_days / term_days

            for cov in fetch_policy_coverages(conn, [policy["PolicyId"]]):
                refund = round(-float(cov["Premium"]) * unearned_fraction, 2)
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "PolicyTransactions"
                        ("TenantId", "PolicyId", "PolicyCoverageId", "TransactionType",
                         "EffectiveDate", "ProcessedDate", "PremiumChange", "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, %s, 3, %s, %s, %s, %s, %s)
                    """,
                    (policy["TenantId"], policy["PolicyId"], cov["PolicyCoverageId"],
                     TODAY, TODAY, refund, ts, ts),
                )
    conn.commit()
    return sample_size


def insert_new_claims(conn, active_policies: list[dict]) -> int:
    sample_size = min(NEW_CLAIMS_COUNT, len(active_policies))
    chosen = rng.sample(active_policies, sample_size)
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM "Claims"')
        next_seq = cur.fetchone()[0] + 1

        for policy in chosen:
            date_of_loss = TODAY - timedelta(days=rng.randint(0, 3))
            ts = now()
            cur.execute(
                """
                INSERT INTO "Claims"
                    ("TenantId", "PolicyId", "ClaimNumber", "DateOfLoss", "ReportedDate", "Status",
                     "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, %s, %s, %s, 0, %s, %s)
                RETURNING "Id"
                """,
                (policy["TenantId"], policy["PolicyId"], f"CLM-{next_seq:07d}",
                 date_of_loss, TODAY, ts, ts),
            )
            claim_id = cur.fetchone()[0]
            next_seq += 1

            reserve = round(rng.uniform(2_000, 75_000), 2)
            ts = now()
            cur.execute(
                """
                INSERT INTO "ClaimTransactions"
                    ("TenantId", "ClaimId", "TransactionType", "TransactionDate", "Amount",
                     "CreatedAt", "UpdatedAt")
                VALUES (%s, %s, 1, %s, %s, %s, %s)
                """,
                (policy["TenantId"], claim_id, TODAY, reserve, ts, ts),
            )
    conn.commit()
    return sample_size


def insert_claim_activity(conn, open_claims: list[dict]) -> int:
    sample_size = min(CLAIM_ACTIVITY_COUNT, len(open_claims))
    chosen = rng.sample(open_claims, sample_size)
    with conn.cursor() as cur:
        for claim in chosen:
            if rng.random() < 0.4:
                # Final payment closes the claim.
                amount = round(rng.uniform(1_000, 50_000), 2)
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "ClaimTransactions"
                        ("TenantId", "ClaimId", "TransactionType", "TransactionDate", "Amount",
                         "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, 0, %s, %s, %s, %s)
                    """,
                    (claim["TenantId"], claim["ClaimId"], TODAY, amount, ts, ts),
                )
                cur.execute(
                    'UPDATE "Claims" SET "Status" = 1, "UpdatedAt" = %s WHERE "Id" = %s',
                    (now(), claim["ClaimId"]),
                )
            else:
                # Reserve adjustment, can be positive (more expensive than thought) or
                # negative (reserve released). Both are real, both are just a signed Amount.
                amount = round(rng.uniform(-10_000, 10_000), 2)
                ts = now()
                cur.execute(
                    """
                    INSERT INTO "ClaimTransactions"
                        ("TenantId", "ClaimId", "TransactionType", "TransactionDate", "Amount",
                         "CreatedAt", "UpdatedAt")
                    VALUES (%s, %s, 1, %s, %s, %s, %s)
                    """,
                    (claim["TenantId"], claim["ClaimId"], TODAY, amount, ts, ts),
                )
    conn.commit()
    return sample_size


def maybe_hard_delete(conn) -> int:
    if rng.random() >= HARD_DELETE_CHANCE:
        return 0
    with conn.cursor() as cur:
        cur.execute('SELECT "Id" FROM "ClaimTransactions" ORDER BY random() LIMIT 1')
        row = cur.fetchone()
        if row is None:
            return 0
        cur.execute('DELETE FROM "ClaimTransactions" WHERE "Id" = %s', (row[0],))
    conn.commit()
    return 1


def main() -> None:
    fake.unique.clear()
    with get_connection() as conn:
        active_policies = fetch_active_policies(conn)
        print(f"Active policies as of today: {len(active_policies)}")

        n = insert_new_business(conn, active_policies)
        print(f"New business: {n}")

        active_policies = fetch_active_policies(conn)  # refresh: new business just changed this
        n = insert_renewals(conn, active_policies)
        print(f"Renewals: {n}")

        n = insert_endorsements(conn, active_policies)
        print(f"Endorsements: {n}")

        n = insert_cancellations(conn, active_policies)
        print(f"Cancellations: {n}")

        n = insert_new_claims(conn, active_policies)
        print(f"New claims: {n}")

        open_claims = fetch_open_claims(conn)
        n = insert_claim_activity(conn, open_claims)
        print(f"Claim activity: {n}")

        n = maybe_hard_delete(conn)
        print(f"Hard deletes: {n}")


if __name__ == "__main__":
    main()
