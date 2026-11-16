# Solar Opará público — desempenho em 16/11/2026

Fonte real em `solar-opara-public`, branch `performance-optimization`, commit `1291331`. A raiz do repositório contém um protótipo de advogado, que não foi enviado como aplicação Solar. Serviço administrativo e banco preservados.

O SDK Supabase agora carrega quando o calendário se aproxima da tela, com uma Promise compartilhada, cancelamento de requisição e cleanup. As variáveis de ponteiro foram limitadas ao cursor/hero; o cursor e o progresso usam transform em vez de alterar layout. A primeira tela não consulta a disponibilidade.

Comparação controlada com as mesmas dependências finais e configuração pública fictícia, sem requisições ao banco: JS inicial **560.327 → 346.312 bytes**, gzip **157.938 → 103.956**. Comparação da versão original com dependências antigas versus entrega: **424.933/120.691 → 346.312/103.956 bytes**. A atualização de segurança aumentou o SDK completo, por isso as duas comparações são explicitadas. Não se usa um build sem chave como suposta medição do calendário configurado.

Supabase JS atualizado de 2.49.4 para 2.119.0; Zod de 3.25.76 para 4.6.7 e correções transitivas. Auditoria npm final sem alertas. Build, TypeScript e verificação SHA das mídias aprovados. As sete fotos autorizadas e seus derivados foram preservados.

Playwright: 24 casos aprovados e 23 skips previstos na suíte; o caso restante passou após atualizar seu teste para rolar até o calendário, em vez de esperar a consulta antes da visibilidade. Total: 25 casos aplicáveis aprovados entre suíte e repetição.

Publicado no serviço público existente, deployment **9c1c9a27-a87d-4b9e-895c-8aa42fa39d80**, confirmado em SUCCESS. URL: https://solar-opara-public-production.up.railway.app. Chrome mobile em HTTPS: zero consultas antes de rolar, consulta de `so_public_busy_dates` com seleção somente de `event_date` respondeu 200 após abrir o calendário, sem pageerror ou overflow. Nenhum pedido de reserva foi enviado pelo agente.
