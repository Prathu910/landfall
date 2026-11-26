#!/usr/bin/env python3
"""Run migrations and behavioral SQL checks in a disposable PostgreSQL cluster.
Never connects to or modifies an existing cluster. Requires initdb, pg_ctl and psql.
"""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BINDIR = Path(os.environ.get("POSTGRES_BINDIR") or subprocess.check_output(["pg_config", "--bindir"], text=True).strip())
SUMMARY = {"occupation_code": "261313", "age_band": "25-32", "location": "offshore", "base_points": 75, "points_190": 80, "points_491": 90, "snapshot_id": "skillselect-2026-10-31"}
CALCULATION = {"id": "c5fa65d5-f388-4a7b-940c-1b5b78c751bd", "email": "Test@example.com", "summary": SUMMARY, "privacy_version": "2026-11-20"}
PROFILE = {"occupation": "261313", "name": "Test Reader"}
PAID_TABLES = ("report_settings", "reports", "report_orders", "founding_claims", "report_rate_hits")
PAID_FUNCTIONS = (
    "report_quote()", "founding_start('{}'::jsonb)", "founding_confirm('{}'::jsonb)", "paid_order_create('{}'::jsonb)",
    "paid_order_amount('INR')", "paid_order_get('order_X')", "paid_issue('{}'::jsonb)", "report_by_token('x')",
    "report_revise_source('x')", "report_revise('{}'::jsonb)", "report_revoke_by_payment('pay_X')", "report_delivery_queue(1)",
    "report_delivery_mark('{}'::jsonb)", "purge_expired_reports()", "report_rate('k', 1)",
    "report_iso(now())", "report_with_meta('{}'::jsonb, 'ML-2611-0001', 1, now(), now())",
    "report_insert('paid', 'a@example.com', '{}'::jsonb, '{}'::jsonb)",
    "founding_claim_source('c5fa65d5-f388-4a7b-940c-1b5b78c75100')", "founding_unsent('c5fa65d5-f388-4a7b-940c-1b5b78c75100')",
    "report_refund('pay_X', null)", "paid_order_fail('order_X', 'no-data')",
    "paid_order_payment('order_X', 'pay_X')", "paid_order_alerted('order_X')",
)
FEEDBACK = {"id": "23937e80-90fd-44f6-9ebe-c189dd536043", "category": "bug", "message": "A small test feedback message.", "email": None, "summary": None, "privacy_version": "2026-11-20"}


def sha(text):
    return hashlib.sha256(text.encode()).hexdigest()


def report_input(name):
    return {
        "token_hash": sha(f"token-{name}"),
        "token_enc": f"iv.enc-{name}",
        "payload": {"schema": 1, "meta": None, "view": {"dataMonth": "2026-10"}},
        "engine_data": {"core": {"code": "261313"}, "detail": None},
        "data_as_at": "2026-10",
    }


def paid_report_checks(sql, connection):
    """Plan 2 Task 2: settings, founding claims, paid orders, revisions, refunds and retention."""

    def call(name, payload):
        encoded = json.dumps(payload).replace("'", "''")
        return json.loads(sql(f"select public.{name}('{encoded}'::jsonb);", "service_role"))

    def scalar(query):
        return sql(query, "service_role")

    def mark(payload):
        encoded = json.dumps(payload).replace("'", "''")
        scalar(f"select public.report_delivery_mark('{encoded}'::jsonb);")

    def start(email, code, **extra):
        return call("founding_start", {"email": email, "code_hash": sha(code), "profile": PROFILE, "as_of": "2026-11-25", **extra})

    def confirm(claim_id, code, name):
        return call("founding_confirm", {"claim_id": claim_id, "code_hash": sha(code), "report": report_input(name)})

    for table in PAID_TABLES:
        assert sql(f"select relrowsecurity from pg_class where oid = 'public.{table}'::regclass") == "t", table
    assert sql(f"select count(*) from pg_policies where schemaname = 'public' and tablename in ({','.join(repr(t) for t in PAID_TABLES)})") == "0"
    for role in ("anon", "authenticated"):
        for table in PAID_TABLES:
            for query in (f"select * from public.{table}", f"insert into public.{table} default values", f"update public.{table} set id = id" if table != "report_rate_hits" else f"update public.{table} set hits = hits", f"delete from public.{table}"):
                sql(query, role, denied=True)
        for function in PAID_FUNCTIONS:
            sql(f"select public.{function}", role, denied=True)
        sql("select nextval('public.report_no_seq')", role, denied=True)
    print("PASS: paid tables enable RLS without policies; anon and authenticated can't read, write or call anything")

    quote = json.loads(scalar("select public.report_quote()"))
    assert quote == {"prices": {"INR": 69900, "USD": None}, "founding": {"enabled": True, "remaining": 100, "limit": 100}}, quote
    assert scalar("select public.paid_order_amount('INR')") == "69900"
    assert scalar("select public.paid_order_amount('USD')") == ""
    sql("update public.report_settings set usd_enabled = true")
    assert json.loads(scalar("select public.report_quote()"))["prices"]["USD"] == 1400
    assert scalar("select public.paid_order_amount('USD')") == "1400"
    sql("update public.report_settings set usd_enabled = false")
    rejected = subprocess.run(connection + ["-c", "insert into public.report_settings (id) values (false)"], capture_output=True, text=True)
    assert rejected.returncode != 0 and "constraint" in rejected.stderr, rejected.stderr
    print("PASS: quote defaults (INR 69900, USD null until enabled, 100 founding places), one settings row")

    sql("update public.report_settings set founding_limit = 3")

    def claim(n):
        email = f"race{n}@example.com"
        started = start(email, "111111")
        if started["status"] != "sent":
            return started["status"]
        return confirm(started["claim_id"], "111111", f"race{n}")["status"]

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(claim, range(5)))
    assert results.count("issued") == 3 and results.count("full") == 2, results
    assert scalar("select count(*) from public.report_orders where kind = 'founding'") == "3"
    assert json.loads(scalar("select public.report_quote()"))["founding"]["remaining"] == 0
    print("PASS: five parallel founding claims with limit 3 issue exactly 3; the others get full")

    issued_email = scalar("select email from public.report_orders where kind = 'founding' order by email limit 1")
    sql("update public.report_settings set founding_limit = 100")
    assert start(issued_email, "222222")["status"] == "used"
    print("PASS: one founding report per email")

    sql("update public.report_settings set founding_limit = 4")
    last_a, last_b = start("last-a@example.com", "121212"), start("last-b@example.com", "131313")
    assert last_a["status"] == "sent" and last_b["status"] == "sent", (last_a, last_b)
    assert confirm(last_a["claim_id"], "121212", "last-a")["status"] == "issued"
    assert confirm(last_b["claim_id"], "131313", "last-b") == {"status": "full"}
    assert confirm(last_a["claim_id"], "121212", "last-a-again") == {"status": "used"}
    assert scalar("select count(*) from public.reports where token_hash = '" + sha("token-last-a-again") + "'") == "0"
    sql("update public.report_settings set founding_limit = 100")
    print("PASS: a claim confirmed after the last place goes gets full; a confirmed claim can't issue twice")

    upper = start("Aarav@x.com", "141414")
    assert upper["status"] == "sent", upper
    same = start("aarav@x.com", "151515")
    assert same["status"] == "wait", same
    sql("update public.founding_claims set sent_at = now() - interval '61 seconds' where lower(email) = 'aarav@x.com'")
    assert start("aarav@x.com", "151515") == {"status": "sent", "claim_id": upper["claim_id"]}
    assert confirm(upper["claim_id"], "151515", "aarav")["status"] == "issued"
    assert scalar("select email from public.report_orders where kind = 'founding' and lower(email) = 'aarav@x.com'") == "aarav@x.com"
    assert start("AARAV@x.com", "161616") == {"status": "used"}
    assert start("aarav+1@x.com", "171717")["status"] == "sent"
    duplicate = subprocess.run(connection + ["-c", "insert into public.report_orders (kind, email, currency, amount, status) values ('founding', 'AaRaV@x.com', 'INR', 0, 'issued')"], capture_output=True, text=True)
    assert duplicate.returncode != 0 and "report_orders_founding_email" in duplicate.stderr, duplicate.stderr
    print("PASS: one founding place per email whatever its case (R11); +tags stay distinct; the email is kept as typed")

    report_no = scalar("select report_no from public.reports order by report_no limit 1")
    assert report_no.startswith("ML-") and len(report_no) == 12 and report_no[3:7].isdigit() and report_no[8:].isdigit(), report_no
    stored = json.loads(scalar(f"select payload from public.reports where report_no = '{report_no}'"))
    assert stored["meta"]["reportNo"] == report_no and stored["meta"]["version"] == 1 and stored["meta"]["revisionsLeft"] == 3, stored
    assert stored["meta"]["issuedAt"].endswith("Z") and stored["meta"]["correctableUntil"].endswith("Z"), stored
    assert scalar(f"select expires_at = first_issued_at + interval '12 months' from public.reports where report_no = '{report_no}'") == "t"
    assert scalar("select count(*) from public.founding_claims where status = 'issued' and profile is not null") == "0"
    print("PASS: report numbers are ML-YYMM-NNNN and the RPC writes the stored payload's meta")

    first = start("guess@example.com", "333333")
    assert first["status"] == "sent", first
    for left in (4, 3, 2, 1):
        assert confirm(first["claim_id"], "000000", "guess") == {"status": "wrong", "tries_left": left}
    waiting = start("guess@example.com", "444444")
    assert waiting["status"] == "wait" and 1 <= waiting["seconds"] <= 60, waiting
    sql("update public.founding_claims set sent_at = now() - interval '61 seconds' where email = 'guess@example.com'")
    resent = start("guess@example.com", "444444")
    assert resent == {"status": "sent", "claim_id": first["claim_id"]}, resent
    assert confirm(first["claim_id"], "333333", "guess") == {"status": "wrong", "tries_left": 0}
    assert confirm(first["claim_id"], "444444", "guess") == {"status": "locked"}
    locked = start("guess@example.com", "555555")
    assert locked["status"] == "wait" and locked["seconds"] > 60, locked
    assert scalar("select count(*) from public.reports where token_hash = '" + sha("token-guess") + "'") == "0"
    print("PASS: five wrong codes lock the claim; resend keeps the count and waits 60 s")

    late = start("late@example.com", "666666")
    sql("update public.founding_claims set expires_at = now() - interval '1 second' where email = 'late@example.com'")
    assert confirm(late["claim_id"], "666666", "late") == {"status": "expired"}
    assert confirm("c5fa65d5-f388-4a7b-940c-1b5b78c75100", "666666", "late") == {"status": "expired"}
    again = start("late@example.com", "777777")
    assert again["status"] == "sent" and again["claim_id"] != late["claim_id"], again
    print("PASS: an expired code is refused, and a new claim replaces it")

    def source(claim_id):
        return json.loads(scalar(f"select public.founding_claim_source('{claim_id}')"))

    assert source(again["claim_id"]) == {"status": "open", "profile": PROFILE, "as_of": "2026-11-25"}
    assert source(first["claim_id"]) == {"status": "locked"}
    assert source(late["claim_id"]) == {"status": "expired"}
    assert source("c5fa65d5-f388-4a7b-940c-1b5b78c75100") == {"status": "expired"}
    assert source(last_a["claim_id"]) == {"status": "used"}
    assert start("late@example.com", "787878")["status"] == "wait"
    scalar(f"select public.founding_unsent('{again['claim_id']}')")
    assert start("late@example.com", "797979") == {"status": "sent", "claim_id": again["claim_id"]}
    tries_before = scalar("select tries || ' ' || expires_at from public.founding_claims where email = 'guess@example.com' and status = 'locked'")
    scalar(f"select public.founding_unsent('{first['claim_id']}')")
    assert scalar("select tries || ' ' || expires_at from public.founding_claims where email = 'guess@example.com' and status = 'locked'") == tries_before
    assert start("guess@example.com", "565656")["status"] == "wait"
    print("PASS: claim source mirrors confirm's states; unsent allows an immediate resend but never unlocks a claim")

    sql("update public.report_settings set founding_enabled = false")
    assert start("off@example.com", "888888") == {"status": "off"}
    sql("update public.report_settings set founding_enabled = true")

    order = {"email": "Buyer@example.com", "currency": "INR", "profile": PROFILE, "as_of": "2026-11-25", "razorpay_order_id": "order_RACE1"}
    created = call("paid_order_create", order)
    assert created["status"] == "created" and created["amount"] == 69900 and created["currency"] == "INR", created
    assert call("paid_order_create", order)["status"] == "existing"
    assert call("paid_order_create", {**order, "razorpay_order_id": "order_USD1", "currency": "USD"}) == {"status": "usd-off"}
    assert call("paid_order_create", {**order, "razorpay_order_id": "order_PRICE1", "amount": 50000})["status"] == "price-changed"
    assert scalar("select count(*) from public.report_orders where razorpay_order_id in ('order_USD1', 'order_PRICE1')") == "0"
    got = json.loads(scalar("select public.paid_order_get('order_RACE1')"))
    assert got == {"email": "Buyer@example.com", "currency": "INR", "amount": 69900, "profile": PROFILE, "engine_data": None, "as_of": "2026-11-25", "status": "created", "alerted": False}, got
    assert scalar("select public.paid_order_get('order_NONE')") == ""

    def issue(name):
        return call("paid_issue", {"razorpay_order_id": "order_RACE1", "razorpay_payment_id": "pay_RACE1", "amount": 69900, "currency": "INR", "report": report_input(name)})

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        raced = list(pool.map(issue, ("webhook", "confirm")))
    assert sorted(r["status"] for r in raced) == ["existing", "issued"], raced
    assert raced[0]["report_id"] == raced[1]["report_id"] and raced[0]["report_no"] == raced[1]["report_no"], raced
    winner = next(r for r in raced if r["status"] == "issued")
    loser = next(r for r in raced if r["status"] == "existing")
    assert winner["token_hash_matches"] is True and loser["token_hash_matches"] is False, raced
    assert scalar("select count(*) from public.reports where kind = 'paid'") == "1"
    winner_name = "webhook" if raced[0]["status"] == "issued" else "confirm"
    assert issue(winner_name)["token_hash_matches"] is True
    assert json.loads(scalar("select public.paid_order_get('order_RACE1')"))["status"] == "paid"
    paid_hash = sha(f"token-{winner_name}")
    print("PASS: paid issue is idempotent under a race: one report, the second caller gets existing")

    call("paid_order_create", {**order, "razorpay_order_id": "order_MISMATCH1"})
    tampered = {"razorpay_order_id": "order_MISMATCH1", "razorpay_payment_id": "pay_MISMATCH1", "amount": 100, "currency": "INR", "report": report_input("mismatch")}
    assert call("paid_issue", tampered) == {"status": "mismatch"}
    call("paid_order_create", {**order, "razorpay_order_id": "order_MISMATCH2"})
    assert call("paid_issue", {**tampered, "razorpay_order_id": "order_MISMATCH2", "amount": 69900, "currency": "USD"}) == {"status": "mismatch"}
    assert scalar("select string_agg(status || ' ' || failure_reason, ',') from public.report_orders where razorpay_order_id in ('order_MISMATCH1', 'order_MISMATCH2')") == "failed amount-mismatch,failed amount-mismatch"
    assert scalar("select count(*) from public.reports where token_hash = '" + sha("token-mismatch") + "'") == "0"
    assert call("paid_issue", {**tampered, "razorpay_order_id": "order_NONE"}) == {"status": "unknown-order"}
    retried = {**tampered, "amount": 69900, "report": report_input("mismatch-retry")}
    assert call("paid_issue", retried) == {"status": "failed"}
    assert scalar("select status || ' ' || failure_reason || ' ' || (report_id is null)::text from public.report_orders where razorpay_order_id = 'order_MISMATCH1'") == "failed amount-mismatch true"
    assert scalar("select count(*) from public.reports where token_hash = '" + sha("token-mismatch-retry") + "'") == "0"
    print("PASS: amount or currency mismatch is refused and the order marked failed; unknown orders are refused")
    print("PASS: paid_issue on a failed order answers failed and inserts nothing")

    snapshot = {"core": {"code": "261313", "asAt": "2026-10"}, "detail": None, "checkedAt": "2026-10-31"}
    call("paid_order_create", {**order, "razorpay_order_id": "order_SNAP1", "engine_data": snapshot})
    assert json.loads(scalar("select public.paid_order_get('order_SNAP1')"))["engine_data"] == snapshot
    snap_issue = {"razorpay_order_id": "order_SNAP1", "razorpay_payment_id": "pay_SNAP1", "amount": 69900, "currency": "INR", "report": report_input("snap")}
    assert call("paid_issue", snap_issue)["status"] == "issued"
    assert json.loads(scalar("select public.paid_order_get('order_SNAP1')"))["engine_data"] is None
    print("PASS: a paid order stores its data snapshot until its report is issued (R10)")

    def stuck(column):
        return scalar(f"select {column} from public.report_orders where razorpay_order_id = 'order_STUCK1'")

    founder_query = """select string_agg(razorpay_order_id, ',' order by razorpay_order_id) from public.report_orders
      where kind = 'paid' and (status = 'failed' or (status = 'paid' and report_id is null)
        or (status = 'created' and razorpay_payment_id is not null and paid_at <= now() - interval '15 minutes'))
        and razorpay_order_id in ('order_STUCK1', 'order_STUCK2')"""
    call("paid_order_create", {**order, "razorpay_order_id": "order_STUCK1"})
    call("paid_order_create", {**order, "razorpay_order_id": "order_STUCK2"})
    scalar("select public.paid_order_payment('order_STUCK1', 'pay_STUCK1')")
    assert stuck("status || ' ' || razorpay_payment_id || ' ' || (paid_at is not null)::text || ' ' || (alerted_at is null)::text") == "created pay_STUCK1 true true"
    scalar("select public.paid_order_payment('order_STUCK1', 'pay_OTHER1')")
    assert stuck("razorpay_payment_id") == "pay_STUCK1"
    scalar("select public.paid_order_payment('order_STUCK2', 'pay_STUCK1')")
    scalar("select public.paid_order_payment('order_STUCK2', 'not-a-payment')")
    scalar("select public.paid_order_payment('order_RACE1', 'pay_LATE1')")
    scalar("select public.paid_order_payment('order_NONE', 'pay_NONE1')")
    assert scalar("select count(*) from public.report_orders where razorpay_payment_id in ('pay_OTHER1', 'pay_LATE1', 'pay_NONE1') or (razorpay_order_id = 'order_STUCK2' and razorpay_payment_id is not null)") == "0"
    assert scalar("select razorpay_payment_id from public.report_orders where razorpay_order_id = 'order_RACE1'") == "pay_RACE1"
    assert json.loads(scalar("select public.paid_order_get('order_STUCK1')"))["alerted"] is False
    assert scalar(founder_query) == ""
    sql("update public.report_orders set paid_at = now() - interval '16 minutes' where razorpay_order_id = 'order_STUCK1'")
    assert scalar(founder_query) == "order_STUCK1"
    scalar("select public.paid_order_alerted('order_STUCK1')")
    first_alert = stuck("alerted_at")
    scalar("select public.paid_order_alerted('order_STUCK1')")
    assert stuck("alerted_at") == first_alert and first_alert != ""
    assert json.loads(scalar("select public.paid_order_get('order_STUCK1')"))["alerted"] is True
    stuck_issue = {"razorpay_order_id": "order_STUCK1", "razorpay_payment_id": "pay_STUCK1", "amount": 69900, "currency": "INR", "report": report_input("stuck")}
    assert call("paid_issue", stuck_issue)["status"] == "issued"
    assert stuck("status || ' ' || razorpay_payment_id || ' ' || (report_id is not null)::text") == "paid pay_STUCK1 true"
    assert scalar(founder_query) == ""
    print("PASS: a captured payment is recorded on its pending order before the build, listed after 15 min, alerted once, and still issues (R12)")

    found = json.loads(scalar(f"select public.report_by_token('{paid_hash}')"))
    assert found["status"] == "issued" and found["version"] == 1 and found["payload"]["meta"]["version"] == 1, found
    assert json.loads(scalar(f"select public.report_by_token('{sha('nobody')}')")) == {"status": "missing"}
    source = json.loads(scalar(f"select public.report_revise_source('{paid_hash}')"))
    assert source["status"] == "open" and source["engine_data"] == report_input("x")["engine_data"] and source["profile"] == PROFILE, source
    revision = {"token_hash": paid_hash, "payload": {"schema": 1, "meta": None, "view": {"dataMonth": "2026-10"}}}
    for version in (2, 3, 4):
        revised = call("report_revise", revision)
        assert revised["status"] == "revised" and revised["version"] == version and revised["report_no"] == winner["report_no"], revised
    assert call("report_revise", revision) == {"status": "limit"}
    assert json.loads(scalar(f"select public.report_revise_source('{paid_hash}')"))["status"] == "limit"
    latest = json.loads(scalar(f"select public.report_by_token('{paid_hash}')"))
    assert latest["version"] == 4 and latest["payload"]["meta"] == {**latest["payload"]["meta"], "version": 4, "revisionsLeft": 0, "reportNo": winner["report_no"]}, latest
    assert call("report_revise", {**revision, "token_hash": sha("nobody")}) == {"status": "missing"}
    founding_hash = scalar("select token_hash from public.reports where kind = 'founding' order by report_no limit 1")
    founding_revision = {"token_hash": founding_hash, "payload": revision["payload"]}
    assert call("report_revise", {**founding_revision, "profile": {**PROFILE, "occupation": "221111"}}) == {"status": "occupation-changed"}
    eight_days = scalar(f"select public.report_iso(first_issued_at + interval '8 days') from public.reports where token_hash = '{founding_hash}'")
    assert call("report_revise", {**founding_revision, "now": eight_days}) == {"status": "closed"}
    six_days = scalar(f"select public.report_iso(first_issued_at + interval '6 days') from public.reports where token_hash = '{founding_hash}'")
    assert call("report_revise", {**founding_revision, "now": six_days, "profile": {**PROFILE, "name": "Fixed"}, "token_enc": "iv.new"})["status"] == "revised"
    assert scalar(f"select profile->>'name' || ' ' || token_enc || ' ' || pdf_status || ' ' || email_status from public.reports where token_hash = '{founding_hash}'") == "Fixed iv.new pending pending"
    boundary = json.dumps(founding_revision).replace("'", "''")
    sql(f"""begin;
      update public.reports set first_issued_at = now() - interval '7 days' where token_hash = '{founding_hash}';
      set local role service_role;
      do $$ begin
        if public.report_revise('{boundary}'::jsonb)->>'status' <> 'closed' then raise exception 'seven-day boundary failed'; end if;
      end $$;
      rollback;""")
    print("PASS: revise three times, then limit; after 7 days, closed; the occupation can't change")

    sql("update public.reports set pdf_status = 'done', email_status = 'sent'")
    sql(f"update public.reports set pdf_status = 'pending', email_status = 'pending' where token_hash = '{paid_hash}'")
    queued = json.loads(scalar("select public.report_delivery_queue(10)"))
    assert len(queued) == 1 and queued[0]["report_no"] == winner["report_no"] and queued[0]["amount"] == 69900, queued
    assert queued[0]["payment_id"] == "pay_RACE1" and queued[0]["name"] == "Test Reader" and queued[0]["version"] == 4, queued
    assert json.loads(scalar("select public.report_delivery_queue(10)")) == []
    mark({"report_id": queued[0]["report_id"], "version": 3, "pdf_status": "done"})
    assert scalar(f"select pdf_status || ' ' || pdf_attempts from public.reports where token_hash = '{paid_hash}'") == "pending 0"
    mark({"report_id": queued[0]["report_id"], "version": 4, "pdf_status": "retry", "email_status": "sent", "link_email_sent": True, "next_attempt_at": "2999-01-01T00:05:00Z"})
    assert scalar(f"select pdf_status || ' ' || pdf_attempts || ' ' || email_attempts || ' ' || link_email_sent || ' ' || (lease_until is null) from public.reports where token_hash = '{paid_hash}'") == "retry 1 1 true true"
    assert json.loads(scalar("select public.report_delivery_queue(10)")) == []
    mark({"report_id": queued[0]["report_id"], "pdf_status": "done", "pdf_email_sent": True, "clear_token": True})
    assert scalar(f"select (token_enc is null)::text || ' ' || pdf_attempts from public.reports where token_hash = '{paid_hash}'") == "true 2"
    print("PASS: the delivery queue leases due reports and the mark records attempts, flags and the token clear")

    assert [scalar("select public.report_rate('203.0.113.9', 2)") for _ in range(3)] == ["t", "t", "f"]
    assert scalar("select public.report_rate('203.0.113.10', 2)") == "t"
    assert scalar("select count(*) from public.report_rate_hits where key_hash = '203.0.113.9'") == "0"
    print("PASS: the rate counter refuses once over the limit and stores only key hashes")

    assert json.loads(scalar("select public.report_revoke_by_payment('pay_RACE1')"))["status"] == "revoked"
    assert json.loads(scalar(f"select public.report_by_token('{paid_hash}')")) == {"status": "revoked"}
    assert scalar("select status from public.report_orders where razorpay_payment_id = 'pay_RACE1'") == "refunded"
    assert call("report_revise", revision) == {"status": "closed"}
    assert json.loads(scalar("select public.report_revoke_by_payment('pay_NONE')")) == {"status": "unknown-payment"}
    assert issue("after-refund")["status"] == "existing"
    print("PASS: a refund revokes the report")

    def refund(payment, order_id):
        order_arg = "null" if order_id is None else f"'{order_id}'"
        return json.loads(scalar(f"select public.report_refund('{payment}', {order_arg})"))

    reports_before = scalar("select count(*) from public.reports")
    call("paid_order_create", {**order, "razorpay_order_id": "order_EARLY1"})
    assert refund("pay_EARLY1", "order_EARLY1") == {"status": "revoked", "report_id": None}
    assert scalar("select status || ' ' || razorpay_payment_id from public.report_orders where razorpay_order_id = 'order_EARLY1'") == "refunded pay_EARLY1"
    early = {"razorpay_order_id": "order_EARLY1", "razorpay_payment_id": "pay_EARLY1", "amount": 69900, "currency": "INR", "report": report_input("early")}
    assert call("paid_issue", early) == {"status": "refunded"}
    assert refund("pay_EARLY1", None)["status"] == "revoked"
    assert refund("pay_RACE1", None)["status"] == "revoked"
    assert refund("pay_NONE", None) == {"status": "unknown-payment"}
    assert refund("pay_NONE", "order_NONE") == {"status": "unknown-payment"}
    assert scalar("select count(*) from public.reports") == reports_before

    call("paid_order_create", {**order, "razorpay_order_id": "order_PAR1"})

    def race(step):
        if step == "refund":
            return refund("pay_PAR1", "order_PAR1")["status"]
        return call("paid_issue", {**early, "razorpay_order_id": "order_PAR1", "razorpay_payment_id": "pay_PAR1", "report": report_input("par")})["status"]

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        outcome = dict(zip(("refund", "issue"), pool.map(race, ("refund", "issue"))))
    assert outcome["refund"] == "revoked" and outcome["issue"] in ("issued", "refunded"), outcome
    assert scalar("select count(*) from public.reports where status = 'issued' and token_hash = '" + sha("token-par") + "'") == "0"
    assert scalar("select status from public.report_orders where razorpay_order_id = 'order_PAR1'") == "refunded"

    call("paid_order_create", {**order, "razorpay_order_id": "order_NODATA1"})
    scalar("select public.paid_order_fail('order_NODATA1', 'no-data')")
    assert scalar("select status || ' ' || failure_reason from public.report_orders where razorpay_order_id = 'order_NODATA1'") == "failed no-data"
    assert call("paid_issue", {**early, "razorpay_order_id": "order_NODATA1", "razorpay_payment_id": "pay_NODATA1", "report": report_input("nodata")}) == {"status": "failed"}
    assert scalar("select count(*) from public.reports where token_hash = '" + sha("token-nodata") + "'") == "0"
    scalar("select public.paid_order_fail('order_RACE1', 'no-data')")
    assert scalar("select status from public.report_orders where razorpay_order_id = 'order_RACE1'") == "refunded"
    print("PASS: a refund before issue blocks any later issue, also when the two race; a pending order can be failed")

    sql("""begin;
      update public.reports set expires_at = now() where token_hash = '""" + founding_hash + """';
      update public.reports set expires_at = now() + interval '1 second' where token_hash <> '""" + founding_hash + """';
      set local role service_role;
      select public.purge_expired_reports();
      commit;""")
    assert json.loads(scalar(f"select public.report_by_token('{founding_hash}')")) == {"status": "expired"}
    assert scalar(f"select status || ' ' || (email is null and profile is null and payload is null and engine_data is null and token_enc is null)::text || ' ' || (report_no like 'ML-%')::text from public.reports where token_hash = '{founding_hash}'") == "expired true true"
    assert scalar("select count(*) from public.reports where payload is not null") == str(int(scalar("select count(*) from public.reports")) - 1)
    print("PASS: purge keeps the token row as expired and deletes the profile and view")


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

            paid_report_checks(sql, connection)
        finally:
            subprocess.run([str(BINDIR / "pg_ctl"), "-D", str(data), "-m", "immediate", "-w", "stop"], check=True, stdout=subprocess.DEVNULL)
    print("PASS: isolated test cluster stopped and deleted")


if __name__ == "__main__":
    main()
