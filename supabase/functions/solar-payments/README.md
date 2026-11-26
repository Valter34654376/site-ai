# Recebimentos Sicoob no Solar Opará

O painel Render usa a função `solar-payments` e a migração `online_payments`. A emissão vem do saldo registrado da parcela. O link do cliente vence e expõe apenas valor, forma, prazo, situação e código de pagamento.

## Credenciais no servidor

O administrador habilita Pix Recebimentos e Cobrança Bancária no [Portal Developers Sicoob](https://developers.sicoob.com.br/portal/). Registre o certificado público A1 no banco e cadastre as credenciais privadas no [cofre do Supabase](https://supabase.com/dashboard/project/bdfojankowlfuezdhdjl/functions/secrets).

| Variável | Valor esperado |
| --- | --- |
| `SICOOB_CLIENT_ID` | Identificador do aplicativo PJ com os escopos de recebimento. |
| `SICOOB_CERT_PEM` e `SICOOB_KEY_PEM` | Certificado público com cadeia e chave privada PEM para mTLS. |
| `SICOOB_PIX_KEY` | Chave Pix cadastrada na conta do Solar Opará. |
| `SICOOB_BENEFICIARY` e `SICOOB_ACCOUNT` | Número do beneficiário e conta de crédito informados pelo Sicoob para o boleto. |
| `SICOOB_WALLET_CONTRACT` | Identificador do contrato de cobrança, quando exigido pela carteira. |
| `PAYMENTS_LINK_SECRET` e `PAYMENTS_SYNC_SECRET` | Segredos distintos de 32 bytes aleatórios em hexadecimal. |
| `SICOOB_SANDBOX_CLIENT_ID` e `SICOOB_SANDBOX_ACCESS_TOKEN` | Credenciais do Sandbox no Portal Developers. |
| `SICOOB_PIX_LIVE` e `SICOOB_BOLETO_LIVE` | Habilitação por forma após validar emissão, recebimento e conciliação com o banco. O valor inicial é `false`. |

A produção usa `cob.read`, `cob.write`, `pix.read`, `boletos_inclusao` e `boletos_consulta`. O teste de conexão no painel consulta o Sandbox. Nenhuma rotina do Sandbox registra pagamentos de contratos.

## Conciliação automática

Crie no Supabase Vault o segredo `solar_payments_sync` com o mesmo valor de `PAYMENTS_SYNC_SECRET`. Habilite Supabase Cron e `pg_net`, depois cadastre a chamada abaixo para executar a cada cinco minutos. Confirme a autenticação e a execução do agendamento antes de habilitar as formas de produção.

```sql
select net.http_post(
  url := 'https://bdfojankowlfuezdhdjl.supabase.co/functions/v1/solar-payments',
  headers := jsonb_build_object('Content-Type', 'application/json', 'X-Solar-Payment-Job', secret.decrypted_secret),
  body := jsonb_build_object('action', 'sync'),
  timeout_milliseconds := 60000
)
from vault.decrypted_secrets as secret
where secret.name = 'solar_payments_sync';
```

O Pix confere cobrança, transação e valor por mTLS antes da baixa. O boleto confere a carteira e o arquivo autenticado de liquidação. Divergências, devoluções parciais e relatórios inconclusivos ficam em conferência. Após uma resposta de emissão de boleto inconclusiva, confirme o título no Sicoob antes de repetir a emissão.

## Cartão

O checkout de cartão depende das especificações e do ambiente liberados no e-commerce Sipag. Solicite à Sipag o credenciamento, as credenciais de homologação, a integração de link hospedado e o vínculo da conta Sicoob. A tela administrativa mostra a forma como pendente até a integração.

## Testes locais

```sh
deno check supabase/functions/solar-payments/index.ts
deno test supabase/functions/solar-payments/charges_test.ts
```
