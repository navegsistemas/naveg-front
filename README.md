# naveg-front

Agência virtual da **NAVEG — Turismo e Logística**. Single page institucional com uma seção inteira dedicada ao
**totem de reserva**.

A Fase 1 gera **reservas**, não vendas: o totem grava um pedido no Firestore e entrega o código ao atendimento
pelo WhatsApp, que emite a passagem pelo aplicativo. A venda online com cadastro é Fase 2.

## Estado

| passo | o que é | estado |
|---|---|---|
| 0 | Esqueleto do monorepo e ADRs | ✅ |
| 1 | `@navegsistemas/design-system` — tokens, base, marca, ícones | ✅ |
| 2 | `apps/agencia` — casca Astro da single page | ✅ |
| 3 | Seção Capa — proposta, credenciais e a vitrine da flotilha | ✅ |
| 4 | Seção Atendimento — o argumento e quem atende | ✅ |
| 5 | Seção Avaliações — a vitrine e as redes da Meta | ✅ |
| 6 | Rodapé — identificação, contatos, endereços e o que a lei exige | ✅ |
| — | **A página institucional está completa e publicável, sem uma linha de Firebase** | 🏁 |
| 7 | `@navegsistemas/domain` — a reserva, o roteiro do totem, o catálogo do fluviapp, o código `NVG-` e o codec | ✅ |
| 8 | Seção Totem — a ilha React, com catálogo de demonstração e porta em memória | ✅ |
| 9 | `GET /catalogo` — o catálogo do fluviapp, lido pelo servidor e recortado pela concessão | ✅ |
| 10 | `POST /reservas` — a escrita, com conta de serviço, Turnstile e limite por IP | ✅ código · ⏳ ligar |
| 11–13 | WhatsApp (✅ 2026-09-25); no aplicativo, a reserva vira passagem + deeplink; endurecimento | — |

O plano completo, passo a passo, está em [`docs/plano-de-implementacao.md`](docs/plano-de-implementacao.md).

## Retomar daqui

**2026-10-09: a 1.3 está no ar como calendário (#49), e o PO segue agora pelo fluviapp-kmp.**

- **Próximo passo aqui (pedido do PO, 2026-10-09):** as fases do totem **depois da escolha da saída** — o que vai
  embarcar, os dados, a conferência e a conclusão —, pelo ritual do roteiro (a etapa 2, §4). O PO retoma primeiro
  no fluviapp-kmp, onde está o arcabouço das ocorrências até 90 dias.
- **Espera outro repositório:** as ocorrências até 90 dias e a lotação vêm desse arcabouço, e depois pela API
  (`/catalogo`). A issue na API sai quando o desenho do KMP fechar.
- **A prévia de PR usa o catálogo de demonstração** (decisão do PO, 2026-10-09). A API só libera o CORS para a
  homologação, e a prévia de cada PR tem endereço próprio. Na Vercel, `PUBLIC_URL_DA_API` vale `demonstracao` para
  as prévias em geral e a URL da API **só para o branch `main`** (a homologação). O catálogo real se confere na
  homologação, depois do merge. A CLI não separa as duas variáveis de mesmo nome (`env rm`/`update` dão
  `multiple_envs`): mudar uma delas é pela API REST da Vercel, pelo id. E valor de variável pelo Git Bash: pelo
  PowerShell 5.1 entra um BOM.
- **Na máquina (2026-10-09):** `gh` e `vercel` instalados e logados; falta o PO rodar
  `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` (o perfil com o `NPM_TOKEN` só roda depois) e
  `gh auth refresh -s read:packages` (a API precisa para o `npm ci`).
- **Esperam o PO, além disso:** conferir a 1.1 e a 1.2 no celular, na homologação; promover a API (a `main` dela
  está à frente da homologação, ver o "Retomar daqui" de lá); os grupos pequenos do Dependabot (#46 aqui, #23 na
  API). O major do TypeScript 7 segue parado de propósito (`CLAUDE.md`).
- **O contexto do Claude mora no repositório** (#47 aqui, naveg-api-vercel#24): `CLAUDE.md` e as skills em
  `.claude/skills/`. Numa máquina nova: clonar, rodar `/preparar-maquina` e depois `/retomar`.

**A interface (a 7.1)**, pelo [roteiro de UI/UX](docs/roteiro-de-ui-ux.md), seção por seção (a ficha de cada uma
está no §10):

- **1.1, topo e menu — no ar** (#41 a ficha, #43 a implementação): o topo com 60px em toda largura e preso ao
  rolar; o menu com Encomendas, Atendentes, Social e Contato, recolhido abaixo de 44rem (704px) num `<details>`
  nativo; a rolagem suave que chega no lugar certo ([RolagemQueChega.astro](apps/agencia/src/componentes/RolagemQueChega.astro)).
  Falta só a conferência do PO no celular, na homologação.
- **1.2, capa — no ar** (#45, 2026-10-09). Decisões de 2026-10-08:
  B, C e E aceitas; D = "Saída todos os dias"; F = só Macapá, sem Santana; A = a foto do F/B Maria Ivanir
  (original em `src/assets/embarcacoes/`) só na capa, como fundo da primeira seção, com o texto branco sobre a
  foto escurecida, e a vitrine escondida até existir a segunda foto. Falta a conferência do PO no celular.
- **1.3, reserve sua passagem — no ar** (#49, conferida pelo PO na prévia; ficha no §10 do roteiro). Decisões
  de 2026-10-09: o dia primeiro, num calendário; cada dia diz de onde o barco sai, e o sentido é filtro; 90 dias à
  vista, só a janela de 7 clicável e o resto com o WhatsApp; no computador, calendário e saídas lado a lado; um texto
  só no lugar do subtítulo e do aviso. Pedido na prévia: escolhido o dia, a página leva até as saídas (no celular
  elas ficam abaixo do calendário). O dia lotado (riscado) espera a API saber da lotação. O quiosque não muda.
- **Guardado para seções futuras:** recolher seções no celular (1.5/1.6/1.7); na 7.4, "Minha conta" como 5º
  item pode não caber no tablet de 768px — remedir o ponto de recolher.

Também em 2026-10-08: o RUNBOOK (13.5, #38), o Lighthouse no CI (13.6, #39, mais firme no #42), o `npm audit fix`
(#40) e, na API, o limite de 20 reservas por IP (naveg-api-vercel#22) — que, como o Hono 2, **só chega à
homologação na próxima promoção**; conferir o catálogo e uma reserva gravada logo depois.

**2026-10-06: a venda online entrou no MVP** (a entrega 7 do KMP, fluviapp-kmp#39): conta do cliente e compra
com PIX e cartão pelo Mercado Pago, ao lado da reserva, que não muda. O lado do site está em
[docs/plano-da-venda-online.md](docs/plano-da-venda-online.md). **O passo 13 (a entrega 6), feito já com a
compra em mente, fecha com a 13.6**: da 13.1 à 13.5 (cabeçalhos e CSP, teclado e sem JavaScript, imagem de
compartilhamento e sitemap, a política de privacidade e o [RUNBOOK](docs/RUNBOOK.md)) estão mergeadas, e a 13.6,
o Lighthouse no CI, está feita. O e-mail do domínio está pronto desde 2026-10-07 (o encarregado responde em
privacidade@gruponaveg.com.br, testado pelo PO). **Depois dele, a interface (a 7.1), com calma**, pelo [roteiro de UI/UX](docs/roteiro-de-ui-ux.md):
seção por seção, começando pelas seções vigentes (a 1.1, topo e menu). Ordem decidida pelo PO em 2026-10-06. Um
achado com prazo: a conta não funciona
nos endereços `*.vercel.app`, e a homologação precisa de subdomínios de `gruponaveg.com.br` antes da 7.4 (U8).

**2026-10-05: a reserva de encomenda vai ao ar** — a entrega 3 do plano do MVP do KMP (`docs/plano-do-mvp.md`
lá): o domínio 0.6.0 com a `ReservaDeEncomenda` no codec, a API gravando, e a seção "Envie sua encomenda" na
página. **Provado de ponta a ponta no mesmo dia, pelo PO:** a encomenda reservada na homologação foi gravada em
`reservas` (`categoria: ENCOMENDA`), apareceu em Reservas no painel do KMP e foi recebida como encomenda pelo
botão Receber. **Próxima, pelo plano do MVP:** a 4 e a 5 (o caixa por viagem) são do KMP; aqui, a 6 — o resto do
endurecimento e a política de privacidade. Em 2026-10-02 entraram os majors do Dependabot,
menos o TypeScript 7. Em 2026-10-01 o passo 12 fechou no KMP e o 13 começou pelo E2E da reserva. Em 2026-09-25 o passo 11 tinha
fechado com o caminho inteiro funcionando: o cliente reserva no totem de
homologação, a API grava sob as Rules do `fluviapp-kmp`, e o botão **"Enviar ao atendimento"** abre o WhatsApp
da NAVEG, `(91) 99203-5322`, com a reserva escrita. O atendente acha a reserva pelo código no painel do KMP.
Provado de ponta a ponta nesse dia.

**Como está no ar** (plano de ambientes, §3):

- **Homologação do front:** `naveg-front-agencia.vercel.app`, o preview da `main`, atrás do login da Vercel.
- **A API:** `naveg-api-vercel.vercel.app`, o deploy de *produção*, sobre o `fluvi-app-dev`. Faz as vezes de
  homologação até o lançamento, por decisão (D4). Os domínios entram juntos, um por ambiente. **O merge na
  `main` da API não chega a ele:** gera um *Preview*, e quem tem acesso promove o deploy do merge
  (`vercel promote`). Foi assim com o #17 da API, em 2026-10-05.
- **Variável `PUBLIC_…` nova no front:** só vale num build novo **do preview da `main`**. Chave nova na API: só
  vale num build novo de cada ambiente. Trocar uma chave é colar a nova, refazer os builds, e só então apagar a
  antiga.

**O que confere cada PR:** `verificar`, `build e orçamento`, `e2e da reserva` (obrigatório na `main` desde 2026-10-01) e `contrato com o
fluviapp` (54 cenários contra o Kotlin do KMP e do app legado, nenhum pulado) e `lighthouse` (desde 2026-10-08) aqui; `verificar`, `auditoria`, `emulador` (a gravação de ponta a
ponta sob as Rules) e `fumaca` (cada deploy responde de verdade) na API. `npm run verify` roda **494 cenários**,
um pulado, e pede **Node 22.22.2 ou mais**: abaixo disso o jsdom 30 deixa 7 cenários de tela do totem
vermelhos (`useId` nulo) só na máquina, porque o CI já usa o Node 22 mais novo. O orçamento está em 65,8 kB de runtime e 25,7 kB de
ilhas e carregador, de um teto que subiu de 20 para 25 com a segunda ilha e para 28 com o calendário da 1.3 (`npm run conferir:build`). `npm run e2e` dá cenários em 4 navegadores (Chromium e WebKit, desktop e celular), 66 execuções e 6 puladas;
na primeira vez, `npx playwright install chromium webkit`.

**A política de segurança (13.1):** toda página sai com uma `Content-Security-Policy` própria, que o Astro
escreve no build com os *hashes* do que vai dentro dela — a base é "só o site e a API", e a página que precisa
de mais soma no próprio arquivo (hoje, as duas com o totem somam o Turnstile). As regras estão em
[seguranca.ts](apps/agencia/src/conteudo/seguranca.ts); os cabeçalhos que a `<meta>` não alcança
(`frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) em
[vercel.json](apps/agencia/vercel.json). O `conferir:build` barra página sem política, `'unsafe-*'`,
`style=""` e trecho sem hash; o E2E falha em qualquer violação que o navegador acuse.

**Toda página, para todo mundo (13.2):** cada rota de [e2e/rotas.ts](e2e/rotas.ts) passa pelo axe (WCAG 2.2 AA,
com as ilhas hidratadas), pelo teclado (o primeiro `Tab` é o "Pular para o conteúdo") e pelo sem-JavaScript (o
título, e cada ilha trocada por um aviso com o WhatsApp). Página nova entra no CI só por entrar na lista. O totem
tem ainda a reserva inteira só no teclado, com o foco indo para a pergunta de cada passo.

**O que o site diz para fora (13.3):** o endereço oficial é `https://gruponaveg.com.br`, sem `www` (D4,
confirmado pelo PO em 2026-10-07), em [site.ts](apps/agencia/src/conteudo/site.ts) — dele saem o canônico, o
cartão do link, o JSON-LD, o `sitemap.xml` e o `robots.txt`. O cartão é a
[compartilhamento.png](apps/agencia/public/compartilhamento.png), gerada a partir do logo por
`npm run gerar:compartilhamento`; troca quando chegar a foto de uma embarcação. O `robots.txt` não proíbe nada: o
que fica fora da busca leva `noindex` na própria página. O `conferir:build` exige que o `sitemap.xml` tenha toda
página sem `noindex`, e só elas — a lista mora em [meta.ts](apps/agencia/src/conteudo/meta.ts).

**Quando algo falha (13.5):** o [RUNBOOK](docs/RUNBOOK.md) parte do sintoma — reserva barrada, catálogo
atrasado, gravação recusada —, diz onde olhar e o que fazer, e traz a troca de cada chave e a promoção da API. A
seção da venda online tem só os títulos, preenchidos na 7.6. **O quiosque físico carrega o catálogo uma vez:**
depois de mudar o cadastro, recarregar a página dele.

**A política de privacidade (13.4):** em [`/privacidade`](apps/agencia/src/pages/privacidade.astro), do site de
hoje, com versão e data no topo ([privacidade.ts](apps/agencia/src/conteudo/privacidade.ts)). O controlador é o
MEI do PO, e o encarregado é o próprio PO, em privacidade@gruponaveg.com.br. Enquanto houver pendência — a anonimização
(naveg-api-vercel#21), a encomenda sem destinatário (fluviapp-kmp#41) e a revisão jurídica —, a página se declara
rascunho no topo e marca cada uma onde a promessa é feita. A conta e a compra estão num
[rascunho à parte](docs/rascunho-da-privacidade-da-conta-e-da-compra.md), para a mesma revisão (U7).

**O passo 12 está feito no KMP** (fluviapp-kmp#11 e #22): o atendente emite a partir da reserva, no Desktop e no
celular, e a reserva vira `CONVERTIDA` com o evento. O que sobrou dele espera o domínio, sem urgência.

**O passo 13, endurecimento, está em andamento.** Feito: o **E2E da reserva** (`e2e/`), com o Turnstile de
verdade e a API respondida pelo teste. Depois, da 13.1 à 13.5: os cabeçalhos, o
teclado, o sem-JavaScript e o axe, meta, a política de privacidade e o `RUNBOOK`; e o Lighthouse (13.6).

**O Lighthouse (13.6):** cada rota de [e2e/rotas.ts](e2e/rotas.ts), no perfil de celular, com **90 ou mais** em
desempenho, acessibilidade, boas práticas e SEO — a mediana de três medições
([conferir-lighthouse.mjs](scripts/conferir-lighthouse.mjs), `npm run conferir:lighthouse`, que faz o próprio
build). O build medido é o de demonstração, para a régua não depender da API; e a página com `noindex` (o
quiosque) não perde ponto por não ser indexável. Medido em 2026-10-08: tudo 100, menos o desempenho do `/totem/`,
96.

**A reserva de encomenda** (a carga do plano do ERP do KMP, E3 e M6) tem plano próprio, em
[docs/plano-da-reserva-de-encomenda.md](docs/plano-da-reserva-de-encomenda.md): uma seção à parte, com item na
barra superior e botão na capa, que vai ao ar já com a reserva gravada, depois das regras de `reservas` no KMP.
Decidido pelo PO: o nome é "Encomendas"; tipo do volume por lista e peso por faixa; celular do destinatário
obrigatório; quem manda pode ser quem retira (o motorista), e aí o celular dele é obrigatório; o quiosque fica só
com passagem. Há um wireframe para análise (privado do PO, em claude.ai).

- **Feitas aqui, na `main`:** a 1, o plano (#24), e a 2, o roteiro, a montagem e a mensagem no domínio (#25).
- **Feitas no KMP:** a 4, a encomenda no balcão (fluviapp-kmp#33 e #34), e a 5, as regras de `reservas` e o painel
  (fluviapp-kmp#36, 2026-10-05): em Reservas, o botão Receber abre Cargas com "Receber encomenda" preenchido.
- **Feitas juntas, em 2026-10-05, a 3 e a 6** (a entrega 3 do plano do MVP): o domínio 0.6.0 (a
  `ReservaDeEncomenda` na união, o codec com as chaves do `ReservaDocumento.kt`, as pendências da encomenda no
  `pendenciasDaReserva`, a conversão por `encomendaId`, o pedido HTTP com `encomenda` no lugar de `respostas`, e o
  `enviarEncomenda`); a API gravando, com o emulador contra as regras do KMP; e a seção, o item "Encomendas", o
  botão "Enviar encomenda" e o texto da capa, com o E2E da jornada. O quiosque segue só com passagem.
- **Aplicadas como estavam propostas:** a validade (até a partida), o mesmo WhatsApp do atendimento e o texto da
  capa ("passageiros, veículos e encomendas"). Toda saída aceita encomenda (C7) foi confirmada pelo PO.

**Pendências, registradas nos planos:**

- **Na org, a fazer por quem administra:** 2FA obrigatório, push protection, e o `CODEOWNERS`, que espera saber
  quem responde por segurança.
- **Na API:** a trava ambiente × projeto, com a exceção da homologação provisória.
- **Esperando o domínio de produção, sem urgência:** a linha "Abrir no app" na mensagem, a página `/r/{codigo}`
  (D9), e o App Link no app móvel do KMP com o `assetlinks.json`.
- **Esperando a data do quiosque:** o QR do link na conclusão.
- **Majors do Dependabot:** aqui, Astro 7, `@astrojs/react` 7, Vitest 5, jsdom 30 e `upload-artifact` 7 entraram
  em 2026-10-02. **O TypeScript 7 (#13) fica parado**, por dois motivos: o `e2e/tsconfig.json` precisa declarar
  `"types": ["node"]` (do TypeScript 6 em diante, nenhum `@types` entra sem ser pedido; a correção está pronta e
  vale também no 5.9), e o `astro check` recusa o 7.0. O suporte do Astro, experimental, só vem com o 7.1.
  Na API, Hono 2 (#20, no lugar do #12 do Dependabot) e Vitest 5 (#16) entraram em 2026-10-05; o TypeScript 7
  (#10) espera a mesma linha no `tsconfig.json` (`"types": ["node"]`), e lá não há Astro para barrar.
- **Atenção na próxima promoção da API:** a homologação está no deploy do #17 (a encomenda). A próxima promoção
  leva junto a troca do ponto de entrada para o Hono 2 (`getRequestListener` no lugar do `@hono/node-server/vercel`)
  e o Vitest 5. A fumaça do preview do #20 passou com o adaptador novo; mesmo assim, **conferir a homologação logo
  depois de promover** (o catálogo carregando e uma reserva gravada), com o `vercel rollback` à mão se algo falhar.
- **Overrides de segurança na API** (`grpc-js` e `uuid`): saem quando o `firebase` e o `firebase-admin` subirem
  essas dependências — conferir com `npm ls @grpc/grpc-js` a cada atualização (README da API).
- **Vencimentos:** as chaves das contas `naveg-api-leitura` e `naveg-api-escrita`, por volta de 2026-12-24; o
  `FLUVIAPP_LEITURA_TOKEN` (segredo da org) e o `DEPENDABOT_NPM_TOKEN` da API, por volta de 2026-12-24 também
  (90 dias).

Os cenários que leem o Kotlin do fluviapp procuram o `fluviapp-kmp` em `~/AndroidStudioProjects/fluviapp-kmp`
(ou `FLUVIAPP_KMP`) e o app Android em `~/Documents/AndroidStudioProjects/fluviapp` (ou `FLUVIAPP_ORIGINAL`).
Sem o checkout eles aparecem como **pulados** na máquina; no job `contrato` do CI, a ausência é **falha**.

**Decisões de 2026-09-22, já aplicadas:**

- **O totem não autentica e não exige documento.** Recolhe só a passagem pedida — travessia, categoria,
  acomodação, tipo, quantidade de pessoas, natureza e classe do veículo (e a cilindrada da moto, que muda a
  tarifa) — e o **cliente**: nome, e telefone **opcional**. A finalização leva ao atendimento pessoal pelo
  WhatsApp, e é lá que documento, nascimento e placa são recolhidos. Autenticação é da Fase 2.
- **Sem autenticação nenhuma no Firebase** (a opção 2 da emenda do ADR-0002): o provedor anônimo **não** é
  ligado, e as Rules do fluviapp ficam como estão. A regra de `reservas` admite `create` sem `request.auth`.
- **O fuso da operação é `America/Belem`** (`conteudo/operacao.ts`). Manaus entra depois; quando entrar, o
  fuso passa a ser do porto.
- **O catálogo é reconstruído diariamente**, com disparo manual quando o cadastro mudar.

**A agência tem servidor próprio, em repositório separado** (decisão de 2026-09-22, [segunda emenda do
ADR-0002](docs/adr/ADR-0002-a-escrita-client-side-e-o-que-a-protege.md)): a
[`naveg-api-vercel`](../naveg-api-vercel), Hono na Vercel. O navegador não fala mais com o Firestore.

```
navegador → GET  /catalogo   → naveg-api-vercel → Firestore (conta de serviço, leitura)
navegador → POST /reservas   → naveg-api-vercel → Firestore (conta de serviço, escrita)
```

Isso apaga do plano a autenticação anônima, o App Check, a regra pública de `create` no `firestore.rules` do
fluviapp, o catálogo gerado no build e o rebuild diário — e tira o SDK do Firebase do bundle. A página
institucional continua **inteiramente estática**; em compensação, aparece **CORS**, que não existiria se a API
fosse do mesmo domínio.

**O esqueleto da API já existe** (Hono, configuração que falha na partida, CORS, forma do erro, `GET /saude`,
6 cenários verdes), e o `@navegsistemas/domain` já está preparado para o GitHub Packages — ver "Publicando o
`@navegsistemas/domain`" abaixo.

**O que destravou o passo 9** não era código, e caiu todo em 2026-09-23:

1. ~~mover os dois repositórios para a org~~ **feito.** Os dois estão na `navegsistemas` — a `naveg-front` foi
   transferida (`github.com/kurtmatheus/naveg-front` hoje é só um redirecionamento) e a `naveg-api-vercel`
   subiu em 2026-09-23. **O escopo do pacote passou a ser `@navegsistemas`**, porque o GitHub Packages exige
   que ele seja o nome da org, e a org que existe é a `navegsistemas`, não uma `naveg`;
2. ~~um PAT clássico com `read:packages` como `NPM_TOKEN`~~ **feito** (2026-09-23). O token lê o pacote.
   Dentro da `naveg-api-vercel` o `.npmrc` lê `${NPM_TOKEN}` **do ambiente** — token só no `~/.npmrc` dá 401
   lá; o terminal precisa exportar a variável;
3. ~~publicar o `@navegsistemas/domain` 0.1.0~~ **feito.** O workflow da tag `domain-v0.1.0` publicou;
4. ~~as duas contas de serviço e o `NAVEG_EMPRESA_ID`~~ **feito.** As contas `naveg-api-leitura` e
   `naveg-api-escrita` existem no `fluvi-app-dev`, e as chaves, o `NAVEG_EMPRESA_ID` e o `NPM_TOKEN` estão nas
   variáveis da Vercel. O roteiro, para quando for preciso refazer (troca de chave, projeto de produção), está
   no README da [`naveg-api-vercel`](../naveg-api-vercel), em "As contas de serviço".

**Decisão de 2026-09-23: o projeto Firebase é o `fluvi-app-dev`, e tudo é tratado como dev por enquanto.** É o
único projeto que o aplicativo conhece (`.firebaserc` e `google-services.json`); o `naveg-app-homol` não é
destino. As contas, as chaves e as variáveis da Vercel nascem ali, com nome de dev. Quando houver projeto de
produção, **nada disto migra**: contas novas, chaves novas, variáveis novas — e as de dev nunca vão para o
ambiente de produção.

**O próximo é o passo 10: `POST /reservas`.** A decisão que ele pedia já foi tomada (2026-09-23): o
`enviarReserva` e a porta `ReservaRepositorio` **mudaram-se para o `@navegsistemas/domain`**, o único pacote
publicado — a API grava pelo mesmo caso de uso que o totem. O `@navegsistemas/dados` fica só com o que é do
front: a `FonteDoCatalogo`, o `catalogoHttp` e os adaptadores em memória.

Sem rede, `PUBLIC_URL_DA_API=demonstracao npm run dev` roda o totem inteiro contra o catálogo de demonstração.

O que está pendente de dado — fotos, nome e WhatsApp do atendente, depoimentos, URLs das redes, identificação
da empresa — continua sendo conteúdo, entra em arquivo de `conteudo/` e **não bloqueia nenhum passo
adiante**.

**O repositório é público** desde 2026-09-23, porque o plano Hobby da Vercel não deploia repositório
**privado** de organização — e a intenção é hospedar front e API lá. O histórico foi varrido antes de abrir:
nenhum `.env`, chave de serviço ou credencial embutida, em nenhum commit de nenhum branch. O que protege o
projeto daqui para frente é que segredo nenhum entra no repositório: tudo mora nas variáveis de ambiente da
Vercel, e o `dist/` é varrido no CI.

**O projeto antigo saiu daqui.** As branches `master`, `dev`, `dev-typescript` e `test` eram de 2022–2023 e
não tinham parentesco nenhum com este código — 26 commits de uma história separada, que a reescrita não
continua. Foram para [`naveg-front-legado`](https://github.com/navegsistemas/naveg-front-legado) (privado,
padrão `dev`, que contém `master` e `test`; `dev-typescript` tem um commit só dela). Aqui só existe `main`.

## Comandos

```bash
npm install
npm run dev         # a página em http://localhost:4321
npm run build       # gera apps/agencia/dist
npm run verify      # typecheck + astro check + cenários
npm run conferir:lighthouse   # build de demonstração + Lighthouse de cada rota, no celular
npm test            # só os cenários

npm run publicar:domain -- --ensaio   # monta o pacote publicável, sem publicar
npm run publicar:domain               # publica o @navegsistemas/domain no GitHub Packages
```

### Publicando o `@navegsistemas/domain`

O domínio é consumido de dois jeitos, e eles pedem coisas diferentes:

- **aqui dentro**, por symlink de workspace, como **TypeScript-fonte** — é o que faz o Astro e o Vite
  compilarem o domínio junto com o app, sem passo de build no meio;
- **de fora** (a [`naveg-api-vercel`](../naveg-api-vercel)), como **JavaScript compilado com tipos**, porque Node não
  executa `.ts`.

O `publishConfig` do npm promete resolver isso sozinho, sobrescrevendo o `exports` na publicação — e **não
resolve**: conferido, o manifesto do tarball sai com o `exports` de desenvolvimento, e o pacote quebra na
primeira importação, só no servidor. Por isso existe o `scripts/publicar-domain.mjs`, que monta o manifesto de
publicação explicitamente e publica de um diretório de preparo. O ensaio (`--ensaio`) empacota sem publicar,
para conferir o que vai.

**Para publicar uma versão:**

```bash
npm version --workspace @navegsistemas/domain patch --no-git-tag-version   # ou minor/major
git commit -am "domain 0.1.1"
git tag domain-v0.1.1
git push && git push --tags
```

A tag dispara [`.github/workflows/publicar-domain.yml`](.github/workflows/publicar-domain.yml), que roda o
`verify`, confere que a tag e a versão dizem a mesma coisa, e publica com o `GITHUB_TOKEN` do próprio
workflow. Publicar da máquina também funciona (`npm run publicar:domain`), desde que o `~/.npmrc` tenha um
token com `write:packages`.

> **O escopo precisa ser o dono do repositório.** O GitHub Packages publica `@navegsistemas/domain` porque o
> `naveg-front` pertence à organização `navegsistemas`. Foi essa regra que decidiu o nome do escopo: não existe
> org `naveg`, e inventar uma só para casar com um escopo mais curto custaria mover os repositórios de novo e
> deixar para trás o resto do que a empresa já tem lá.

### O orçamento

A página institucional não baixa **nenhum arquivo de JavaScript até alguém rolar até o totem**. A única ilha é o totem,
com `client:visible`: o código dele só desce quando a seção entra na tela. No quiosque (`/totem`) ele é
`client:load`, porque lá o totem **é** a página. Sem JavaScript, a seção diz para falar com o atendimento.
A exceção, desde a 1.1 (2026-10-08), são dois scripts pequenos, dentro da própria página e com *hash* na política,
somando cerca de 1 kB: o que fecha o menu do topo ao tocar num item, e o que faz a rolagem suave chegar ao
lugar certo (`RolagemQueChega.astro`). Sem eles, o menu abre e fecha, e a âncora salta.

Medido em 2026-09-25, com o envio pela API e o Turnstile (no passo 9, a ilha tinha 10,9 kB de gzip):

| o quê | bruto | gzip | teto (gzip) |
|---|---|---|---|
| a ilha — domínio, telas e o totem | 41,4 kB | 13,9 kB | 20 kB, somada ao carregador |
| o carregador de ilhas do Astro | 8,2 kB | 3,2 kB | ↑ |
| o runtime do React 19 (`react-dom`) | 215,6 kB | 67,1 kB | 70 kB |

**O CI confere os tetos em todo pull request** (`npm run conferir:build`, em
[`scripts/conferir-build.mjs`](scripts/conferir-build.mjs)), junto com duas outras coisas: nenhum
`<script src>` no HTML, e nada com cara de credencial no `dist/`. Subir um teto é decisão: muda-se o número no
script, com o motivo no commit.

O que pesa é o runtime, não o totem: a ilha sozinha fica perto da referência do totem do fluviapp web
(15 kB / 5,4 kB, sem o React). Se os 67 kB incomodarem no celular de quem rola até a seção, a troca por
`@astrojs/preact` com `compat` é interna à integração — os componentes não mudam — e cortaria o runtime para
poucos kB. Fica registrado como opção, não feito.

**Inclusive o carrossel.** A vitrine da flotilha, na capa, gira sozinha em CSS: uma `@keyframes` sobre o trilho,
com uma cópia do primeiro item no fim da fila para o laço não ter emenda. Os percentuais são **derivados da
quantidade de embarcações** (`quadrosDaVitrine`), não escritos — acrescentar um barco acerta a animação sozinho.
O controle de pausa que a WCAG 2.2.2 exige é uma caixa de seleção nativa, e `prefers-reduced-motion` troca o
desfile por uma grade com as três à vista.

As fotos entram em [`apps/agencia/public/embarcacoes/`](apps/agencia/public/embarcacoes/LEIA-ME.md) — até lá, a
vitrine desenha um wireframe que mostra o nome do arquivo que espera.

## Arquitetura

Monorepo npm workspaces, no molde do `fluviapp` web: domínio puro em TypeScript, design system que não conhece
o domínio, telas controladas sem estado de aplicação, e Astro estático com **ilhas React só onde a tela
responde** — na prática, só o totem.

```
packages/design-system/   tokens, base.css, marca, ícones.   Sem React, sem domínio.
packages/domain/          o domínio da reserva.              Sem React, sem Firebase.
packages/ui/              as telas do totem, controladas.     Sem estado de aplicação.
packages/dados/           as portas e os adaptadores.         Em memória; Firestore no passo 10.
apps/agencia/             a single page em Astro.
```

### A página é uma lista

A ordem das seções, os títulos e o menu saem todos de `apps/agencia/src/conteudo/secoes.ts`. A navegação **não
é escrita**, é derivada — acrescentar uma seção é uma entrada na lista, e a página e o menu não têm como
divergir porque não são duas coisas. A alternância de fundo vem do índice, não de um `faixa--alt` escrito seção
a seção.

### A cor mora em um lugar só

`packages/design-system/src/tokens.css` é o **único** arquivo do repositório que pode conter um valor de cor —
há um cenário que varre `src/` e falha se aparecer outro. Os tokens têm duas camadas, e a fronteira é
verificável: **todo semântico é um `var(...)`, todo primitivo é um valor literal**.

### O laranja não é tinta

As cores canônicas são as do arquivo oficial do logo: laranja `#FA8B17`, azul-marinho `#103A5B`. O laranja da
marca dá **2,42:1** com branco, quando o mínimo para texto é 4,5:1 — então ele é **preenchimento**, e quem
escreve em cima dele é marrom. Quando o laranja precisa ser lido, usa-se o tom derivado.

Isso não é convenção escrita num guia de estilo: `test/contraste.spec.ts` resolve cada token até o primitivo e
mede. Trocar o rótulo do botão primário para branco derruba o build.

### O totem é máquina de domínio

`roteiroDaReserva` é a adaptação declarada do `roteiroDe` do aplicativo (`RoteiroDaEmissao.kt`): **sem
`Pagamento`** (não se vende aqui), **sem nenhum passo de identificação** (quem viaja, documento, placa,
responsável — tudo isso é do atendimento pessoal) e **com `CLIENTE`**: nome, e telefone opcional. O que fica
é o que define a passagem, decidido pelas mesmas regras do aplicativo: o tipo só na rede, o subtipo só na
gratuidade, a quantidade só em suíte e camarote; no veículo, **natureza, depois classe** — a classe só é
perguntada quando há escolha naquele casco (num navio, nunca) — e a cilindrada só na moto, porque muda a
tarifa. As opções vêm dentro do nó: numa lancha, "Veículo" não é opção desabilitada, não é opção.

No aplicativo, quem limpa a resposta que ficou para trás ao trocar de escolha é o ViewModel. Aqui não há
ViewModel, então a garantia mora na leitura: **uma resposta só conta se estava entre as opções que o nó
ofereceu**, e `montarReserva` lê os nós do roteiro, não as respostas. A `'MEIA'` de uma rede abandonada não
vira meia numa suíte, a van escolhida para um ferry não vira van num navio, e a cilindrada de uma moto não
vai para o carro.

### A reserva vale até o navio partir

`expiraEm` é a partida da ocorrência escolhida — `data + horaMin` da viagem, o mesmo `ViagemSemana.partida` que
o aplicativo usa para tirar a saída da lista. A regra mora em `reserva/validade-da-reserva.ts`, sozinha, porque é
"por enquanto": quando mudar (uma antecedência para o atendimento emitir, um corte na véspera), muda ali.

### A agência é alimentada pelo fluviapp

`catalogo/` lê `viagens`, `rotas`, `portos`, `localidades`, `embarcacoes` e a concessão da agência
(`empresas/{id}/atuacoes/AGENCIAMENTO`) **como o aplicativo lê** — mesmas chaves, mesmas recusas, mesmos
padrões — e `travessiasOfertadas` faz o que o "Viagens Disponíveis" faz: recorta pela concessão, aplica a
janela de sete dias e a partida não vencida, e escreve os rótulos do mesmo jeito. A única divergência é
declarada e só esconde: a saída cuja embarcação ou porto não resolve não é oferecida ao público.

O contrato (`test/contrato-fluviapp.spec.ts`) confere contra o Kotlin do fluviapp — o `fluviapp-kmp`, e o
aplicativo Android só no que ainda não foi portado — não só os nomes dos enums,
mas **o que eles significam** — a natureza de cada classe, a carga de cada casco, a ocupação de cada
acomodação — e as chaves dos documentos que a agência lê e escreve. A primeira versão conferia só nomes, contra
o `fluviapp-kmp`, e passou verde com seis classes de veículo onde o aplicativo tem dezessete.

O codec (`paraDominio`) recusa em vez de inventar padrão: documento ilegível, estado misto (uma reserva de
passageiro com `classe`), incoerente (meia numa suíte, quatro pessoas num camarote, moto sem cilindrada).

## Decisões

- [ADR-0001 — A reserva é um tipo próprio, não um estado da passagem](docs/adr/ADR-0001-a-reserva-como-tipo-proprio.md)
- [ADR-0002 — A escrita client-side, e o que de fato a protege](docs/adr/ADR-0002-a-escrita-client-side-e-o-que-a-protege.md)

## O que falta preencher

Três lugares esperam dado, e cada um **se anuncia na própria página** com um wireframe — nenhum foi preenchido
com valor inventado, que é como conteúdo de mentira chega a produção parecendo pronto:

| onde | o que falta | instruções |
|---|---|---|
| vitrine da capa | as fotos dos três ferry boats | [`public/embarcacoes/`](apps/agencia/public/embarcacoes/LEIA-ME.md) |
| cartão do atendente | nome, foto e o número do WhatsApp | [`public/atendentes/`](apps/agencia/public/atendentes/LEIA-ME.md) |
| vitrine de avaliações | os depoimentos | `src/conteudo/depoimentos.ts` |
| redes | as URLs do Instagram e do Facebook | `src/conteudo/depoimentos.ts` |
| rodapé | razão social, CNPJ, endereços, telefone, e-mail, links legais e o canal do encarregado | `src/conteudo/rodape.ts` |

`DEPOIMENTOS` é uma lista **vazia**, e isso é deliberado: depoimento inventado é a peça de conteúdo falso mais
fácil de deixar passar — tem nome de gente, cidade de verdade, e ninguém no code review pergunta se aquela
pessoa existe. Com a lista vazia, a página desenha moldes em branco e o texto falso **não existe no
repositório**.

Toda URL de rede declarada é conferida no build: precisa ser `https` e pertencer ao domínio daquela rede. É o
que impede o link do Instagram de levar ao perfil de outra pessoa por um erro de copiar e colar.

### Os dados que ninguém confere

O rodapé carrega valores que **parecem certos quando estão errados**, e cada um tem um guarda no build:

- o **CNPJ** tem dígitos verificadores, então dá para saber que está errado sem perguntar a ninguém. A regra é
  porte de `Cnpj.kt` do `fluviapp-kmp`, e recusa também as sequências repetidas — que passam na conta e são o
  que alguém digita para vencer um campo obrigatório;
- o **telefone** vale como fixo ou celular para o `tel:`, e só como celular para o WhatsApp;
- o **e-mail** e as **URLs legais** têm forma conferida.

E a **política de privacidade** não pode sumir da lista de links, mesmo pendente: sumir é como ela deixa de ser
providenciada, e o totem vai tratar dado pessoal.

## LGPD

O totem trata **só o nome e, se a pessoa quiser, o telefone** de quem reserva — nenhum documento, nenhuma
data de nascimento, nenhuma placa. É o mínimo para o atendimento chamar a pessoa, e é deliberado: identificador
digitado num terminal público é o dado pessoal de maior risco e o mais propenso a erro, e ele passa a ser
recolhido no atendimento, por quem pode conferir. Ainda assim nome e telefone põem a NAVEG na lei como
controladora, e traz duas obrigações que já estão declaradas no rodapé como pendência: a **política de
privacidade** e o **canal do encarregado** (art. 41). Estão ali desde agora, e não no dia do lançamento do
totem, quando seriam bloqueantes.

O número do WhatsApp é **validado no build**: `(91) 98888-7777`, `+55 91 98888-7777` ou `91988887777` dão no
mesmo, mas o que não resultar em `55` + DDD + 9 dígitos quebra o build. Número errado não dá erro em lugar
nenhum — dá um link que abre e não acha ninguém.

## Pendências conhecidas

- ~~**Razão social e CNPJ**~~ *(2026-10-07)*: o controlador é o **MEI do PO**, com o nome empresarial do cartão
  CNPJ (sem CPF nele), em `conteudo/rodape.ts`. O encarregado é o próprio PO; falta o e-mail, que espera o alias
  do Workspace. Falta ainda levá-los ao JSON-LD.
- **A marca NAVEG no INPI** *(2026-10-07)*: o registro está por fazer (MEI tem desconto nas taxas). Até lá o site
  usa "©" e nunca "®". O **nome fantasia** "NAVEG — Turismo e Logística" já é o que o site assina, mas só entra no
  CNPJ depois do registro: o Portal do Empreendedor bloqueou a edição.
- **O MEI e a venda online** *(2026-10-07)*, com o contador, antes da entrega 7: o teto de faturamento anual do
  MEI contra o valor das passagens que passaria pelo CNPJ, e se as ocupações do MEI cobrem agência de viagens ou
  intermediação de transporte. A reserva de hoje não movimenta dinheiro, e não muda nada.
- **O domínio** `gruponaveg.com.br` *(2026-10-07)*: conferir no Registro.br em nome de quem está — o ideal é o
  CNPJ do MEI, e dá para transferir do CPF. O e-mail do domínio é do Google Workspace e está pronto
  (2026-10-07): o DNS do Registro.br, em modo avançado, tem MX, SPF, DKIM e DMARC (`p=none`, relatórios para
  administradorsistema@), sem registro A — o site só aponta no lançamento.
- **Domínio de produção** e o SHA-256 do certificado de assinatura do app, para os App Links (passo 11).
- **Anonimizar as reservas duas semanas depois da viagem** (PO, 2026-10-07) — a tarefa agendada da API,
  [naveg-api-vercel#21](https://github.com/navegsistemas/naveg-api-vercel/issues/21). A política de privacidade de
  produção só promete o prazo com ela no ar.
- **A encomenda da web só com quem manda** (PO, 2026-10-07): sai "Quem retira no destino?" e o destinatário.
  Começa pelo KMP, que hoje não lê a reserva de encomenda sem `retirada` —
  [fluviapp-kmp#41](https://github.com/navegsistemas/fluviapp-kmp/issues/41) —, e depois vem o domínio, a API e o
  formulário daqui.
- **Marcas da Meta**: os ícones de Facebook, Instagram e WhatsApp em `src/icones.ts` são simplificações para
  prototipagem. Substituir pelos arquivos oficiais dos brand centers antes do lançamento.
- **Troca das chaves das contas de serviço** a cada 90 dias — criadas em 2026-09-23, a primeira vence por
  volta de 2026-12-22.
- **Projeto Firebase de produção**: hoje tudo é dev. Quando existir, contas e chaves são recriadas lá.
- **Cloudflare Turnstile** (chave pública e secreta) e um Upstash Redis para o limite por IP (passo 10) — é o
  que substitui o App Check agora que não há cliente público no Firestore.
- **A regra de `reservas` no `firestore.rules` do fluviapp** — agora **menor**: leitura para funcionário
  autenticado e `update` só para a conversão. `create` e `delete` negados, porque quem cria é a API com conta
  de serviço. É contribuição ao repositório deles, com os casos de emulador de lá (passos 10 e 12).
- **Manaus**: quando entrar, o fuso deixa de ser constante e passa a ser do porto de origem.
- **Dois padrões do fluviapp que o site herda por paridade**: viagem sem `horaMin` vira saída à meia-noite, e
  documento sem `ativo` é tratado como ativo. No balcão há quem perceba; no site, a saída das 00:00 aparece
  para o público. A correção, se houver, é no cadastro do fluviapp.
- **O contrato aponta para o `fluviapp-kmp`** desde o 0.5.0 (a P4 do ADR-0010 de lá). Ainda lidos do
  aplicativo: `TipoDocumento`, a lista de carga do navio, e os documentos de cliente e veículo — cada porte
  para o KMP move uma cláusula de fonte.
