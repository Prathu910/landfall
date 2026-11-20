#!/usr/bin/env python3
"""Run migrations and behavioral SQL checks in a disposable PostgreSQL cluster.
Never connects to or modifies an existing cluster. Requires initdb, pg_ctl and psql.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BINDIR = Path(os.environ.get("POSTGRES_BINDIR") or subprocess.check_output(["pg_config", "--bindir"], text=True).strip())
SUMMARY = {"occupation_code": "261313", "age_band": "25-32", "location": "offshore", "base_points": 75, "points_190": 80, "points_491": 90, "snapshot_id": "skillselect-2026-10-31"}
CALCULATION = {"id": "c5fa65d5-f388-4a7b-940c-1b5b78c751bd", "email": "Test@example.com", "summary": SUMMARY, "privacy_version": "2026-11-20"}
FEEDBACK = {"id": "23937e80-90fd-44f6-9ebe-c189dd536043", "category": "bug", "message": "A small test feedback message.", "email": None, "summary": None, "privacy_version": "2026-11-20"}


def main():
    with tempfile.TemporaryDirectory(prefix="ml-pg-", dir="/tmp") as temporary:
        data = Path(temporary) / "data"
        subprocess.run([str(BINDIR / "initdb"), "-D", str(data), "-A", "trust", "--no-locale", "-E", "UTF8"], check=True, stdout=subprocess.DEVNULL)
        subprocess.run([str(BINDIR / "pg_ctl"), "-D", str(data), "-l", str(Path(temporary) / "postgres.log"), "-o", f"-k {temporary} -h '' -F", "-w", "start"], check=True, stdout=subprocess.DEVNULL)
        connection = [str(BINDIR / "psql"), "-X", "-h", temporary, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"]

        def sql(query, role=None, denied=False):
            query = (f"set role {role};\n" if role else "") + query
            result = subprocess.run(connection + ["-c", query], capture_output=True, text=True)
            if denied:
                assert result.returncode != 0 and "permission denied" in result.stderr, result.stderr
                return None
            assert result.returncode == 0, result.stderr
            return result.stdout.strip().removeprefix("SET\n")

        def rpc(kind, payload, write=True):
            encoded = json.dumps(payload).replace("'", "''")
            return json.loads(sql(f"select public.submit_{kind}('{encoded}'::jsonb, {'true' if write else 'false'});", "service_role"))

        try:
            sql("create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; grant usage on schema public to anon, authenticated, service_role;")
            for migration in sorted((ROOT / "supabase/migrations").glob("*.sql")):
                subprocess.run(connection + ["-f", str(migration)], check=True, stdout=subprocess.DEVNULL)
            assert sql("select relrowsecurity from pg_class where oid = 'public.calculation_submissions'::regclass") == "t"
            assert sql("select relrowsecurity from pg_class where oid = 'public.feedback_submissions'::regclass") == "t"
            assert sql("select count(*) from pg_policies where schemaname = 'public' and tablename in ('calculation_submissions', 'feedback_submissions')") == "0"
            print("PASS: both tables enable RLS without public policies")

            for role in ("anon", "authenticated"):
                for table in ("calculation_submissions", "feedback_submissions"):
                    for query in (f"select * from public.{table}", f"insert into public.{table} (id) values (gen_random_uuid())", f"update public.{table} set email = null", f"delete from public.{table}"):
                        sql(query, role, denied=True)
                for name in ("submit_calculation", "submit_feedback"):
                    sql(f"select public.{name}('{{}}'::jsonb, true)", role, denied=True)
                sql("select public.purge_expired_submissions()", role, denied=True)
            assert sql("select bool_and(not has_table_privilege('public', c, 'SELECT,INSERT,UPDATE,DELETE')) from unnest(array['public.calculation_submissions','public.feedback_submissions']) c") == "t"
            print("PASS: anon/authenticated actual SELECT/INSERT/UPDATE/DELETE and RPC calls denied; PUBLIC has no grants")

            for kind, payload, table in (("calculation", CALCULATION, "calculation_submissions"), ("feedback", FEEDBACK, "feedback_submissions")):
                assert rpc(kind, payload, False)["status"] == "missing"
                assert sql(f"select count(*) from public.{table}") == "0"
                assert rpc(kind, payload)["status"] == "created"
                assert rpc(kind, payload)["status"] == "existing"
                changed = {**payload, "email": "different@example.com"}
                assert rpc(kind, changed)["status"] == "conflict"
                assert rpc(kind, changed, False)["status"] == "conflict"
                assert sql(f"select count(*) from public.{table}") == "1"
                assert sql(f"select bool_and(not email_verified) from public.{table}") == "t"
            for status in ("new", "reviewed", "planned", "closed"):
                sql(f"update public.feedback_submissions set status = '{status}'")
                assert rpc("feedback", FEEDBACK)["status"] == "existing"
            rejected_status = subprocess.run(connection + ["-c", "update public.feedback_submissions set status = 'resolved'"], capture_output=True, text=True)
            assert rejected_status.returncode != 0 and "constraint" in rejected_status.stderr, rejected_status.stderr
            assert sql("select status from public.feedback_submissions") == "closed"
            print("PASS: approved feedback backlog statuses accepted, resolved rejected")
            print("PASS: read probe, insert, retry, content conflict, no overwrite, unverified email and status-independent retry")

            parallel = {**CALCULATION, "id": "c5fa65d5-f388-4a7b-940c-1b5b78c751be"}
            with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
                results = list(pool.map(lambda _: rpc("calculation", parallel)["status"], range(6)))
            assert results.count("created") == 1 and results.count("existing") == 5, results
            print("PASS: six concurrent identical writes create exactly one record")

            bad = {**CALCULATION, "id": "c5fa65d5-f388-4a7b-940c-1b5b78c751bf", "summary": {**SUMMARY, "base_points": 76}}
            encoded = json.dumps(bad).replace("'", "''")
            result = subprocess.run(connection + ["-c", f"set role service_role; select public.submit_calculation('{encoded}'::jsonb, true)"], capture_output=True, text=True)
            assert result.returncode != 0 and "constraint" in result.stderr, result.stderr
            print("PASS: database rejects invalid point totals")

            # A transaction fixes now() so exactly 180 days remains and older data expires.
            sql("""begin;
              update public.calculation_submissions set created_at = now() - interval '180 days' where id = 'c5fa65d5-f388-4a7b-940c-1b5b78c751bd';
              update public.calculation_submissions set created_at = now() - interval '181 days' where id = 'c5fa65d5-f388-4a7b-940c-1b5b78c751be';
              update public.feedback_submissions set created_at = now() - interval '181 days';
              select public.purge_expired_submissions();
              do $$ begin
                if (select count(*) from public.calculation_submissions) <> 1 or (select count(*) from public.feedback_submissions) <> 0 then
                  raise exception 'retention boundary failed';
                end if;
              end $$;
              commit;""")
            print("PASS: scheduled cleanup function deletes records older than 180 days, retaining the exact boundary")
        finally:
            subprocess.run([str(BINDIR / "pg_ctl"), "-D", str(data), "-m", "immediate", "-w", "stop"], check=True, stdout=subprocess.DEVNULL)
    print("PASS: isolated test cluster stopped and deleted")


if __name__ == "__main__":
    main()
