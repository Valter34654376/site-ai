# Acervo visual do Solar Opará

O catálogo está em `src/data/media-catalog.json`. O site usa exclusivamente as
fotografias autorizadas de `media`; `references` é pesquisa interna e não entra
na galeria. Origem, créditos, contexto de localização, data, autorização,
dimensões e variantes ficam registrados por fotografia.

## Escopo confirmado em 13/11/2026

- Sete fotografias Oliver Fotos que já eram utilizadas pelo site. O responsável
  confirmou nesta conversa ter autorização do fotógrafo para essas fotos.
- Arquivos disponíveis no CDN do fotógrafo: 1200 × 800. São arquivos de
  publicação, não os originais de câmera. Nenhuma resolução foi inventada.
- Derivados WebP de 480, 800 e 1200 pixels, sem ampliação, com proporção
  preservada e EXIF removido. O maior derivado serve ao lightbox.
- O hero mostra o jardim e o salão à noite. Seu primeiro fallback é uma segunda
  fotografia local real, do casamento de Luana e Carlos. O monograma só é usado
  se as fotografias também falharem; uma última falha oculta o elemento.
- Os registros em igreja e os preparativos com localização não confirmada são
  identificados no catálogo e no lightbox. Não apresentam ambientes externos
  como instalações do Solar.
- Crédito individual ou da equipe preservado conforme os álbuns de origem.
  Equipe do álbum não significa autoria individual confirmada de cada quadro.

## Levantamento do Instagram oficial

Fonte: <https://www.instagram.com/solaroparaoficial/>.

A página pública foi consultada sem login, ferramentas de download de redes
sociais, APIs privadas, paginação automatizada ou contorno de proteção. O meta
público informa 173 publicações, mas não expõe os links dos posts nesse acesso.
A busca pública também não retornou posts verificáveis. O controle de navegador
conectado à sessão estava indisponível.

**Não foi possível concluir o inventário das 173 publicações.** Essa contagem
não representa 173 fotografias verificadas; carrosséis e vídeos podem alterar o
total real de mídia. Nenhuma URL de post, legenda, data ou crédito foi inventada.
As sete fotografias locais provêm dos álbuns autorizados de Oliver Fotos, e não
de um download do Instagram oficial.

Para ampliar o acervo, é necessário receber a exportação do perfil ou originais
autorizados, com a relação das publicações e os créditos quando disponíveis.
A autorização desta tarefa não foi estendida aos demais álbuns Oliver Fotos,
à fachada encontrada no Mindtrip ou a outras imagens de terceiros.

## Atualização do acervo

1. Registre a autorização de cada nova foto e sua origem no catálogo. Preserve
   `instagramPost: null` quando a publicação relacionada não for conhecida.
2. Use apenas fontes efetivamente autorizadas. `scripts/prepare-media.py` lê o
   catálogo, baixa suas fontes conhecidas com concorrência limitada a três e
   gera derivados sem ampliação. Requer Pillow. Os arquivos de origem ficam
   em `.qa/originals`, ignorado pelo Git.
3. Preencha categoria, texto alternativo factual, legenda, créditos e contexto.
   Os slots `hero`, `wedding`, `garden` e `detail` selecionam destaques.
4. Ao trocar o hero, atualize o preload de `index.html`; o validador verifica o
   vínculo. A imagem social em JPEG tem 1200 × 630 e é derivada da fotografia
   autorizada `solar-celebracao-01`.
5. Rode `npm run build` e `npm run test:e2e`. Não publique arquivos de `.qa`,
   resultados dos testes, `.env` ou credenciais.

## Verificação

`npm run build` exige TypeScript e validação dos arquivos do catálogo antes do
Vite. `npm run test:e2e` usa Chromium isolado, cinco tamanhos de tela, Axe,
capturas locais e interceptação das chamadas de reservas. Os envios nos testes
são simulados; nenhum pedido fictício é gravado no Supabase.

Para validar o deploy real em modo somente leitura, a suíte aceita `BASE_URL`.
Os testes de envio continuam interceptados; a verificação específica de
produção consulta apenas a visão pública de datas ocupadas e a imagem social.
