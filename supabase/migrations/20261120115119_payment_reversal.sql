create or replace function public.so_reverse_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_payment public.so_payments%rowtype;
  v_receivable public.so_receivables%rowtype;
  v_paid_cents bigint;
  v_total_cents bigint;
  v_status text;
  v_reason text;
begin
  if not private.can_write() then
    raise exception 'Sessão sem permissão para estornar pagamentos.';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  if v_reason is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select * into v_payment
  from public.so_payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;
  if v_payment.reversed then
    raise exception 'Este pagamento já foi estornado.';
  end if;

  select * into v_receivable
  from public.so_receivables
  where id = v_payment.receivable_id
  for update;
  if not found then
    raise exception 'Cobrança vinculada não encontrada.';
  end if;

  update public.so_payments
  set reversed = true,
      reversed_at = now(),
      reversed_by = private.session_user_id(),
      notes = concat_ws(E'\n', nullif(notes, ''), 'ESTORNO: ' || v_reason)
  where id = p_payment_id;

  select coalesce(sum(round(amount * 100)::bigint), 0)
    into v_paid_cents
  from public.so_payments
  where receivable_id = v_payment.receivable_id and not reversed;

  v_total_cents := round(v_receivable.amount * 100)::bigint;
  v_status := case
    when v_receivable.status = 'cancelled' then 'cancelled'
    when v_paid_cents >= v_total_cents then 'paid'
    when v_paid_cents > 0 then 'partial'
    else 'pending'
  end;

  update public.so_receivables
  set status = v_status
  where id = v_payment.receivable_id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id,
    'receivable_id', v_payment.receivable_id,
    'status', v_status,
    'paid', v_paid_cents::numeric / 100,
    'balance', greatest(v_total_cents - v_paid_cents, 0)::numeric / 100
  );
end;
$$;

revoke execute on function public.so_reverse_payment(uuid, text) from public, authenticated;
grant execute on function public.so_reverse_payment(uuid, text) to anon;
