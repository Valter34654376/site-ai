# Solar Opará — controle de entrega

Última revisão: 22/11/2026 (America/Sao_Paulo)

## Publicado e funcional

- [x] Site público responsivo com fotografias e vídeos locais, sem depender do Instagram para reproduzir a mídia.
- [x] Formulário de visita integrado ao Supabase e calendário com datas ocupadas.
- [x] Painel administrativo no mesmo tema visual do site, com tipografia e controles legíveis.
- [x] Acesso do painel por conta Google autorizada.
- [x] Agenda, clientes, solicitações, contratos, documentos, despesas, auditoria e NFS-e integrados.
- [x] Parcelamento de 1 a 12 vezes, com geração de parcelas em uma única transação no banco.
- [x] Pix parcelado com uma cobrança e QR Code por parcela.
- [x] Registro de pagamentos parciais ou totais, bloqueio de pagamento acima do saldo e estorno auditado.
- [x] Carnê/relatório de parcelas, indicadores financeiros e exportação de recebimentos.
- [x] Banco Supabase e serviços de produção independentes do computador local.
- [x] Site público e painel hospedados no Railway.
- [x] Gateway de NFS-e hospedado e respondendo em produção.

## Verificações executadas

- [x] Build de produção e verificação TypeScript.
- [x] Validação de todas as imagens catalogadas.
- [x] Sintaxe do JavaScript do painel e módulos auxiliares.
- [x] Layout em desktop, notebook, tablet e celular.
- [x] Navegação por teclado, foco visível, contraste e auditoria automatizada de acessibilidade.
- [x] Fluxos de calendário, formulário, galeria, mídia local e mensagens de erro.
- [x] Migrações do banco aplicadas até `20261120115119_payment_reversal`.
- [x] Supabase com estado `ACTIVE_HEALTHY` e sem alerta de saúde.
- [x] Serviços Railway com implantação de produção em estado `SUCCESS`.

## Dependências externas — não são defeitos do sistema

- [ ] **Cartão com cobrança automática:** escolher e contratar uma adquirente/gateway (por exemplo, Mercado Pago, Asaas, Pagar.me ou Stripe), fornecer as credenciais de produção e definir taxas. Hoje o painel organiza as parcelas e registra NSU/comprovante, mas não captura o cartão.
- [ ] **Boleto bancário oficial:** contratar/habilitar um banco ou gateway emissor e fornecer as credenciais. Hoje o painel organiza vencimentos e baixas, mas não gera linha digitável registrada.
- [ ] **Conciliação Pix automática:** contratar API bancária/webhook caso seja desejada baixa automática. Hoje os QR Codes e valores por parcela funcionam, e a confirmação é registrada pelo painel.
- [ ] **Domínio próprio:** informar o domínio desejado e dar acesso ao DNS. Os endereços Railway já funcionam com HTTPS.
- [ ] **Proteção de senhas vazadas no Supabase:** habilitar no painel do Supabase como defesa adicional. O acesso atual do painel usa Google autorizado, não senha do Supabase.

## Endereços de produção

- Site: https://solar-opara-public-production.up.railway.app/
- Painel: https://solar-opara-web-production.up.railway.app/
- Saúde da NFS-e: https://solar-opara-nfse-api7.onrender.com/health

## Observações de segurança

- As tabelas de sessão local têm RLS ativo e são acessadas somente por funções que validam o token de sessão; por isso não possuem políticas diretas.
- As funções privilegiadas de login e NFS-e validam usuário, sessão e permissão no corpo antes de executar a operação.
- As chaves presentes no navegador são somente chaves publicáveis; nenhuma chave `service_role` é enviada ao cliente.
