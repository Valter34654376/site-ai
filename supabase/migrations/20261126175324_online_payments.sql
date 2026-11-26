create table public.so_online_checkouts (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid references public.so_receivables(id) on delete restrict,
  actor_id uuid not null,
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  environment text not null check (environment in ('test', 'live')),
  method text not null check (method in ('pix', 'boleto', 'card', 'flexible')),
  max_installments smallint not null check (max_installments between 1 and 12),
  amount_cents bigint not null check (amount_cents between 1 and 1000000000),
  expires_at timestamptz not null,
  state text not null default 'preparing'
    check (state in ('preparing', 'open', 'paid', 'refunded', 'closed', 'review')),
  provider_checkout_id text,
  provider_details jsonb not null default '{}',
  issue text,
  next_sync_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((environment = 'test') = (receivable_id is null)),
  check (method in ('card', 'flexible') or max_installments = 1),
  unique (provider, environment, provider_checkout_id)
);

create index so_online_checkouts_receivable_idx
  on public.so_online_checkouts (receivable_id);
create unique index so_online_checkouts_active_receivable_idx
  on public.so_online_checkouts (receivable_id)
  where state in ('preparing', 'open');
create index so_online_checkouts_sync_idx on public.so_online_checkouts (next_sync_at)
  where environment = 'live' and state in ('open', 'paid', 'review');

create table public.so_online_transactions (
  provider text not null,
  environment text not null,
  provider_payment_id text not null check (length(provider_payment_id) between 1 and 160),
  checkout_id uuid not null references public.so_online_checkouts(id) on delete restrict,
  payment_id uuid unique references public.so_payments(id) on delete restrict,
  amount_cents bigint not null check (amount_cents between 1 and 1000000000),
  method text not null check (method in ('pix', 'boleto', 'card')),
  state text not null check (state in ('paid', 'refunded', 'review')),
  provider_updated_at timestamptz not null,
  verified_at timestamptz not null default now(),
  primary key (provider, environment, provider_payment_id)
);

create index so_online_transactions_checkout_idx
  on public.so_online_transactions (checkout_id);

alter table public.so_online_checkouts enable row level security;
alter table public.so_online_transactions enable row level security;
revoke all on public.so_online_checkouts, public.so_online_transactions
  from public, anon, authenticated;
grant select, insert, update on public.so_online_checkouts, public.so_online_transactions
  to service_role;

-- The legacy panel needs to distinguish a manual receipt from a provider receipt.
-- The checkout URL, provider IDs, and reconciliation details stay server-side.
grant select (receivable_id, state) on public.so_online_checkouts to anon;
grant select (payment_id) on public.so_online_transactions to anon;
create policy read_online_checkout_state on public.so_online_checkouts
  for select to anon using (receivable_id is not null and (select private.can_read()));
create policy read_online_payment_marker on public.so_online_transactions
  for select to anon using (payment_id is not null and (select private.can_read()));

create function private.so_protect_online_payment()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_receivable_id uuid;
begin
  if current_user = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1 from public.so_online_transactions where payment_id = old.id
  ) then
    raise exception 'Pagamento online conciliado pela operadora. Faça o estorno na operadora.';
  end if;

  if tg_op = 'UPDATE' and new.receivable_id is distinct from old.receivable_id then
    raise exception 'O pagamento deve permanecer na cobrança de origem.';
  end if;

  v_receivable_id := case when tg_op = 'INSERT' then new.receivable_id else old.receivable_id end;
  perform 1 from public.so_receivables where id = v_receivable_id for update;
  if exists (
    select 1 from public.so_online_checkouts
    where receivable_id = v_receivable_id and state in ('preparing', 'open', 'review')
  ) then
    raise exception 'Resolva o link de pagamento online antes de alterar o recebimento manual.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

create trigger so_protect_online_payment
before insert or update or delete on public.so_payments
for each row execute function private.so_protect_online_payment();

create function private.so_protect_online_receivable()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user <> 'service_role' then
    if tg_op = 'DELETE' or row(new.contract_id, new.amount, new.due_date, new.status)
        is distinct from row(old.contract_id, old.amount, old.due_date, old.status) then
      if exists (
        select 1 from public.so_online_checkouts
        where receivable_id = old.id and state in ('preparing', 'open', 'review')
      ) then
        raise exception 'Resolva o link de pagamento online antes de alterar a cobrança.';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

create trigger so_protect_online_receivable
before update or delete on public.so_receivables
for each row execute function private.so_protect_online_receivable();

create function private.so_protect_online_contract()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if row(new.status, new.client_id, new.event_date, new.payment_terms,
    new.rental_value, new.cleaning_fee, new.additional_value) is distinct from
     row(old.status, old.client_id, old.event_date, old.payment_terms,
    old.rental_value, old.cleaning_fee, old.additional_value) and exists (
    select 1
    from public.so_receivables as receivable
    join public.so_online_checkouts as checkout on checkout.receivable_id = receivable.id
    where receivable.contract_id = old.id and checkout.state in ('preparing', 'open', 'review')
  ) then
    raise exception 'Resolva os links de pagamento online antes de alterar os dados financeiros do contrato.';
  end if;
  return new;
end
$$;

create trigger so_protect_online_contract
before update on public.so_contracts
for each row execute function private.so_protect_online_contract();

create function public.so_reserve_online_checkout(
  p_receivable_id uuid,
  p_actor_id uuid,
  p_provider text,
  p_environment text,
  p_method text,
  p_max_installments smallint,
  p_expires_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_contract public.so_contracts%rowtype;
  v_receivable public.so_receivables%rowtype;
  v_checkout public.so_online_checkouts%rowtype;
  v_contract_id uuid;
  v_amount_cents bigint;
begin
  if p_expires_at is null or p_expires_at <= now() or not isfinite(p_expires_at) then
    raise exception 'Informe um vencimento futuro para o link.';
  end if;
  if p_environment = 'test' then
    if p_receivable_id is not null then
      raise exception 'Use uma cobrança de teste separada dos contratos reais.';
    end if;
    v_amount_cents := 10000;
  elsif p_environment = 'live' then
    select contract_id into v_contract_id from public.so_receivables where id = p_receivable_id;
    select * into v_contract from public.so_contracts where id = v_contract_id for update;
    select * into v_receivable from public.so_receivables where id = p_receivable_id for update;
    if not found or v_receivable.contract_id is distinct from v_contract.id or
        v_contract.status not in ('active', 'completed') or v_receivable.status in ('cancelled', 'paid') then
      raise exception 'A cobrança precisa estar aberta e vinculada a um contrato válido.';
    end if;

    if p_method = 'boleto' and (
        v_receivable.due_date is null or
        v_receivable.due_date < (now() at time zone 'America/Sao_Paulo')::date or
        v_receivable.due_date > v_contract.event_date - 30 or
        (p_expires_at at time zone 'America/Sao_Paulo')::date <> v_receivable.due_date
    ) then
      raise exception 'O boleto exige vencimento válido até 30 dias antes do evento.';
    end if;

    select * into v_checkout
    from public.so_online_checkouts
    where receivable_id = p_receivable_id and state in ('preparing', 'open', 'review')
    order by (state = 'review') desc, created_at desc
    limit 1;
    if found then
      return jsonb_build_object('created', false, 'checkout', to_jsonb(v_checkout));
    end if;

    select round(v_receivable.amount * 100)::bigint - coalesce(sum(round(amount * 100)::bigint), 0)
      into v_amount_cents
    from public.so_payments where receivable_id = p_receivable_id and not reversed;
    if v_amount_cents <= 0 then
      raise exception 'A cobrança já está quitada.';
    end if;
  else
    raise exception 'Ambiente de cobrança inválido.';
  end if;

  insert into public.so_online_checkouts (
    receivable_id, actor_id, provider, environment, method, max_installments, amount_cents, expires_at
  ) values (
    p_receivable_id, p_actor_id, p_provider, p_environment, p_method, p_max_installments, v_amount_cents, p_expires_at
  ) returning * into v_checkout;

  return jsonb_build_object(
    'created', true, 'checkout', to_jsonb(v_checkout),
    'event_date', v_contract.event_date, 'due_date', v_receivable.due_date
  );
end
$$;

create function public.so_reconcile_online_payment(
  p_checkout_id uuid,
  p_provider text,
  p_environment text,
  p_provider_payment_id text,
  p_amount_cents bigint,
  p_method text,
  p_outcome text,
  p_provider_updated_at timestamptz,
  p_paid_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_checkout public.so_online_checkouts%rowtype;
  v_receivable public.so_receivables%rowtype;
  v_transaction public.so_online_transactions%rowtype;
  v_payment_id uuid;
  v_balance_cents bigint;
  v_paid_cents bigint;
  v_result text;
  v_issue text;
begin
  if p_outcome not in ('paid', 'refunded', 'review') or p_outcome is null or
     p_method not in ('pix', 'boleto', 'card') or p_method is null or
     p_provider_updated_at is null or not isfinite(p_provider_updated_at) or
     p_provider_payment_id is null or length(p_provider_payment_id) not between 1 and 160 then
    raise exception 'Confirmação da operadora inválida.';
  end if;

  select * into v_checkout from public.so_online_checkouts where id = p_checkout_id;
  if not found or v_checkout.provider is distinct from p_provider or
      v_checkout.environment is distinct from p_environment then
    raise exception 'O pagamento não corresponde ao link e ambiente registrados.';
  end if;
  if v_checkout.receivable_id is not null then
    select * into v_receivable from public.so_receivables where id = v_checkout.receivable_id for update;
  end if;
  select * into v_checkout from public.so_online_checkouts where id = p_checkout_id for update;

  -- The advisory lock serializes use of the same provider transaction even across different links.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    p_provider || ':' || p_environment || ':' || p_provider_payment_id, 0
  ));
  select * into v_transaction
  from public.so_online_transactions
  where provider = p_provider and environment = p_environment and provider_payment_id = p_provider_payment_id;
  if found and v_transaction.checkout_id is distinct from p_checkout_id then
    raise exception 'A transação já está associada a outro link.';
  end if;
  if v_transaction.state = 'refunded' or
     (v_transaction.provider_updated_at is not null and v_transaction.provider_updated_at > p_provider_updated_at) then
    return jsonb_build_object('state', v_transaction.state, 'duplicate', true);
  end if;

  v_payment_id := v_transaction.payment_id;
  v_result := p_outcome;
  if p_amount_cents is distinct from v_checkout.amount_cents or
     not (v_checkout.method = 'flexible' or v_checkout.method = p_method) then
    v_result := 'review';
    v_issue := 'A forma ou o valor recebido difere do registrado no link.';
  elsif p_outcome = 'paid' and v_transaction.state = 'paid' then
    return jsonb_build_object('state', 'paid', 'duplicate', true);
  elsif p_outcome = 'paid' and v_checkout.state in ('closed', 'refunded') then
    v_result := 'review';
    v_issue := 'A operadora informou um pagamento para um link encerrado.';
  elsif p_outcome = 'review' then
    v_issue := 'A situação do pagamento exige conferência com a operadora.';
  end if;

  if v_checkout.environment = 'live' then
    select coalesce(sum(round(amount * 100)::bigint), 0) into v_paid_cents
    from public.so_payments where receivable_id = v_checkout.receivable_id and not reversed;
    v_balance_cents := round(v_receivable.amount * 100)::bigint - v_paid_cents;

    if v_result = 'paid' and v_payment_id is null then
      if v_receivable.status = 'cancelled' or v_balance_cents <> v_checkout.amount_cents or
         p_paid_at is null or not isfinite(p_paid_at) then
        v_result := 'review';
        v_issue := 'Confira o saldo e a data de pagamento antes da baixa.';
      else
        insert into public.so_payments (receivable_id, amount, method, reference, notes, paid_at, confirmed_by)
        values (
          v_checkout.receivable_id, v_checkout.amount_cents::numeric / 100,
          case p_method when 'card' then 'Cartão de crédito' when 'boleto' then 'Boleto bancário' else 'PIX' end,
          p_provider_payment_id, 'Recebimento confirmado pela operadora.', p_paid_at, v_checkout.actor_id
        ) returning id into v_payment_id;
        update public.so_receivables set status = 'paid' where id = v_checkout.receivable_id;
        insert into public.so_audit (action, entity, entity_id, actor_id, details)
        values ('confirm_payment', 'payment', v_payment_id::text, v_checkout.actor_id,
          jsonb_build_object('provider', p_provider, 'method', p_method, 'amount_cents', p_amount_cents));
      end if;
    elsif v_result = 'refunded' and v_payment_id is not null then
      update public.so_payments
      set reversed = true, reversed_at = now(), notes = concat_ws(E'\n', notes, 'Estorno confirmado pela operadora.')
      where id = v_payment_id and not reversed;
      if found then
        insert into public.so_audit (action, entity, entity_id, actor_id, details)
        values ('reverse_payment', 'payment', v_payment_id::text, v_checkout.actor_id,
          jsonb_build_object('provider', p_provider, 'amount_cents', p_amount_cents));
        v_paid_cents := v_paid_cents - v_checkout.amount_cents;
        update public.so_receivables set status = case
          when v_receivable.status = 'cancelled' then 'cancelled'
          when v_paid_cents >= round(v_receivable.amount * 100)::bigint then 'paid'
          when v_paid_cents > 0 then 'partial'
          else 'pending'
        end where id = v_checkout.receivable_id;
      end if;
    end if;
  end if;

  insert into public.so_online_transactions (
    provider, environment, provider_payment_id, checkout_id,
    payment_id, amount_cents, method, state, provider_updated_at
  ) values (
    p_provider, p_environment, p_provider_payment_id, p_checkout_id,
    v_payment_id, p_amount_cents, p_method, v_result, p_provider_updated_at
  )
  on conflict (provider, environment, provider_payment_id) do update set
    payment_id = excluded.payment_id,
    state = excluded.state,
    provider_updated_at = excluded.provider_updated_at,
    verified_at = now();

  update public.so_online_checkouts
  set state = case
        when v_result = 'refunded' and exists (
          select 1 from public.so_online_transactions as transaction
          where transaction.checkout_id = p_checkout_id and transaction.state = 'paid'
        ) then 'paid'
        else v_result
      end,
      issue = v_issue, updated_at = now()
  where id = p_checkout_id;
  return jsonb_build_object('state', v_result, 'payment_id', v_payment_id);
end
$$;

create function public.so_claim_online_payment_checks()
returns setof public.so_online_checkouts
language sql security invoker set search_path = '' as $$
  with pending as (
    select id from public.so_online_checkouts
    where provider = 'sicoob' and environment = 'live' and provider_checkout_id is not null
      and next_sync_at <= now() and (
        state in ('open', 'review') or
        (state = 'paid' and method = 'pix' and updated_at > now() - interval '95 days')
      )
    order by next_sync_at
    limit 12
    for update skip locked
  )
  update public.so_online_checkouts as checkout
  set next_sync_at = now() + case when checkout.state = 'paid' then interval '24 hours' else interval '5 minutes' end
  from pending where checkout.id = pending.id
  returning checkout.*;
$$;

revoke execute on function public.so_reserve_online_checkout(uuid, uuid, text, text, text, smallint, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.so_reconcile_online_payment(uuid, text, text, text, bigint, text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.so_claim_online_payment_checks() from public, anon, authenticated;
grant execute on function public.so_reserve_online_checkout(uuid, uuid, text, text, text, smallint, timestamptz)
  to service_role;
grant execute on function public.so_reconcile_online_payment(uuid, text, text, text, bigint, text, text, timestamptz, timestamptz)
  to service_role;
grant execute on function public.so_claim_online_payment_checks() to service_role;
