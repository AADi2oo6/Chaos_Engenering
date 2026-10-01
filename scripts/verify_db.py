import os
import psycopg2

def verify():
    env_vars = {}
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            if line.strip() and not line.startswith("#") and "=" in line:
                k, v = line.strip().split("=", 1)
                env_vars[k.strip()] = v.strip()

    conn = psycopg2.connect(env_vars["DATABASE_URL"])
    cur = conn.cursor()
    
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [r[0] for r in cur.fetchall()]
    print("[+] Public tables:", tables)

    cur.execute("""
        SELECT tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE schemaname = 'public';
    """)
    policies = cur.fetchall()
    print(f"[+] Active RLS policies count: {len(policies)}")
    for p in policies:
        print(f"    - Table: {p[0]}, Policy: {p[1]}, Command: {p[4]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    verify()
