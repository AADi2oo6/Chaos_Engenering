import os
import sys
import psycopg2

def load_env(env_path=".env"):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip()
    return env_vars

def test_connection():
    env = load_env()
    host = env.get("DB_HOST", "aws-0-ap-northeast-2.pooler.supabase.com")
    port = int(env.get("DB_PORT", 5432))
    dbname = env.get("DB_NAME", "postgres")
    user = env.get("DB_USER", "postgres.ksfjhvjbvuxvkonjpcjy")
    password = env.get("DB_PASSWORD", "")

    print("[*] Connecting to Supabase PostgreSQL...")
    print(f"    Host: {host}")
    print(f"    Port: {port}")
    print(f"    Database: {dbname}")
    print(f"    User: {user}")

    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password,
            sslmode="require",
            connect_timeout=10
        )
        print("[+] Connection established successfully!")
        
        with conn.cursor() as cur:
            print("[*] Executing 'SELECT 1;' ...")
            cur.execute("SELECT 1;")
            result_1 = cur.fetchone()
            print(f"[+] Query result: {result_1[0]}")
            
            print("[*] Executing 'SELECT current_database();' ...")
            cur.execute("SELECT current_database();")
            current_db = cur.fetchone()
            print(f"[+] Current database: {current_db[0]}")

        conn.close()
        print("[+] Connection closed cleanly.")
        print("[SUCCESS] Supabase PostgreSQL verification completed successfully.")
        return True
    except Exception as e:
        print(f"[-] Connection or Query failed: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
