create or replace function public.so_save_contract_plan(
  p_contract jsonb,
  p_due_date date,
  p_installment_count integer,
  p_contract_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_contract_id uuid;
  v_existing public.so_contracts%rowtype;
  v_method text;
  v_existing_method text;
  v_count integer;
  v_charge_count integer;
  v_has_payments boolean;
  v_total_cents bigint;
  v_existing_total_cents bigint;
  v_base_cents bigint;
  v_extra_cents bigint;
  v_amount_cents bigint;
  v_first_due date;
  v_month date;
  v_due date;
  v_event_name text;
  i integer;
begin
  if not private.can_write() then
    raise exception 'Sessão sem permissão para alterar contratos.';
  end if;

  v_event_name := btrim(coalesce(p_contract->>'event_name', ''));
  if v_event_name = '' then
    raise exception 'Informe o nome do evento.';
  end if;
  if nullif(p_contract->>'client_id', '') is null then
    raise exception 'Informe o cliente.';
  end if;
  if nullif(p_contract->>'event_date', '') is null then
    raise exception 'Informe a data do evento.';
  end if;
  if p_due_date is null then
    raise exception 'Informe o primeiro vencimento.';
  end if;

  v_method := case coalesce(nullif(btrim(p_contract->>'payment_terms'), ''), 'PIX')
    when 'Boleto' then 'Boleto bancário'
    when 'Cartão' then 'Cartão de crédito'
    else coalesce(nullif(btrim(p_contract->>'payment_terms'), ''), 'PIX')
  end;
  if v_method not in ('PIX', 'Pix parcelado', 'Boleto bancário', 'Dinheiro', 'Transferência bancária', 'Cartão de crédito', 'Outro') then
    raise exception 'Forma de pagamento inválida.';
  end if;

  if v_method in ('Pix parcelado', 'Boleto bancário', 'Cartão de crédito') then
    v_count := p_installment_count;
  else
    v_count := 1;
  end if;
  if v_count is null or v_count < 1 or v_count > 12 then
    raise exception 'Escolha de 1 a 12 parcelas.';
  end if;
  if v_method = 'Pix parcelado' and v_count < 2 then
    raise exception 'Pix parcelado exige de 2 a 12 parcelas.';
  end if;

  v_total_cents := round((
    coalesce(nullif(p_contract->>'rental_value', '')::numeric, 0) +
    coalesce(nullif(p_contract->>'cleaning_fee', '')::numeric, 0) +
    coalesce(nullif(p_contract->>'additional_value', '')::numeric, 0)
  ) * 100)::bigint;
  if v_total_cents < 0 then
    raise exception 'O total do contrato não pode ser negativo.';
  end if;
  if v_total_cents > 0 and v_total_cents < v_count then
    raise exception 'Valor insuficiente para o número de parcelas.';
  end if;

  if p_contract_id is null then
    insert into public.so_contracts (
      client_id, event_name, event_date, setup_at, start_at, end_at, teardown_at,
      capacity, rental_value, cleaning_fee, additional_services, additional_value,
      guarantee_text, payment_terms, observations, status
    ) values (
      (p_contract->>'client_id')::uuid,
      v_event_name,
      (p_contract->>'event_date')::date,
      nullif(p_contract->>'setup_at', '')::timestamptz,
      nullif(p_contract->>'start_at', '')::timestamptz,
      nullif(p_contract->>'end_at', '')::timestamptz,
      nullif(p_contract->>'teardown_at', '')::timestamptz,
      nullif(p_contract->>'capacity', '')::integer,
      coalesce(nullif(p_contract->>'rental_value', '')::numeric, 0),
      coalesce(nullif(p_contract->>'cleaning_fee', '')::numeric, 0),
      nullif(p_contract->>'additional_services', ''),
      coalesce(nullif(p_contract->>'additional_value', '')::numeric, 0),
      nullif(p_contract->>'guarantee_text', ''),
      v_method,
      nullif(p_contract->>'observations', ''),
      'active'
    ) returning id into v_contract_id;
  else
    select * into v_existing
    from public.so_contracts
    where id = p_contract_id
    for update;
    if not found then
      raise exception 'Contrato não encontrado.';
    end if;

    select count(*), min(due_date)
      into v_charge_count, v_first_due
    from public.so_receivables
    where contract_id = p_contract_id;

    select exists (
      select 1
      from public.so_payments p
      join public.so_receivables r on r.id = p.receivable_id
      where r.contract_id = p_contract_id and not p.reversed
    ) into v_has_payments;

    v_existing_total_cents := round((
      coalesce(v_existing.rental_value, 0) +
      coalesce(v_existing.cleaning_fee, 0) +
      coalesce(v_existing.additional_value, 0)
    ) * 100)::bigint;
    v_existing_method := case coalesce(v_existing.payment_terms, 'PIX')
      when 'Boleto' then 'Boleto bancário'
      when 'Cartão' then 'Cartão de crédito'
      else coalesce(v_existing.payment_terms, 'PIX')
    end;

    if v_has_payments and (
      v_existing_total_cents <> v_total_cents or
      v_charge_count <> v_count or
      v_existing_method <> v_method or
      v_first_due is distinct from p_due_date
    ) then
      raise exception 'Já existem pagamentos. Não altere valor, parcelas, vencimento inicial ou forma de pagamento.';
    end if;

    update public.so_contracts set
      client_id = (p_contract->>'client_id')::uuid,
      event_name = v_event_name,
      event_date = (p_contract->>'event_date')::date,
      setup_at = nullif(p_contract->>'setup_at', '')::timestamptz,
      start_at = nullif(p_contract->>'start_at', '')::timestamptz,
      end_at = nullif(p_contract->>'end_at', '')::timestamptz,
      teardown_at = nullif(p_contract->>'teardown_at', '')::timestamptz,
      capacity = nullif(p_contract->>'capacity', '')::integer,
      rental_value = coalesce(nullif(p_contract->>'rental_value', '')::numeric, 0),
      cleaning_fee = coalesce(nullif(p_contract->>'cleaning_fee', '')::numeric, 0),
      additional_services = nullif(p_contract->>'additional_services', ''),
      additional_value = coalesce(nullif(p_contract->>'additional_value', '')::numeric, 0),
      guarantee_text = nullif(p_contract->>'guarantee_text', ''),
      payment_terms = v_method,
      observations = nullif(p_contract->>'observations', '')
    where id = p_contract_id;
    v_contract_id := p_contract_id;

    if not v_has_payments then
      delete from public.so_receivables where contract_id = p_contract_id;
    else
      with ranked as (
        select id, row_number() over (order by due_date, created_at, id) as position,
          count(*) over () as total
        from public.so_receivables where contract_id = p_contract_id
      )
      update public.so_receivables r
      set description = 'Contrato - ' || v_event_name ||
        case when ranked.total > 1 then ' | Parcela ' || ranked.position || '/' || ranked.total else '' end
      from ranked where r.id = ranked.id;
    end if;
  end if;

  if p_contract_id is null or not v_has_payments then
    v_base_cents := v_total_cents / v_count;
    v_extra_cents := v_total_cents % v_count;
    for i in 0..(v_count - 1) loop
      v_month := (date_trunc('month', p_due_date)::date + make_interval(months => i))::date;
      v_due := make_date(
        extract(year from v_month)::integer,
        extract(month from v_month)::integer,
        least(
          extract(day from p_due_date)::integer,
          extract(day from (v_month + interval '1 month' - interval '1 day'))::integer
        )
      );
      v_amount_cents := v_base_cents + case when i < v_extra_cents then 1 else 0 end;
      insert into public.so_receivables (contract_id, description, amount, due_date, txid)
      values (
        v_contract_id,
        'Contrato - ' || v_event_name || case when v_count > 1 then ' | Parcela ' || (i + 1) || '/' || v_count else '' end,
        v_amount_cents::numeric / 100,
        v_due,
        upper(left('SO' || replace(gen_random_uuid()::text, '-', ''), 25))
      );
    end loop;
  end if;

  insert into public.so_nfse (contract_id, status, amount)
  values (v_contract_id, 'draft', v_total_cents::numeric / 100)
  on conflict (contract_id) do update
    set amount = excluded.amount, updated_at = now()
    where public.so_nfse.status = 'draft';

  return jsonb_build_object(
    'ok', true,
    'contract_id', v_contract_id,
    'installment_count', v_count,
    'total', v_total_cents::numeric / 100,
    'method', v_method
  );
end;
$$;

create or replace function public.so_record_payment(
  p_receivable_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_notes text default null,
  p_paid_at timestamptz default now()
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_receivable public.so_receivables%rowtype;
  v_payment_id uuid;
  v_method text;
  v_amount_cents bigint;
  v_total_cents bigint;
  v_paid_cents bigint;
  v_new_paid_cents bigint;
  v_status text;
begin
  if not private.can_write() then
    raise exception 'Sessão sem permissão para confirmar pagamentos.';
  end if;

  select * into v_receivable
  from public.so_receivables
  where id = p_receivable_id
  for update;
  if not found then
    raise exception 'Cobrança não encontrada.';
  end if;
  if v_receivable.status = 'cancelled' then
    raise exception 'Não é possível pagar uma cobrança cancelada.';
  end if;

  v_method := case btrim(coalesce(p_method, ''))
    when 'Cartão' then 'Cartão de crédito'
    when 'Boleto' then 'Boleto bancário'
    else btrim(coalesce(p_method, ''))
  end;
  if v_method not in ('PIX', 'Boleto bancário', 'Transferência bancária', 'Dinheiro', 'Cartão de crédito', 'Outro') then
    raise exception 'Forma recebida inválida.';
  end if;
  if v_method in ('Boleto bancário', 'Cartão de crédito') and nullif(btrim(coalesce(p_reference, '')), '') is null then
    raise exception 'Informe a referência da confirmação do pagamento.';
  end if;

  v_amount_cents := round(coalesce(p_amount, 0) * 100)::bigint;
  v_total_cents := round(v_receivable.amount * 100)::bigint;
  select coalesce(sum(round(amount * 100)::bigint), 0)
    into v_paid_cents
  from public.so_payments
  where receivable_id = p_receivable_id and not reversed;

  if v_amount_cents <= 0 then
    raise exception 'O valor recebido deve ser maior que zero.';
  end if;
  if v_amount_cents > v_total_cents - v_paid_cents then
    raise exception 'O valor recebido é maior que o saldo da cobrança.';
  end if;

  insert into public.so_payments (receivable_id, amount, method, reference, notes, paid_at)
  values (
    p_receivable_id,
    v_amount_cents::numeric / 100,
    v_method,
    nullif(btrim(coalesce(p_reference, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    coalesce(p_paid_at, now())
  ) returning id into v_payment_id;

  v_new_paid_cents := v_paid_cents + v_amount_cents;
  v_status := case
    when v_new_paid_cents = v_total_cents then 'paid'
    when v_new_paid_cents > 0 then 'partial'
    else 'pending'
  end;
  update public.so_receivables set status = v_status where id = p_receivable_id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'status', v_status,
    'paid', v_new_paid_cents::numeric / 100,
    'balance', (v_total_cents - v_new_paid_cents)::numeric / 100,
    'method', v_method
  );
end;
$$;

revoke execute on function public.so_save_contract_plan(jsonb, date, integer, uuid) from public, authenticated;
grant execute on function public.so_save_contract_plan(jsonb, date, integer, uuid) to anon;

revoke execute on function public.so_record_payment(uuid, numeric, text, text, text, timestamptz) from public, authenticated;
grant execute on function public.so_record_payment(uuid, numeric, text, text, text, timestamptz) to anon;
