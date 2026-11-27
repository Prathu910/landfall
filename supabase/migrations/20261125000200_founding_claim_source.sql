-- Plan 2 Task 5: what report-verify needs beyond 20261125000100_paid_reports.sql.
-- report-verify gets only {claimId, code}, so it reads the claim's profile and
-- as_of to build the payload before founding_confirm checks the code. A code
-- email that failed to send is marked unsent, so the next press resends at
-- once instead of waiting a minute. Valid on PostgreSQL 14 and 17.

-- Mirrors founding_confirm's order: unknown -> expired, issued -> used,
-- locked -> locked, expired -> expired; otherwise open with the claim's inputs.
create function public.founding_claim_source(p_claim_id uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_claim public.founding_claims;
begin
  select * into v_claim from public.founding_claims where id = p_claim_id;
  if not found then return jsonb_build_object('status','expired'); end if;
  if v_claim.status = 'issued' then return jsonb_build_object('status','used'); end if;
  if v_claim.status = 'locked' then return jsonb_build_object('status','locked'); end if;
  if v_claim.status = 'expired' or v_claim.expires_at <= now() then
    return jsonb_build_object('status','expired');
  end if;
  return jsonb_build_object('status','open','profile', v_claim.profile,'as_of', v_claim.as_of);
end;
$$;

-- The code email failed: backdate sent_at past the one-minute resend gap.
-- The try count and expiry are untouched, so this can't reset a lock.
create function public.founding_unsent(p_claim_id uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.founding_claims set sent_at = now() - interval '61 seconds'
    where id = p_claim_id and status = 'open';
$$;

revoke all on function public.founding_claim_source(uuid), public.founding_unsent(uuid)
  from public, anon, authenticated;
grant execute on function public.founding_claim_source(uuid), public.founding_unsent(uuid)
  to service_role;
