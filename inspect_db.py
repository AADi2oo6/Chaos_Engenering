import psycopg2

conn = psycopg2.connect('postgresql://postgres.ksfjhvjbvuxvkonjpcjy:20251%40Aditya@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='auth';")
print("auth tables:", [r[0] for r in cur.fetchall()])
conn.close()
