# Solar Opará — direção de arte e experiência pública

## Auditoria da base

As capturas da versão publicada foram feitas antes de editar o aplicativo, em 390×844, 430×932, 768×1024, 1366×768, 1440×900 e 1920×1080. A base tinha uma abertura dividida em duas colunas, três experiências com a mesma composição, pouca variação de escala e um percurso fotográfico limitado às duas imagens confirmadas do espaço. A reserva funcionava, mas precisava acompanhar a linguagem da apresentação.

## Composição

- Abertura em carvão quente: fotografia em uma janela arquitetônica, tipografia atravessando a imagem e uma chamada circular para consultar datas. O enquadramento móvel tem composição própria.
- Bodoni Moda no lugar de Cormorant Garamond, combinada com Manrope. Fontes locais e licenças OFL incluídas.
- Apresentação do espaço com título em grande escala, fragmentos de texto e panorama do jardim. A fotografia não fica subordinada a uma coluna de texto.
- Experiências organizadas em capítulos expansíveis, com navegação por teclado, em vez de três cards iguais.
- Intervalo emocional com díptico fotográfico, frase curta e contexto de cada imagem.
- Galeria como sequência de páginas: formatos e larguras alternados, legendas de localização, oito filtros e carregamento incremental.
- Convite à visita em terracota, reserva em marfim e encerramento com marca tipográfica em grande escala.

O movimento usa APIs nativas: parallax limitado no hero de desktop, revelação por máscara, transições discretas e progresso de leitura. A rolagem é nativa; não há bloqueio ou redirecionamento do scroll. Movimento reduzido desativa as transições e o parallax. Nenhuma biblioteca de animação foi adicionada.

## Fotografias e contexto

Foram mantidas as sete fotos autorizadas do catálogo, sem mudar `rightsStatus`, `credit`, `sourcePage` ou o filtro de autorização.

| Fotografia | Uso e contexto |
| --- | --- |
| Luana e Carlos sob os arcos | Abertura e galeria; Solar Opará confirmado |
| Jardim e salão à noite | Apresentação do espaço e galeria; Solar Opará confirmado |
| Preparativos de Mariana e Renato | Galeria; local não confirmado como Solar Opará |
| Preparativos de Emanuely | Díptico e galeria; local não confirmado como Solar Opará |
| Chegada de Mariana à cerimônia | Galeria; fora do Solar Opará |
| Abraço na cerimônia de Mariana e Renato | Díptico e galeria; fora do Solar Opará |
| Cerimônia religiosa de Perssew e Emanuely | Galeria; fora do Solar Opará |

As duas imagens confirmadas do espaço não foram transformadas em vários cenários fictícios. As demais fotos aparecem como histórias de casamento com indicação de contexto, inclusive nas legendas da galeria. O Instagram oficial não disponibilizou novas imagens verificáveis no acesso público desta revisão; nenhuma autorização adicional foi presumida.

## Funcionalidade e acessibilidade

Supabase, `fetchBusyDates`, seleção de datas, validação, envio, conflitos e mensagens de erro mantêm o contrato existente. Não houve mudança de schema. Os campos agora expõem `aria-invalid` e associam suas mensagens de erro por `aria-describedby`.

A galeria mantém anterior/próxima, teclado, Escape, swipe, contador, legenda, crédito, imagem maior e retorno de foco. O menu fecha após navegação, Escape e transição para desktop. Skip link, foco visível e semântica foram preservados.

## Organização

`App.tsx` coordena a página. `Hero`, `About`, `Experiences`, `EditorialBreak`, `Visit` e `Footer` contêm capítulos de apresentação. `Gallery`, `BookingFlow`, `Header` e `SiteEffects` mantêm suas responsabilidades. O CSS foi separado em base, seções, galeria e reserva. O painel administrativo e os outros projetos permanecem fora do escopo.

## Verificação antes da publicação

- `npm install`: dependências verificadas, nenhuma vulnerabilidade reportada pelo npm.
- `npm run build`: TypeScript, catálogo de mídia e compilação aprovados.
- Playwright: 40 testes aprovados; 93 combinações de projeto ignoradas intencionalmente. Cobertura nas seis resoluções solicitadas e também em 320×740.
- Axe: nenhuma violação WCAG A/AA detectada nos cenários verificados da página e do lightbox, em desktop e celular.
- Menu, oito filtros, ver mais, lightbox, teclado, swipe, foco, fallback de imagem, movimento reduzido, calendário, datas ocupadas, seleção, validação, envio simulado, conflitos e recuperação de falha de consulta verificados.
- Envio de formulário testado com a API interceptada; nenhuma solicitação fictícia foi criada em produção.

## Performance

As imagens continuam com variantes WebP de 480, 800 e 1200 pixels. `sizes` acompanha o enquadramento e as larguras de cada posição da galeria. Somente a imagem de abertura recebe prioridade alta e preload. As demais fotos usam carregamento tardio; a imagem maior seguinte só é antecipada com o lightbox aberto. Dimensões e proporções reservam espaço para evitar saltos de layout.

O build desta revisão tem aproximadamente 105,3 kB de JavaScript e 10,8 kB de CSS comprimidos. As três fontes utilizadas somam cerca de 80,9 kB, servidas pelo próprio site. Os números são de artefatos de build, não uma pontuação Lighthouse. Capturas e métricas de navegador ficam fora do Git, em `.qa/premium`.

Publicação destinada à branch `solar-opara-public-railway`, no serviço existente `solar-opara-public` do projeto Railway Solar Opara. A entrega deve observar `SUCCESS` e validar a URL real: https://solar-opara-public-production.up.railway.app/.
