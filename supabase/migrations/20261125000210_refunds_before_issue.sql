-- Plan 2 Task 6 (ruling R6): a refund must never be followed by a report.
-- report_revoke_by_payment finds an order only by its payment id, which is
-- written at issue, so a refund that arrives before any issue was lost and a
-- later capture or confirm still issued. report_refund also finds the order by
-- its Razorpay order id; paid_issue then answers 'refunded'. paid_order_fail
-- records a paid order that can't be issued (its occupation lost its data), so
-- the founder can refund it. Valid on PostgreSQL 14 and 17.

create function public.report_refund(p_payment_id text, p_razorpay_order_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_order public.report_orders;
begin
  select * into v_order from public.report_orders where razorpay_payment_id = p_payment_id for update;
  if not found and p_razorpay_order_id is not null then
    select * into v_order from public.report_orders
      where razorpay_order_id = p_razorpay_order_id and kind = 'paid' for update;
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

-- Only a pending order can fail this way; a paid or refunded one keeps its state.
create function public.paid_order_fail(p_razorpay_order_id text, p_reason text)
returns void language sql security invoker set search_path = '' as $$
  update public.report_orders set status = 'failed', failure_reason = p_reason, updated_at = now()
    where razorpay_order_id = p_razorpay_order_id and kind = 'paid' and status = 'created';
$$;

revoke all on function public.report_refund(text, text), public.paid_order_fail(text, text)
  from public, anon, authenticated;
grant execute on function public.report_refund(text, text), public.paid_order_fail(text, text)
  to service_role;
