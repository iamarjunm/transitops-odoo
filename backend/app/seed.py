"""Seed initial users (one per role) for testing/demo.

Run from the backend/ directory:  python -m app.seed
Idempotent: existing emails are skipped.
"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole

SEED_USERS = [
    ("Admin User", "admin@transitops.com", "Admin@123", UserRole.ADMIN),
    ("Fleet Manager", "fleet@transitops.com", "Fleet@123", UserRole.FLEET_MANAGER),
    ("Dispatcher", "dispatch@transitops.com", "Dispatch@123", UserRole.DISPATCHER),
    ("Safety Officer", "safety@transitops.com", "Safety@123", UserRole.SAFETY_OFFICER),
    ("Financial Analyst", "finance@transitops.com", "Finance@123", UserRole.FINANCIAL_ANALYST),
]


def run() -> None:
    db = SessionLocal()
    created, skipped = 0, 0
    try:
        for full_name, email, password, role in SEED_USERS:
            exists = db.query(User).filter(User.email == email).first()
            if exists:
                skipped += 1
                continue
            db.add(
                User(
                    full_name=full_name,
                    email=email,
                    hashed_password=hash_password(password),
                    role=role,
                )
            )
            created += 1
        db.commit()
        print(f"Seed complete: {created} created, {skipped} skipped.")
        print("\nLogin credentials:")
        for full_name, email, password, role in SEED_USERS:
            print(f"  {role.value:18} {email:26} {password}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
