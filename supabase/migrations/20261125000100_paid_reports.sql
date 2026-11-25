-- Paid reports, orders and Founding 100 claims (spec 2026-11-25-paid-report-design.md,
-- "Data"). Backend-only like the submissions: RLS on, no policies, no grants to anon
-- or authenticated. Every function runs as its caller (service_role) with an empty
-- search_path. Amounts come only from report_settings; link tokens and codes are
-- stored only as SHA-256 hex. Valid on PostgreSQL 14 (local tests) and 17 (Supabase).

create sequence public.report_no_seq as bigint minvalue 1;

-- One row, edited by the founder in the Table Editor (no deploy needed).
create table public.report_settings (
  id boolean primary key default true check (id),
  founding_enabled boolean not null default true,
  founding_limit integer not null default 100 check (founding_limit >= 0),
  price_inr integer not null default 69900 check (price_inr > 0),
  price_usd integer not null default 1400 check (price_usd > 0),
  usd_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.report_settings default values;

create function public.report_settings_touch()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger report_settings_touch before update on public.report_settings
  for each row execute function public.report_settings_touch();

-- After expiry (12 months) the purge clears every personal column and keeps
-- token_hash, report_no, status and expires_at, so the link can say "expired".
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  -- AES-GCM ciphertext of the link token ("iv.ciphertext"), for PDF rendering only.
  token_enc text check (token_enc is null or char_length(token_enc) between 1 and 512),
  report_no text not null unique check (report_no ~ '^ML-[0-9]{4}-[0-9]{4,}$'),
  kind text not null check (kind in ('founding','paid')),
  email text check (email is null or (char_length(email) between 3 and 254 and email = btrim(email))),
  profile jsonb check (profile is null or jsonb_typeof(profile) = 'object'),
  payload jsonb check (payload is null or jsonb_typeof(payload) = 'object'),
  -- The raw core and detail the report was built from (plan 2 ruling R1).
  engine_data jsonb check (engine_data is null or jsonb_typeof(engine_data) = 'object'),
  data_as_at text check (data_as_at is null or data_as_at ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  status text not null default 'issued' check (status in ('issued','revoked','expired')),
  -- Version 1 plus at most 3 revisions.
  version integer not null default 1 check (version between 1 and 4),
  first_issued_at timestamptz not null default now(),
  issued_at timestamptz not null default now(),
  revised_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  pdf_status text not null default 'pending' check (pdf_status in ('pending','retry','done','failed')),
  email_status text not null default 'pending' check (email_status in ('pending','retry','sent','failed')),
  next_attempt_at timestamptz not null default now(),
  email_next_at timestamptz not null default now(),
  lease_until timestamptz,
  pdf_attempts integer not null default 0 check (pdf_attempts >= 0),
  email_attempts integer not null default 0 check (email_attempts >= 0),
  link_email_sent boolean not null default false,
  pdf_email_sent boolean not null default false,
  alert_sent boolean not null default false,
  check (status <> 'issued' or (email is not null and profile is not null and payload is not null and engine_data is not null))
);
create index reports_expires_at on public.reports (expires_at);
create index reports_delivery on public.reports (first_issued_at)
  where status = 'issued' and (pdf_status in ('pending','retry') or email_status in ('pending','retry'));

create table public.report_orders (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id),
  kind text not null check (kind in ('founding','paid')),
  email text not null check (char_length(email) between 3 and 254 and email = btrim(email)),
  currency text not null check (currency in ('INR','USD')),
  amount integer not null check (amount >= 0),
  profile jsonb check (profile is null or jsonb_typeof(profile) = 'object'),
  as_of date,
  razorpay_order_id text unique check (razorpay_order_id is null or razorpay_order_id ~ '^order_[A-Za-z0-9]{1,40}$'),
  razorpay_payment_id text unique check (razorpay_payment_id is null or razorpay_payment_id ~ '^pay_[A-Za-z0-9]{1,40}$'),
  -- Founding orders are 'issued' (nothing is paid); paid orders go created -> paid -> refunded, or failed.
  status text not null check (status in ('created','paid','issued','refunded','failed')),
  failure_reason text check (failure_reason is null or failure_reason ~ '^[a-z-]{1,40}$'),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz,
  updated_at timestamptz not null default now(),
  check (kind <> 'founding' or (amount = 0 and razorpay_order_id is null and razorpay_payment_id is null and status = 'issued')),
  check (kind <> 'paid' or (amount > 0 and razorpay_order_id is not null and status <> 'issued'))
);
-- One founding report per (normalised) email, whatever the race.
create unique index report_orders_founding_email on public.report_orders (email) where kind = 'founding';
create unique index report_orders_report on public.report_orders (report_id) where report_id is not null;

create table public.founding_claims (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254 and email = btrim(email)),
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  tries integer not null default 0 check (tries between 0 and 5),
  status text not null default 'open' check (status in ('open','locked','expired','issued')),
  profile jsonb check (profile is null or jsonb_typeof(profile) = 'object'),
  as_of date,
  currency text not null default 'INR' check (currency in ('INR','USD')),
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  report_id uuid references public.reports (id)
);
create unique index founding_claims_live_email on public.founding_claims (email) where status in ('open','locked');
create index founding_claims_expires_at on public.founding_claims (expires_at);

-- Fixed one-minute windows; keys are stored only as SHA-256 hex.
create table public.report_rate_hits (
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  hits integer not null default 1 check (hits >= 1),
  primary key (key_hash, window_start)
);

-- An ISO 8601 UTC timestamp, as JavaScript writes one.
create function public.report_iso(p_at timestamptz)
returns text language sql stable security invoker set search_path = '' as $$
  select to_char(p_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

-- The stored payload's meta is written here, so it always matches the row.
create function public.report_with_meta(p_payload jsonb, p_report_no text, p_version integer, p_issued_at timestamptz, p_first_issued_at timestamptz)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_set(p_payload, '{meta}', jsonb_build_object(
    'reportNo', p_report_no,
    'version', p_version,
    'issuedAt', public.report_iso(p_issued_at),
    'correctableUntil', public.report_iso(p_first_issued_at + interval '7 days'),
    'revisionsLeft', 4 - p_version), true);
$$;

-- Inserts version 1 of a report. p_report is {token_hash, token_enc, payload, engine_data, data_as_at}.
create function public.report_insert(p_kind text, p_email text, p_profile jsonb, p_report jsonb)
returns public.reports language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz := now();
  v_seq bigint;
  v_no text;
  v_row public.reports;
begin
  if jsonb_typeof(p_report) is distinct from 'object'
    or not (p_report ?& array['token_hash','token_enc','payload','engine_data','data_as_at'])
    or p_report - array['token_hash','token_enc','payload','engine_data','data_as_at'] <> '{}'::jsonb
    or jsonb_typeof(p_report->'payload') is distinct from 'object' then
    raise exception 'Invalid report shape' using errcode = '23514';
  end if;
  v_seq := nextval('public.report_no_seq');
  v_no := 'ML-' || to_char(v_now at time zone 'UTC', 'YYMM') || '-' || lpad(v_seq::text, greatest(4, length(v_seq::text)), '0');
  insert into public.reports (token_hash, token_enc, report_no, kind, email, profile, payload, engine_data, data_as_at, first_issued_at, issued_at, expires_at)
  values (p_report->>'token_hash', p_report->>'token_enc', v_no, p_kind, p_email, p_profile,
    public.report_with_meta(p_report->'payload', v_no, 1, v_now, v_now),
    nullif(p_report->'engine_data', 'null'::jsonb), p_report->>'data_as_at', v_now, v_now, v_now + interval '12 months')
  returning * into v_row;
  return v_row;
end;
$$;

-- The Quote contract: prices in the smallest unit, USD null while it is off.
create function public.report_quote()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'prices', jsonb_build_object('INR', s.price_inr, 'USD', case when s.usd_enabled then s.price_usd end),
    'founding', jsonb_build_object(
      'enabled', s.founding_enabled,
      'remaining', greatest(s.founding_limit - (select count(*) from public.report_orders o where o.kind = 'founding'), 0),
      'limit', s.founding_limit))
  from public.report_settings s;
$$;

-- Starts (or resends) a founding claim. A resend reuses the open claim with a
-- new code and the same try count, at most once a minute; a locked claim
-- blocks the email until it expires. The place is taken only on confirm.
create function public.founding_start(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_email text := p->>'email';
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
  perform pg_advisory_xact_lock(hashtextextended('founding:' || v_email, 0));
  select * into v_settings from public.report_settings;
  if not v_settings.founding_enabled then return jsonb_build_object('status','off'); end if;
  if exists (select 1 from public.report_orders where kind = 'founding' and email = v_email) then
    return jsonb_build_object('status','used');
  end if;
  if (select count(*) from public.report_orders where kind = 'founding') >= v_settings.founding_limit then
    return jsonb_build_object('status','full');
  end if;
  select * into v_claim from public.founding_claims where email = v_email and status in ('open','locked') for update;
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
      set code_hash = p->>'code_hash', sent_at = v_now, expires_at = v_now + interval '10 minutes',
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

-- Confirms a code and issues the founding report. The settings row lock
-- serialises every confirm, so the count can never pass the limit.
create function public.founding_confirm(p jsonb)
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
  if exists (select 1 from public.report_orders where kind = 'founding' and email = v_claim.email) then
    return jsonb_build_object('status','used');
  end if;
  v_report := public.report_insert('founding', v_claim.email, v_claim.profile, p->'report');
  insert into public.report_orders (report_id, kind, email, currency, amount, as_of, status)
  values (v_report.id, 'founding', v_claim.email, v_claim.currency, 0, v_claim.as_of, 'issued');
  update public.founding_claims set status = 'issued', report_id = v_report.id, profile = null where id = v_claim.id;
  return jsonb_build_object('status','issued','report_no', v_report.report_no,'report_id', v_report.id);
end;
$$;

-- The price for a currency now; null when USD is off (or the currency is unknown).
create function public.paid_order_amount(p_currency text)
returns integer language sql stable security invoker set search_path = '' as $$
  select case p_currency
    when 'INR' then s.price_inr
    when 'USD' then case when s.usd_enabled then s.price_usd end
  end
  from public.report_settings s;
$$;

-- Stores a pending order at the settings price. An optional `amount` (the one
-- the function sent to Razorpay) must still equal it, so a price edit between
-- the two calls can't leave a Razorpay order the database would refuse.
create function public.paid_order_create(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_amount integer;
  v_id uuid;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ?& array['email','currency','profile','as_of','razorpay_order_id'])
    or p - array['email','currency','profile','as_of','razorpay_order_id','amount'] <> '{}'::jsonb then
    raise exception 'Invalid paid order' using errcode = '23514';
  end if;
  v_amount := public.paid_order_amount(p->>'currency');
  if v_amount is null then return jsonb_build_object('status','usd-off'); end if;
  if p ? 'amount' and p->'amount' is distinct from to_jsonb(v_amount) then
    return jsonb_build_object('status','price-changed','amount', v_amount);
  end if;
  insert into public.report_orders (kind, email, currency, amount, profile, as_of, razorpay_order_id, status)
  values ('paid', p->>'email', p->>'currency', v_amount, p->'profile', (p->>'as_of')::date, p->>'razorpay_order_id', 'created')
  on conflict (razorpay_order_id) do nothing
  returning id into v_id;
  if v_id is null then
    select id, amount into v_id, v_amount from public.report_orders where razorpay_order_id = p->>'razorpay_order_id';
    return jsonb_build_object('status','existing','order_id', v_id,'amount', v_amount,'currency', p->>'currency');
  end if;
  return jsonb_build_object('status','created','order_id', v_id,'amount', v_amount,'currency', p->>'currency');
end;
$$;

create function public.paid_order_get(p_razorpay_order_id text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('email', o.email, 'currency', o.currency, 'amount', o.amount,
    'profile', o.profile, 'as_of', o.as_of, 'status', o.status)
  from public.report_orders o
  where o.razorpay_order_id = p_razorpay_order_id and o.kind = 'paid';
$$;

-- Issues the report for a paid order, once. The order row lock makes the
-- webhook and report-confirm queue behind each other; the second gets
-- 'existing' and the first token hash stays.
create function public.paid_issue(p jsonb)
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
        report_id = v_report.id, failure_reason = null, updated_at = now()
    where id = v_order.id;
  return jsonb_build_object('status','issued','report_id', v_report.id,'report_no', v_report.report_no,'token_hash_matches', true);
end;
$$;

create function public.report_by_token(p_token_hash text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_report public.reports;
begin
  select * into v_report from public.reports where token_hash = p_token_hash;
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_report.status = 'revoked' then return jsonb_build_object('status','revoked'); end if;
  if v_report.status = 'expired' or v_report.expires_at <= now() then return jsonb_build_object('status','expired'); end if;
  return jsonb_build_object('status','issued','payload', v_report.payload,'version', v_report.version,
    'profile', v_report.profile,'report_no', v_report.report_no);
end;
$$;

-- What report-revise rebuilds from: the stored profile and engine data, or
-- why it can't ('missing', 'closed' or 'limit').
create function public.report_revise_source(p_token_hash text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_report public.reports;
begin
  select * into v_report from public.reports where token_hash = p_token_hash;
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_report.status <> 'issued' or v_report.expires_at <= now() or now() >= v_report.first_issued_at + interval '7 days' then
    return jsonb_build_object('status','closed');
  end if;
  if v_report.version >= 4 then return jsonb_build_object('status','limit'); end if;
  return jsonb_build_object('status','open','report_id', v_report.id,'report_no', v_report.report_no,
    'version', v_report.version,'profile', v_report.profile,'engine_data', v_report.engine_data,
    'data_as_at', v_report.data_as_at,'first_issued_at', public.report_iso(v_report.first_issued_at));
end;
$$;

-- Stores a correction as the next version under the same token and report
-- number, and queues its PDF and email again. Optional keys: `now` (tests),
-- `profile` (the corrected answers; the occupation can't change) and
-- `token_enc` (the token again, in case delivery cleared it).
create function public.report_revise(p jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz;
  v_report public.reports;
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ?& array['token_hash','payload'])
    or p - array['token_hash','payload','now','profile','token_enc'] <> '{}'::jsonb
    or jsonb_typeof(p->'payload') is distinct from 'object'
    or (p ? 'profile' and jsonb_typeof(p->'profile') is distinct from 'object') then
    raise exception 'Invalid revision' using errcode = '23514';
  end if;
  v_now := coalesce((p->>'now')::timestamptz, now());
  select * into v_report from public.reports where token_hash = p->>'token_hash' for update;
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_report.status <> 'issued' or v_report.expires_at <= v_now or v_now >= v_report.first_issued_at + interval '7 days' then
    return jsonb_build_object('status','closed');
  end if;
  if v_report.version >= 4 then return jsonb_build_object('status','limit'); end if;
  if p ? 'profile' and p->'profile'->>'occupation' is distinct from v_report.profile->>'occupation' then
    return jsonb_build_object('status','occupation-changed');
  end if;
  update public.reports
    set version = v_report.version + 1,
        payload = public.report_with_meta(p->'payload', v_report.report_no, v_report.version + 1, v_now, v_report.first_issued_at),
        profile = coalesce(p->'profile', profile),
        token_enc = coalesce(p->>'token_enc', token_enc),
        issued_at = v_now, revised_at = v_now,
        pdf_status = 'pending', email_status = 'pending', pdf_attempts = 0, email_attempts = 0,
        next_attempt_at = v_now, email_next_at = v_now, lease_until = null,
        link_email_sent = false, pdf_email_sent = false, alert_sent = false
    where id = v_report.id
    returning * into v_report;
  return jsonb_build_object('status','revised','version', v_report.version,'report_no', v_report.report_no,'report_id', v_report.id);
end;
$$;

-- refund.processed: the order is refunded and its report revoked (idempotent).
create function public.report_revoke_by_payment(p_payment_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.report_orders;
begin
  select * into v_order from public.report_orders where razorpay_payment_id = p_payment_id for update;
  if not found then return jsonb_build_object('status','unknown-payment'); end if;
  update public.report_orders set status = 'refunded', refunded_at = coalesce(refunded_at, now()), updated_at = now()
    where id = v_order.id;
  if v_order.report_id is not null then
    update public.reports
      set status = case when status = 'issued' then 'revoked' else status end,
          revoked_at = coalesce(revoked_at, now()), token_enc = null
      where id = v_order.report_id;
  end if;
  return jsonb_build_object('status','revoked','report_id', v_order.report_id);
end;
$$;

-- Due deliveries: a PDF to render once next_attempt_at has passed, or an
-- email to send once email_next_at has passed. Each picked report is leased
-- for 10 minutes so overlapping runs never send twice; report_delivery_mark
-- ends the lease.
create function public.report_delivery_queue(p_limit integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_items jsonb;
begin
  with picked as (
    select r.id from public.reports r
    where r.status = 'issued'
      and (r.pdf_status in ('pending','retry') or r.email_status in ('pending','retry'))
      and ((r.pdf_status in ('pending','retry') and r.next_attempt_at <= now())
        or (r.email_status in ('pending','retry') and r.email_next_at <= now()))
      and (r.lease_until is null or r.lease_until <= now())
    order by r.first_issued_at
    limit greatest(p_limit, 0)
    for update skip locked
  ), leased as (
    update public.reports r set lease_until = now() + interval '10 minutes'
    from picked where r.id = picked.id
    returning r.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'report_id', l.id, 'report_no', l.report_no, 'kind', l.kind, 'version', l.version,
      'email', l.email, 'name', coalesce(l.profile->>'name', ''), 'token_enc', l.token_enc,
      'pdf_status', l.pdf_status, 'email_status', l.email_status,
      'pdf_attempts', l.pdf_attempts, 'email_attempts', l.email_attempts,
      'link_email_sent', l.link_email_sent, 'pdf_email_sent', l.pdf_email_sent, 'alert_sent', l.alert_sent,
      'first_issued_at', public.report_iso(l.first_issued_at), 'issued_at', public.report_iso(l.issued_at),
      'next_attempt_at', public.report_iso(l.next_attempt_at), 'email_next_at', public.report_iso(l.email_next_at),
      'amount', o.amount, 'currency', o.currency, 'payment_id', o.razorpay_payment_id)
      order by l.first_issued_at), '[]'::jsonb)
    into v_items
  from leased l left join public.report_orders o on o.report_id = l.id;
  return v_items;
end;
$$;

-- Records one delivery step. Each pdf_status or email_status given counts as
-- one attempt of that kind. An optional `version` makes the mark a no-op when
-- a revision replaced the version being delivered.
create function public.report_delivery_mark(p jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if jsonb_typeof(p) is distinct from 'object'
    or not (p ? 'report_id')
    or p - array['report_id','version','pdf_status','email_status','next_attempt_at','email_next_at',
      'link_email_sent','pdf_email_sent','alert_sent','clear_token'] <> '{}'::jsonb then
    raise exception 'Invalid delivery mark' using errcode = '23514';
  end if;
  update public.reports
    set pdf_status = coalesce(p->>'pdf_status', pdf_status),
        email_status = coalesce(p->>'email_status', email_status),
        pdf_attempts = pdf_attempts + case when p ? 'pdf_status' then 1 else 0 end,
        email_attempts = email_attempts + case when p ? 'email_status' then 1 else 0 end,
        next_attempt_at = coalesce((p->>'next_attempt_at')::timestamptz, next_attempt_at),
        email_next_at = coalesce((p->>'email_next_at')::timestamptz, email_next_at),
        link_email_sent = coalesce((p->>'link_email_sent')::boolean, link_email_sent),
        pdf_email_sent = coalesce((p->>'pdf_email_sent')::boolean, pdf_email_sent),
        alert_sent = coalesce((p->>'alert_sent')::boolean, alert_sent),
        token_enc = case when coalesce((p->>'clear_token')::boolean, false) then null else token_enc end,
        lease_until = null
    where id = (p->>'report_id')::uuid
      and (not p ? 'version' or version = (p->>'version')::integer);
end;
$$;

-- Daily (supabase/cron): reports past expiry keep only token_hash, report_no,
-- status and dates; orders keep what accounting needs (amount, currency, ids,
-- dates, email) and lose the profile; spent claims and rate windows go.
create function public.purge_expired_reports()
returns void language sql security invoker set search_path = '' as $$
  update public.reports
    set email = null, profile = null, payload = null, engine_data = null, token_enc = null,
        status = case when status = 'issued' then 'expired' else status end
    where expires_at <= now()
      and (email is not null or profile is not null or payload is not null or engine_data is not null or token_enc is not null or status = 'issued');
  update public.report_orders o set profile = null
    where o.profile is not null
      and (exists (select 1 from public.reports r where r.id = o.report_id and r.expires_at <= now())
        or (o.report_id is null and o.created_at <= now() - interval '30 days'));
  delete from public.founding_claims where expires_at <= now() - interval '1 day';
  delete from public.report_rate_hits where window_start < now() - interval '1 hour';
$$;

-- A fixed one-minute window per key: true while the key is within p_limit.
create function public.report_rate(p_key text, p_limit integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_hits integer;
begin
  insert into public.report_rate_hits as h (key_hash, window_start, hits)
  values (encode(sha256(convert_to(p_key, 'UTF8')), 'hex'), date_trunc('minute', now()), 1)
  on conflict (key_hash, window_start) do update set hits = h.hits + 1
  returning h.hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

alter table public.report_settings enable row level security;
alter table public.reports enable row level security;
alter table public.report_orders enable row level security;
alter table public.founding_claims enable row level security;
alter table public.report_rate_hits enable row level security;
revoke all on public.report_settings, public.reports, public.report_orders, public.founding_claims, public.report_rate_hits
  from public, anon, authenticated;
revoke all on sequence public.report_no_seq from public, anon, authenticated;
grant select, update on public.report_settings to service_role;
grant select, insert, update on public.reports, public.report_orders to service_role;
grant select, insert, update, delete on public.founding_claims, public.report_rate_hits to service_role;
grant usage on sequence public.report_no_seq to service_role;

revoke all on function
  public.report_settings_touch(), public.report_iso(timestamptz),
  public.report_with_meta(jsonb, text, integer, timestamptz, timestamptz),
  public.report_insert(text, text, jsonb, jsonb), public.report_quote(),
  public.founding_start(jsonb), public.founding_confirm(jsonb),
  public.paid_order_amount(text), public.paid_order_create(jsonb), public.paid_order_get(text),
  public.paid_issue(jsonb), public.report_by_token(text), public.report_revise_source(text),
  public.report_revise(jsonb), public.report_revoke_by_payment(text),
  public.report_delivery_queue(integer), public.report_delivery_mark(jsonb),
  public.purge_expired_reports(), public.report_rate(text, integer)
  from public, anon, authenticated;
grant execute on function
  public.report_iso(timestamptz),
  public.report_with_meta(jsonb, text, integer, timestamptz, timestamptz),
  public.report_insert(text, text, jsonb, jsonb), public.report_quote(),
  public.founding_start(jsonb), public.founding_confirm(jsonb),
  public.paid_order_amount(text), public.paid_order_create(jsonb), public.paid_order_get(text),
  public.paid_issue(jsonb), public.report_by_token(text), public.report_revise_source(text),
  public.report_revise(jsonb), public.report_revoke_by_payment(text),
  public.report_delivery_queue(integer), public.report_delivery_mark(jsonb),
  public.purge_expired_reports(), public.report_rate(text, integer)
  to service_role;
