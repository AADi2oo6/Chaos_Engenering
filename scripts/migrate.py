import os
import psycopg2
from pathlib import Path

def run_migrations():
    env_vars = {}
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()

    database_url = env_vars.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found in .env")
        return False

    migrations_dir = Path("supabase/migrations")
    migration_files = sorted(migrations_dir.glob("*.sql"))

    print(f"Connecting to database to apply {len(migration_files)} migrations...")
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()

    for mf in migration_files:
        print(f"Applying migration: {mf.name} ...")
        sql = mf.read_text(encoding="utf-8")
        cur.execute(sql)
        print(f"Successfully applied {mf.name}")

    cur.close()
    conn.close()
    print("All migrations applied successfully!")
    return True

if __name__ == "__main__":
    run_migrations()
