alter table public.so_receivables add column is_entry boolean not null default false;

alter table public.so_receivables
  add constraint so_receivables_entry_has_value_and_due_date
  check (not is_entry or (amount > 0 and due_date is not null));

create unique index so_receivables_one_active_entry
  on public.so_receivables (contract_id) where is_entry and status <> 'cancelled';

-- Keep the RPC signature used by existing panels. The entry is an optional part of p_contract.
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
  v_contract_id uuid := p_contract_id;
  v_existing public.so_contracts%rowtype;
  v_entry public.so_receivables%rowtype;
  v_installment_ids uuid[] := '{}'::uuid[];
  v_method text;
  v_existing_method text;
  v_event_name text;
  v_event_date date;
  v_count integer;
  v_entry_amount numeric;
  v_entry_due date;
  v_first_due date;
  v_total_cents bigint;
  v_existing_total_cents bigint;
  v_entry_cents bigint;
  v_balance_cents bigint;
  v_charge_cents bigint;
  v_plan_changed boolean := true;
  v_month date;
  v_due date;
  v_description text;
  i integer;
begin
  if not private.can_write() then
    raise exception 'Sessão sem permissão para alterar contratos.';
  end if;

  v_event_name := btrim(coalesce(p_contract->>'event_name', ''));
  v_event_date := nullif(p_contract->>'event_date', '')::date;
  if v_event_name = '' then raise exception 'Informe o nome do evento.'; end if;
  if nullif(p_contract->>'client_id', '') is null then raise exception 'Informe o cliente.'; end if;
  if v_event_date is null or not isfinite(v_event_date) then raise exception 'Informe a data do evento.'; end if;

  v_method := case coalesce(nullif(btrim(p_contract->>'payment_terms'), ''), 'PIX')
    when 'Boleto' then 'Boleto bancário'
    when 'Cartão' then 'Cartão de crédito'
    else coalesce(nullif(btrim(p_contract->>'payment_terms'), ''), 'PIX')
  end;
  if v_method not in ('PIX', 'Pix parcelado', 'Boleto bancário', 'Dinheiro', 'Transferência bancária', 'Cartão de crédito', 'Outro') then
    raise exception 'Forma de pagamento inválida.';
  end if;

  v_total_cents := round((
    coalesce(nullif(p_contract->>'rental_value', '')::numeric, 0) +
    coalesce(nullif(p_contract->>'cleaning_fee', '')::numeric, 0) +
    coalesce(nullif(p_contract->>'additional_value', '')::numeric, 0)
  ) * 100)::bigint;
  if v_total_cents < 0 then raise exception 'O total do contrato não pode ser negativo.'; end if;

  v_entry_amount := coalesce(nullif(p_contract->>'entry_amount', '')::numeric, 0);
  if v_entry_amount < 0 or v_entry_amount > v_total_cents::numeric / 100 then
    raise exception 'A entrada deve ficar entre zero e o total do contrato.';
  end if;
  if round(v_entry_amount, 2) <> v_entry_amount then
    raise exception 'Informe a entrada com até duas casas decimais.';
  end if;
  v_entry_cents := (v_entry_amount * 100)::bigint;
  v_balance_cents := v_total_cents - v_entry_cents;
  if v_entry_cents > 0 then
    v_entry_due := nullif(p_contract->>'entry_due_date', '')::date;
    if v_entry_due is null or not isfinite(v_entry_due) then
      raise exception 'Informe o vencimento da entrada.';
    end if;
  end if;

  if v_balance_cents = 0 and v_entry_cents > 0 then
    v_count := 0;
  elsif v_method in ('Pix parcelado', 'Boleto bancário', 'Cartão de crédito') then
    v_count := p_installment_count;
  else
    v_count := 1;
  end if;
  if v_count is null or v_count < 0 or v_count > 12 or
     (v_count = 0 and (v_entry_cents = 0 or v_balance_cents > 0)) then
    raise exception 'Escolha de 1 a 12 parcelas para o saldo.';
  end if;
  if v_method = 'Pix parcelado' and v_entry_cents = 0 and v_count < 2 then
    raise exception 'Pix parcelado exige de 2 a 12 parcelas.';
  end if;
  if v_count > 0 and (p_due_date is null or not isfinite(p_due_date)) then
    raise exception 'Informe o primeiro vencimento do saldo.';
  end if;
  if v_balance_cents > 0 and v_balance_cents < v_count then
    raise exception 'O saldo é insuficiente para o número de parcelas.';
  end if;

  if p_contract_id is null then
    insert into public.so_contracts (
      client_id, event_name, event_date, setup_at, start_at, end_at, teardown_at,
      capacity, rental_value, cleaning_fee, additional_services, additional_value,
      guarantee_text, payment_terms, observations, status
    ) values (
      (p_contract->>'client_id')::uuid,
      v_event_name,
      v_event_date,
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
    select * into v_existing from public.so_contracts where id = p_contract_id for update;
    if not found then raise exception 'Contrato não encontrado.'; end if;

    perform 1 from public.so_receivables where contract_id = p_contract_id order by id for update;
    if not (p_contract ? 'entry_amount') and exists (
      select 1 from public.so_receivables
      where contract_id = p_contract_id and (is_entry or status = 'cancelled')
    ) then
      raise exception 'Abra este contrato no painel atualizado para editar as cobranças.';
    end if;

    select * into v_entry from public.so_receivables
    where contract_id = p_contract_id and is_entry and status <> 'cancelled';
    select coalesce(array_agg(id order by due_date, created_at, id), '{}'::uuid[]), min(due_date)
      into v_installment_ids, v_first_due
    from public.so_receivables
    where contract_id = p_contract_id and not is_entry and status <> 'cancelled';

    v_existing_method := case coalesce(v_existing.payment_terms, 'PIX')
      when 'Boleto' then 'Boleto bancário'
      when 'Cartão' then 'Cartão de crédito'
      else coalesce(v_existing.payment_terms, 'PIX')
    end;
    v_existing_total_cents := round((v_existing.rental_value + v_existing.cleaning_fee + v_existing.additional_value) * 100)::bigint;
    v_plan_changed := v_existing_total_cents <> v_total_cents or v_existing_method <> v_method
      or cardinality(v_installment_ids) <> v_count
      or (v_count > 0 and v_first_due is distinct from p_due_date)
      or coalesce(v_entry.amount, 0) <> v_entry_amount
      or v_entry.due_date is distinct from v_entry_due;

    if v_plan_changed and exists (
      select 1 from public.so_receivables r
      where r.contract_id = p_contract_id and (
        r.status in ('paid', 'partial') or exists (
          select 1 from public.so_payments p where p.receivable_id = r.id and not p.reversed
        )
      )
    ) then
      raise exception 'Já existem pagamentos. A entrada e as condições financeiras desse contrato estão protegidas.';
    end if;

    update public.so_contracts set
      client_id = (p_contract->>'client_id')::uuid,
      event_name = v_event_name,
      event_date = v_event_date,
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
  end if;

  if v_entry_cents > 0 then
    v_description := 'Entrada - ' || v_event_name;
    if v_entry.id is null then
      insert into public.so_receivables (contract_id, description, amount, due_date, txid, is_entry)
      values (v_contract_id, v_description, v_entry_amount, v_entry_due,
        upper(left('SO' || replace(gen_random_uuid()::text, '-', ''), 25)), true);
    else
      update public.so_receivables
      set description = v_description, amount = v_entry_amount, due_date = v_entry_due
      where id = v_entry.id;
    end if;
  elsif v_entry.id is not null then
    update public.so_receivables set status = 'cancelled' where id = v_entry.id;
  end if;

  for i in 1..v_count loop
    v_description := 'Contrato - ' || v_event_name ||
      case when v_count > 1 then ' | Parcela ' || i || '/' || v_count
           when v_entry_cents > 0 then ' | Saldo' else '' end;
    if not v_plan_changed then
      update public.so_receivables set description = v_description where id = v_installment_ids[i];
      continue;
    end if;

    v_month := (date_trunc('month', p_due_date)::date + make_interval(months => i - 1))::date;
    v_due := v_month + least(
      extract(day from p_due_date)::integer,
      extract(day from (v_month + interval '1 month' - interval '1 day'))::integer
    ) - 1;
    v_charge_cents := v_balance_cents / v_count + case when i <= v_balance_cents % v_count then 1 else 0 end;
    if v_installment_ids[i] is null then
      insert into public.so_receivables (contract_id, description, amount, due_date, txid)
      values (v_contract_id, v_description, v_charge_cents::numeric / 100, v_due,
        upper(left('SO' || replace(gen_random_uuid()::text, '-', ''), 25)));
    else
      update public.so_receivables set description = v_description, amount = v_charge_cents::numeric / 100, due_date = v_due
      where id = v_installment_ids[i];
    end if;
  end loop;

  if cardinality(v_installment_ids) > v_count then
    update public.so_receivables set status = 'cancelled' where id = any(v_installment_ids[v_count + 1:]);
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
    'charge_count', v_count + case when v_entry_cents > 0 then 1 else 0 end,
    'entry_amount', v_entry_amount,
    'balance', v_balance_cents::numeric / 100,
    'total', v_total_cents::numeric / 100,
    'method', v_method
  );
end;
$$;

revoke execute on function public.so_save_contract_plan(jsonb, date, integer, uuid) from public, authenticated;
grant execute on function public.so_save_contract_plan(jsonb, date, integer, uuid) to anon;
