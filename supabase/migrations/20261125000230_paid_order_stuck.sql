-- Plan 2 fix round 2 (re-review of round 1; ruling R12). Valid on PostgreSQL 14 and 17.
--
-- A paid order whose report can't be built yet (the site down, or its live
-- index or rules failing the bundled guards) is retried, never failed: the
-- webhook answers 500 and confirm answers busy. So that the founder can find
-- and refund one that never issues:
--   * paid_order_payment records the captured payment id (and paid_at, when
--     the payment was first seen) on the pending order before the build. The
--     status stays 'created', so paid_issue still issues it on a retry, and
--     report_refund finds it by its payment id.
--   * paid_order_alerted records that the founder was alerted about the
--     order (alerted_at), after the first failed build's alert went out;
--     paid_order_get returns it as `alerted`, so the alert goes once.
-- The founder query lists created orders with a payment id seen more than 15
-- minutes ago (docs/OPERATIONS-BACKEND.md).

alter table public.report_orders add column alerted_at timestamptz;

-- Records the payment id only on a pending order that has none yet, and only
-- when no other order holds it (paid_issue then refuses that payment anyway).
create function public.paid_order_payment(p_razorpay_order_id text, p_payment_id text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.report_orders
    set razorpay_payment_id = p_payment_id, paid_at = coalesce(paid_at, now()), updated_at = now()
    where razorpay_order_id = p_razorpay_order_id and kind = 'paid' and status = 'created'
      and razorpay_payment_id is null
      and p_payment_id ~ '^pay_[A-Za-z0-9]{1,40}$'
      and not exists (select 1 from public.report_orders o where o.razorpay_payment_id = p_payment_id);
exception when unique_violation then
  -- Another order took this payment id meanwhile: leave this one as it was.
  null;
end;
$$;

-- Keeps the first alert's time; a later call changes nothing.
create function public.paid_order_alerted(p_razorpay_order_id text)
returns void language sql security invoker set search_path = '' as $$
  update public.report_orders set alerted_at = now(), updated_at = now()
    where razorpay_order_id = p_razorpay_order_id and kind = 'paid' and alerted_at is null;
$$;

-- As in 20261125000220, plus `alerted`.
create or replace function public.paid_order_get(p_razorpay_order_id text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('email', o.email, 'currency', o.currency, 'amount', o.amount,
    'profile', o.profile, 'engine_data', o.engine_data, 'as_of', o.as_of, 'status', o.status,
    'alerted', o.alerted_at is not null)
  from public.report_orders o
  where o.razorpay_order_id = p_razorpay_order_id and o.kind = 'paid';
$$;

revoke all on function public.paid_order_payment(text, text), public.paid_order_alerted(text)
  from public, anon, authenticated;
grant execute on function public.paid_order_payment(text, text), public.paid_order_alerted(text)
  to service_role;
