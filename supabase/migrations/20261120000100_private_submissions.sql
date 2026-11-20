-- Backend-only storage. There are deliberately no browser RLS policies.
create function public.valid_submission_summary(p_summary jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if p_summary is null or jsonb_typeof(p_summary) <> 'object' then return false; end if;
  if not (p_summary ?& array['occupation_code','age_band','location','base_points','points_190','points_491','snapshot_id'])
    or p_summary - array['occupation_code','age_band','location','base_points','points_190','points_491','snapshot_id'] <> '{}'::jsonb then return false; end if;
  return coalesce(
    jsonb_typeof(p_summary->'occupation_code') = 'string'
    and p_summary->>'occupation_code' ~ '^([1-9][0-9]{5}|points-only)$'
    and p_summary->>'age_band' in ('under-18','18-24','25-32','33-39','40-44','45+')
    and p_summary->>'location' in ('onshore','offshore')
    and jsonb_typeof(p_summary->'base_points') = 'number'
    and jsonb_typeof(p_summary->'points_190') = 'number'
    and jsonb_typeof(p_summary->'points_491') = 'number'
    and (p_summary->>'base_points')::numeric between 0 and 200
    and mod((p_summary->>'base_points')::numeric, 5) = 0
    and (p_summary->>'points_190')::numeric = (p_summary->>'base_points')::numeric + 5
    and (p_summary->>'points_491')::numeric = (p_summary->>'base_points')::numeric + 15
    and jsonb_typeof(p_summary->'snapshot_id') = 'string'
    and p_summary->>'snapshot_id' ~ '^skillselect-20[0-9]{2}-(0[1-9]|1[0-2])-(28|29|30|31)$', false);
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;

create table public.calculation_submissions (
  id uuid primary key check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) between 3 and 254 and email = btrim(email)),
  email_verified boolean not null default false check (email_verified = false),
  summary jsonb not null check (public.valid_submission_summary(summary)),
  privacy_version text not null check (privacy_version = '2026-11-20')
);
create index calculation_submissions_created_at on public.calculation_submissions (created_at);
create index calculation_submissions_email on public.calculation_submissions (email);

create table public.feedback_submissions (
  id uuid primary key check (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  created_at timestamptz not null default now(),
  category text not null check (category in ('suggestion','bug','improvement','feature','other')),
  message text not null check (char_length(message) between 10 and 3000 and message = btrim(message)),
  email text check (email is null or (char_length(email) between 3 and 254 and email = btrim(email))),
  email_verified boolean not null default false check (email_verified = false),
  summary jsonb check (summary is null or public.valid_submission_summary(summary)),
  privacy_version text not null check (privacy_version = '2026-11-20'),
  status text not null default 'new' check (status in ('new','reviewed','planned','closed'))
);
create index feedback_submissions_created_at on public.feedback_submissions (created_at);
create index feedback_submissions_email on public.feedback_submissions (email) where email is not null;

alter table public.calculation_submissions enable row level security;
alter table public.feedback_submissions enable row level security;
revoke all on public.calculation_submissions, public.feedback_submissions from public, anon, authenticated;
grant select, insert, delete on public.calculation_submissions, public.feedback_submissions to service_role;

-- The read-only probe permits retries after a lost response without replaying Turnstile.
-- The write operation arbitrates concurrent UUIDs using the primary key, then compares
-- the full allowlisted payload; it never mutates a saved submission.
create function public.submit_calculation(p_submission jsonb, p_write boolean default false)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  submission_id uuid := (p_submission->>'id')::uuid;
  existing public.calculation_submissions%rowtype;
  inserted_count integer := 0;
begin
  if jsonb_typeof(p_submission) <> 'object'
    or not (p_submission ?& array['id','email','summary','privacy_version'])
    or p_submission - array['id','email','summary','privacy_version'] <> '{}'::jsonb then
    raise exception 'Invalid submission shape' using errcode = '23514';
  end if;
  if p_write then
    insert into public.calculation_submissions (id, email, summary, privacy_version)
    values (submission_id, p_submission->>'email', p_submission->'summary', p_submission->>'privacy_version')
    on conflict (id) do nothing;
    get diagnostics inserted_count = row_count;
  end if;
  select * into existing from public.calculation_submissions where id = submission_id;
  if not found then return jsonb_build_object('status','missing','id',submission_id); end if;
  if jsonb_build_object('id',existing.id,'email',existing.email,'summary',existing.summary,'privacy_version',existing.privacy_version)
    <> (p_submission || jsonb_build_object('id',submission_id)) then
    return jsonb_build_object('status','conflict','id',submission_id);
  end if;
  return jsonb_build_object('status',case when inserted_count = 1 then 'created' else 'existing' end,'id',submission_id);
end;
$$;

create function public.submit_feedback(p_submission jsonb, p_write boolean default false)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  submission_id uuid := (p_submission->>'id')::uuid;
  existing public.feedback_submissions%rowtype;
  inserted_count integer := 0;
begin
  if jsonb_typeof(p_submission) <> 'object'
    or not (p_submission ?& array['id','category','message','email','summary','privacy_version'])
    or p_submission - array['id','category','message','email','summary','privacy_version'] <> '{}'::jsonb then
    raise exception 'Invalid submission shape' using errcode = '23514';
  end if;
  if p_write then
    insert into public.feedback_submissions (id, category, message, email, summary, privacy_version)
    values (submission_id, p_submission->>'category', p_submission->>'message', p_submission->>'email', nullif(p_submission->'summary','null'::jsonb), p_submission->>'privacy_version')
    on conflict (id) do nothing;
    get diagnostics inserted_count = row_count;
  end if;
  select * into existing from public.feedback_submissions where id = submission_id;
  if not found then return jsonb_build_object('status','missing','id',submission_id); end if;
  if jsonb_build_object('id',existing.id,'category',existing.category,'message',existing.message,'email',existing.email,'summary',existing.summary,'privacy_version',existing.privacy_version)
    <> (p_submission || jsonb_build_object('id',submission_id)) then
    return jsonb_build_object('status','conflict','id',submission_id);
  end if;
  return jsonb_build_object('status',case when inserted_count = 1 then 'created' else 'existing' end,'id',submission_id);
end;
$$;

create function public.purge_expired_submissions()
returns void language sql security invoker set search_path = '' as $$
  delete from public.calculation_submissions where created_at < now() - interval '180 days';
  delete from public.feedback_submissions where created_at < now() - interval '180 days';
$$;

revoke all on function public.valid_submission_summary(jsonb), public.submit_calculation(jsonb, boolean), public.submit_feedback(jsonb, boolean), public.purge_expired_submissions() from public, anon, authenticated;
grant execute on function public.valid_submission_summary(jsonb), public.submit_calculation(jsonb, boolean), public.submit_feedback(jsonb, boolean), public.purge_expired_submissions() to service_role;
