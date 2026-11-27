-- Final review fixes (rulings R13 and R14). Valid on PostgreSQL 14 and 17.
--
-- R13: one Razorpay order can capture two payments (a late-approved UPI
-- collect after a card payment). The report belongs to the payment that
-- issued it, so report_refund revokes only when the refunded payment is the
-- order's own (the one that issued its report, or the one recorded before the
-- build), or when the order has no payment yet (a refund before issue, R6).
-- A refund of any other payment on the order is recorded in other_refunds and
-- leaves the order and its report alone. paid_order_get now returns the
-- order's payment id, so a second capture can alert the founder once.
--
-- R14: when the webhook issued first, report-confirm reads the issued
-- report's token_enc through paid_order_token, but only for the signed payment
-- that issued it and only while the report is issued and still holds it.

alter table public.report_orders add column other_refunds text[] not null default '{}';

create or replace function public.report_refund(p_payment_id text, p_razorpay_order_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.report_orders;
begin
  select * into v_order from public.report_orders where razorpay_payment_id = p_payment_id for update;
  if not found and p_razorpay_order_id is not null then
    select * into v_order from public.report_orders
      where razorpay_order_id = p_razorpay_order_id and kind = 'paid' for update;
    if found and v_order.razorpay_payment_id is not null then
      -- Another payment on an order that already has its own: record only.
      update public.report_orders
        set other_refunds = case when p_payment_id is null or p_payment_id = any(other_refunds)
              then other_refunds else array_append(other_refunds, p_payment_id) end,
            updated_at = now()
        where id = v_order.id;
      return jsonb_build_object('status','other-payment','report_id', v_order.report_id);
    end if;
  end if;
  if v_order.id is null then return jsonb_build_object('status','unknown-payment'); end if;
  update public.report_orders
    set status = 'refunded', refunded_at = coalesce(refunded_at, now()), updated_at = now(),
        razorpay_payment_id = coalesce(razorpay_payment_id,
          case when not exists (select 1 from public.report_orders o where o.razorpay_payment_id = p_payment_id)
            then p_payment_id end)
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

-- As in 20261125000230, plus `payment_id`.
create or replace function public.paid_order_get(p_razorpay_order_id text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('email', o.email, 'currency', o.currency, 'amount', o.amount,
    'profile', o.profile, 'engine_data', o.engine_data, 'as_of', o.as_of, 'status', o.status,
    'alerted', o.alerted_at is not null, 'payment_id', o.razorpay_payment_id)
  from public.report_orders o
  where o.razorpay_order_id = p_razorpay_order_id and o.kind = 'paid';
$$;

-- The issued report's sealed token, for the payment that issued it; null otherwise.
create function public.paid_order_token(p_razorpay_order_id text, p_payment_id text)
returns text language sql stable security invoker set search_path = '' as $$
  select r.token_enc
  from public.report_orders o join public.reports r on r.id = o.report_id
  where o.razorpay_order_id = p_razorpay_order_id and o.kind = 'paid' and o.status = 'paid'
    and o.razorpay_payment_id = p_payment_id and r.status = 'issued' and r.token_enc is not null;
$$;

revoke all on function public.paid_order_token(text, text) from public, anon, authenticated;
grant execute on function public.paid_order_token(text, text) to service_role;
