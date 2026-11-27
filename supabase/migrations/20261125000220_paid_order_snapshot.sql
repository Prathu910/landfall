-- Plan 2 fix round 1 (review I1, I2; rulings R10, R11). Valid on PostgreSQL 14 and 17.
--
-- Ruling R10: a paid order keeps the occupation's raw data as it was quoted
-- ({core, detail, checkedAt}, written by report-order), and the report is
-- issued from that snapshot, so the live month (a deploy in progress, CDN
-- edges on mixed versions) can't fail an order that was paid. paid_order_get
-- returns it; paid_issue clears it once the report holds its own copy, and
-- purge clears it with the profile. The Functions no longer fail a paid order for
-- its data, so paid_order_fail (20261125000210) is left for manual use only.
--
-- Review I2: paid_issue issues only a pending ('created') order, checked under
-- the order row lock, so a webhook that just failed the order (amount
-- mismatch) can't be overtaken by a confirm that read the status earlier.
--
-- Ruling R11: one founding report per email ignores letter case (the whole
-- address is lowercased for the key; +tags and dots stay distinct). The email
-- is stored, and sent to, as typed.

alter table public.report_orders
  add column engine_data jsonb check (engine_data is null or jsonb_typeof(engine_data) = 'object');

drop index public.report_orders_founding_email;
create unique index report_orders_founding_email on public.report_orders (lower(email)) where kind = 'founding';
drop index public.founding_claims_live_email;
create unique index founding_claims_live_email on public.founding_claims (lower(email)) where status in ('open','locked');

-- As in 20261125000100, with the email compared case-insensitively. A resend
-- from the same address in another case reuses the claim and takes the new
-- spelling, which is where the new code (and so the report) goes.
create or replace function public.founding_start(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_email text := p->>'email';
  v_key text := lower(p->>'email');
  v_now timestamptz := now();
  v_settings public.report_settings;
  v_claim public.founding_claims;
  v_live boolean;
  v_id uuid;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ?& array['email','code_hash','profile','as_of'])
    or p - array['email','code_hash','profile','as_of','currency'] <> '{}'::jsonb then
    raise exception 'Invalid founding start' using errcode = '23514';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('founding:' || v_key, 0));
  select * into v_settings from public.report_settings;
  if not v_settings.founding_enabled then return jsonb_build_object('status','off'); end if;
  if exists (select 1 from public.report_orders where kind = 'founding' and lower(email) = v_key) then
    return jsonb_build_object('status','used');
  end if;
  if (select count(*) from public.report_orders where kind = 'founding') >= v_settings.founding_limit then
    return jsonb_build_object('status','full');
  end if;
  select * into v_claim from public.founding_claims where lower(email) = v_key and status in ('open','locked') for update;
  v_live := found;
  if v_live and v_claim.expires_at <= v_now then
    update public.founding_claims set status = 'expired', profile = null where id = v_claim.id;
    v_live := false;
  end if;
  if v_live then
    if v_claim.status = 'locked' then
      return jsonb_build_object('status','wait','seconds', greatest(1, ceil(extract(epoch from v_claim.expires_at - v_now)))::integer);
    end if;
    if v_claim.sent_at > v_now - interval '60 seconds' then
      return jsonb_build_object('status','wait','seconds', greatest(1, ceil(60 - extract(epoch from v_now - v_claim.sent_at)))::integer);
    end if;
    update public.founding_claims
      set email = v_email, code_hash = p->>'code_hash', sent_at = v_now, expires_at = v_now + interval '10 minutes',
          profile = p->'profile', as_of = (p->>'as_of')::date, currency = coalesce(p->>'currency', currency)
      where id = v_claim.id;
    return jsonb_build_object('status','sent','claim_id', v_claim.id);
  end if;
  insert into public.founding_claims (email, code_hash, profile, as_of, currency, sent_at, expires_at)
  values (v_email, p->>'code_hash', p->'profile', (p->>'as_of')::date, coalesce(p->>'currency', 'INR'), v_now, v_now + interval '10 minutes')
  returning id into v_id;
  return jsonb_build_object('status','sent','claim_id', v_id);
end;
$$;

-- As in 20261125000100, with the one-per-email check case-insensitive.
create or replace function public.founding_confirm(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz := now();
  v_claim public.founding_claims;
  v_settings public.report_settings;
  v_report public.reports;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ?& array['claim_id','code_hash','report'])
    or p - array['claim_id','code_hash','report'] <> '{}'::jsonb then
    raise exception 'Invalid founding confirm' using errcode = '23514';
  end if;
  select * into v_claim from public.founding_claims where id = (p->>'claim_id')::uuid for update;
  if not found then return jsonb_build_object('status','expired'); end if;
  if v_claim.status = 'issued' then return jsonb_build_object('status','used'); end if;
  if v_claim.status = 'locked' then return jsonb_build_object('status','locked'); end if;
  if v_claim.status = 'expired' or v_claim.expires_at <= v_now then return jsonb_build_object('status','expired'); end if;
  if v_claim.code_hash is distinct from p->>'code_hash' then
    update public.founding_claims
      set tries = tries + 1,
          status = case when tries + 1 >= 5 then 'locked' else status end,
          expires_at = case when tries + 1 >= 5 then v_now + interval '10 minutes' else expires_at end
      where id = v_claim.id
      returning * into v_claim;
    return jsonb_build_object('status','wrong','tries_left', 5 - v_claim.tries);
  end if;
  select * into v_settings from public.report_settings for update;
  if not v_settings.founding_enabled
    or (select count(*) from public.report_orders where kind = 'founding') >= v_settings.founding_limit then
    return jsonb_build_object('status','full');
  end if;
  if exists (select 1 from public.report_orders where kind = 'founding' and lower(email) = lower(v_claim.email)) then
    return jsonb_build_object('status','used');
  end if;
  v_report := public.report_insert('founding', v_claim.email, v_claim.profile, p->'report');
  insert into public.report_orders (report_id, kind, email, currency, amount, as_of, status)
  values (v_report.id, 'founding', v_claim.email, v_claim.currency, 0, v_claim.as_of, 'issued');
  update public.founding_claims set status = 'issued', report_id = v_report.id, profile = null where id = v_claim.id;
  return jsonb_build_object('status','issued','report_no', v_report.report_no,'report_id', v_report.id);
end;
$$;

-- As in 20261125000100, plus an optional `engine_data` snapshot.
create or replace function public.paid_order_create(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_amount integer;
  v_id uuid;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ?& array['email','currency','profile','as_of','razorpay_order_id'])
    or p - array['email','currency','profile','as_of','razorpay_order_id','amount','engine_data'] <> '{}'::jsonb then
    raise exception 'Invalid paid order' using errcode = '23514';
  end if;
  v_amount := public.paid_order_amount(p->>'currency');
  if v_amount is null then return jsonb_build_object('status','usd-off'); end if;
  if p ? 'amount' and p->'amount' is distinct from to_jsonb(v_amount) then
    return jsonb_build_object('status','price-changed','amount', v_amount);
  end if;
  insert into public.report_orders (kind, email, currency, amount, profile, engine_data, as_of, razorpay_order_id, status)
  values ('paid', p->>'email', p->>'currency', v_amount, p->'profile', nullif(p->'engine_data', 'null'::jsonb),
    (p->>'as_of')::date, p->>'razorpay_order_id', 'created')
  on conflict (razorpay_order_id) do nothing
  returning id into v_id;
  if v_id is null then
    select id, amount into v_id, v_amount from public.report_orders where razorpay_order_id = p->>'razorpay_order_id';
    return jsonb_build_object('status','existing','order_id', v_id,'amount', v_amount,'currency', p->>'currency');
  end if;
  return jsonb_build_object('status','created','order_id', v_id,'amount', v_amount,'currency', p->>'currency');
end;
$$;

create or replace function public.paid_order_get(p_razorpay_order_id text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('email', o.email, 'currency', o.currency, 'amount', o.amount,
    'profile', o.profile, 'engine_data', o.engine_data, 'as_of', o.as_of, 'status', o.status)
  from public.report_orders o
  where o.razorpay_order_id = p_razorpay_order_id and o.kind = 'paid';
$$;

-- As in 20261125000100, but only a pending order issues: a failed one answers
-- 'failed' and stays failed. The status is read under the row lock.
create or replace function public.paid_issue(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.report_orders;
  v_report public.reports;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ?& array['razorpay_order_id','razorpay_payment_id','amount','currency','report'])
    or p - array['razorpay_order_id','razorpay_payment_id','amount','currency','report'] <> '{}'::jsonb then
    raise exception 'Invalid paid issue' using errcode = '23514';
  end if;
  select * into v_order from public.report_orders
    where razorpay_order_id = p->>'razorpay_order_id' and kind = 'paid' for update;
  if not found then return jsonb_build_object('status','unknown-order'); end if;
  if v_order.report_id is not null then
    select * into v_report from public.reports where id = v_order.report_id;
    return jsonb_build_object('status','existing','report_id', v_report.id,'report_no', v_report.report_no,
      'token_hash_matches', v_report.token_hash = p->'report'->>'token_hash');
  end if;
  if v_order.status = 'refunded' then return jsonb_build_object('status','refunded'); end if;
  if v_order.status <> 'created' then return jsonb_build_object('status', v_order.status); end if;
  if p->'amount' is distinct from to_jsonb(v_order.amount) or p->>'currency' is distinct from v_order.currency then
    update public.report_orders set status = 'failed', failure_reason = 'amount-mismatch', updated_at = now() where id = v_order.id;
    return jsonb_build_object('status','mismatch');
  end if;
  if exists (select 1 from public.report_orders where razorpay_payment_id = p->>'razorpay_payment_id' and id <> v_order.id) then
    return jsonb_build_object('status','mismatch');
  end if;
  v_report := public.report_insert('paid', v_order.email, v_order.profile, p->'report');
  update public.report_orders
    set status = 'paid', razorpay_payment_id = p->>'razorpay_payment_id', paid_at = now(),
        report_id = v_report.id, engine_data = null, updated_at = now()
    where id = v_order.id;
  return jsonb_build_object('status','issued','report_id', v_report.id,'report_no', v_report.report_no,'token_hash_matches', true);
end;
$$;

-- As in 20261125000100; an order's data snapshot goes with its profile.
create or replace function public.purge_expired_reports()
returns void language sql security invoker set search_path = '' as $$
  update public.reports
    set email = null, profile = null, payload = null, engine_data = null, token_enc = null,
        status = case when status = 'issued' then 'expired' else status end
    where expires_at <= now()
      and (email is not null or profile is not null or payload is not null or engine_data is not null or token_enc is not null or status = 'issued');
  update public.report_orders o set profile = null, engine_data = null
    where (o.profile is not null or o.engine_data is not null)
      and (exists (select 1 from public.reports r where r.id = o.report_id and r.expires_at <= now())
        or (o.report_id is null and o.created_at <= now() - interval '30 days'));
  delete from public.founding_claims where expires_at <= now() - interval '1 day';
  delete from public.report_rate_hits where window_start < now() - interval '1 hour';
$$;
