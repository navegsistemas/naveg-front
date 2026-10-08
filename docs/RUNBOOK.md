# RUNBOOK — o que fazer quando a agência falha

> **13.5 do endurecimento, 2026-10-08.** Para quem está de plantão: o PO hoje, o suporte quando houver. Cada
> seção começa pelo **sintoma** — o que o cliente ou o atendente vê —, diz **onde olhar** e **o que fazer**, na
> ordem da causa mais provável para a menos. Os nomes de variável, de rota e de código de erro são os do código;
> se um deles mudar, esta página muda no mesmo PR.
>
> A seção **"Venda online"** tem só os títulos: o conteúdo entra com a 7.4 e a 7.6, junto com o que ela descreve.

## 0. Onde olhar

| o quê | onde |
|---|---|
| **A API** — o que ela recusou e por quê | os logs do projeto `naveg-api-vercel` na Vercel (aba *Logs*, ou `vercel logs` do deploy de *Production*) |
| **Qual deploy está na homologação** | `gh api repos/navegsistemas/naveg-api-vercel/deployments?environment=Production` |
| **O navegador** — o que nem chegou à API | DevTools do cliente (ou da sua máquina reproduzindo): *Console* (violação de CSP, erro do Turnstile) e *Network* (o `POST /reservas` saiu? com que status?) |
| **A reserva gravada** | o painel do KMP, em Reservas, pelo código `NVG-…` |

**As linhas que a API escreve no log**, e o que cada uma quer dizer. Nenhuma tem nome, telefone ou IP — o que
identifica um pedido é o código da reserva.

| linha | quer dizer |
|---|---|
| `reserva NVG-… gravada` | deu certo |
| `pool: N viagens…; concessão: N embarcações e N portos; ofertável depois do recorte: N viagens` | uma leitura do catálogo, só com contagens (§2) |
| `catálogo sem concessão: …` / `reserva recusada: a atuação AGENCIAMENTO …` | `NAVEG_EMPRESA_ID` errado ou a concessão apagada no fluviapp (§2) |
| `envio de reservas desligado: faltam …` / `falta FIREBASE_WEB_API_KEY` | na partida: o `POST` vai responder `503` (§1) |
| `limite por IP indisponível, envio liberado: …` | o Upstash caiu; as reservas **passam**, só sem limite (§1) |
| `reserva NVG-… não gravada: erro do Firestore de código …` / `reserva não gravada: …` | o banco recusou (§3) |
| `falha não prevista` | `500` sem causa conhecida — o resto da linha diz qual |

**O que o cliente vê**, para traduzir a queixa em status. O totem só tem três desfechos:

| na tela | de onde vem |
|---|---|
| o código `NVG-…` e o botão "Enviar ao atendimento" | `201` — gravada |
| "escolha outra saída" (a validade) ou um campo a corrigir | `409` (a saída partiu, foi inativada ou saiu da concessão) ou `422` — **não é falha**, é a regra funcionando |
| **"não foi possível enviar agora"** | todo o resto: o desafio que não resolveu, a rede, `403`, `429`, `503`, `500` (§1) |

## 1. Reserva legítima barrada

**Sintoma:** o cliente monta a reserva, toca em enviar e lê "não foi possível enviar agora" — uma vez, ou toda
vez.

**Primeiro, o `POST /reservas` chegou à API?** Procure nos logs, no horário da queixa.

### 1.1 Não chegou: o problema está no navegador

O totem só manda o `POST` **depois** de o Turnstile entregar um token. Se o desafio não resolve, nada sai, e a
API não tem o que registrar.

1. **O domínio não está no widget.** O widget do Turnstile só vale nos *hostnames* cadastrados nele (hoje,
   `naveg-front-agencia.vercel.app`). Front publicado num endereço novo — o domínio oficial, um subdomínio de
   homologação — **sem** o endereço no widget recusa todo mundo. No painel da Cloudflare → Turnstile → o widget
   → *Hostnames*, acrescentar o endereço. Não pede deploy.
2. **A CSP barrou o Turnstile.** O *Console* mostra uma violação citando `challenges.cloudflare.com`. A origem
   está em `ORIGEM_DO_TURNSTILE` ([seguranca.ts](../apps/agencia/src/conteudo/seguranca.ts)) e entra só nas
   páginas com o totem; se a Cloudflare mudou de endereço, o acréscimo é ali, e o E2E confere.
3. **O desafio não resolveu em dois minutos** (rede ruim, bloqueador de anúncio, navegador muito antigo). O
   cliente vê o mesmo "não foi possível enviar agora". Saída para ele: o WhatsApp do atendimento, que é o
   caminho de qualquer jeito.
4. **A chave pública errada no build.** `PUBLIC_TURNSTILE_SITE_KEY` é lida **no build**: trocada na Vercel, só
   vale num build novo do front (para a homologação, um novo deploy da `main`).
5. **CORS.** O *Network* mostra o `POST` bloqueado pelo navegador, sem status. A origem do front tem de estar em
   `ORIGENS_PERMITIDAS` **no escopo da API que o front chama** (hoje, o de *Production*). Variável nova na API
   só vale com deploy novo (§4.1).

### 1.2 Chegou, e a API recusou

| status | código | causa provável | o que fazer |
|---|---|---|---|
| `403` | `ORIGEM_NAO_PERMITIDA` | o front num endereço que não está em `ORIGENS_PERMITIDAS` | acrescentar a origem, sem barra no fim, e refazer o deploy da API |
| `503` | `ENVIO_INDISPONIVEL` | falta `TURNSTILE_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` ou `FIREBASE_WEB_API_KEY` no escopo do deploy — a partida diz qual | preencher e refazer o deploy. O catálogo continua servindo enquanto isso |
| `429` | `LIMITE_EXCEDIDO` | mais de **20 envios em 10 minutos** do mesmo IP | ver abaixo |
| `403` | `DESAFIO_INVALIDO` | o token do Turnstile foi recusado pela Cloudflare | ver abaixo |
| `500` | — | `siteverify` fora do ar, ou outra falha não prevista | a linha `falha não prevista` diz qual; se for a Cloudflare, esperar — uma falha de rede **não** é contada como desafio inválido |

**O `429` de gente de verdade.** Vinte em dez minutos é muito mais do que uma família faz, mas **um IP pode ser
muita gente**: o quiosque físico, o Wi-Fi de um porto, uma operadora móvel que põe milhares de celulares atrás do
mesmo endereço. Foi por isso que o teto subiu de 10 para 20 (PO, 2026-10-08, naveg-api-vercel#22). Se a queixa
vem de um lugar só e se repete, o teto está em `LIMITE_PADRAO`, no `src/protecao/limite-upstash.ts` da API —
subir de novo é decisão do PO, com o motivo no commit. Na hora, o cliente
espera a janela (no máximo dez minutos) ou segue pelo WhatsApp.

**O `403 DESAFIO_INVALIDO` de gente de verdade.** Um a um, é o Turnstile fazendo o trabalho dele. **Todos** de
uma vez quer dizer que a chave secreta e o widget não são o mesmo par: `TURNSTILE_SECRET` de um widget e
`PUBLIC_TURNSTILE_SITE_KEY` de outro — o caso clássico é a chave **de teste** (`1x0000…AA`) num lado só. Conferir
que as duas são do mesmo widget, no painel da Cloudflare. A API exige também a ação `reserva`, que o totem
declara; um widget novo não muda isso.

**O Upstash caído não barra ninguém.** A linha `limite por IP indisponível, envio liberado` diz que as reservas
estão passando sem limite — o Turnstile continua de pé. Não é urgente; é para olhar o painel do Upstash no
mesmo dia.

## 2. O catálogo fora de hora

**Não há rebuild de catálogo.** O plano original tinha um catálogo gerado no build, refeito todo dia; com a API
(ADR-0002, segunda emenda), o totem lê o Firestore **ao vivo**, pela API. Sobraram três atrasos, todos
pequenos, e um defeito que se parece com eles.

**Sintoma: "cadastrei uma viagem no aplicativo e ela não aparece no site".**

1. **O cache da borda — até um minuto.** O `GET /catalogo` sai com `s-maxage=60, stale-while-revalidate=600`: a
   borda serve a cópia por 60 s e, passado isso, ainda entrega a cópia velha **uma vez** enquanto busca a nova.
   Na prática, a viagem aparece entre um e dois minutos depois de gravada. Esperar e recarregar.
2. **A página aberta não relê o catálogo.** O totem carrega o catálogo **uma vez**, quando a página abre
   ([oferta.ts](../apps/agencia/src/ilhas/oferta.ts)); o relógio corre a cada minuto, então saída que parte some
   sozinha, mas saída **nova** só aparece recarregando. **O quiosque físico (`/totem`) fica aberto o dia todo:
   depois de mudar o cadastro, recarregar a página do quiosque.** A releitura automática foi descartada pelo PO
   (2026-10-08): cadastro de viagem nova é raro, e recarregar à mão basta.
3. **A viagem não é ofertável.** O site só mostra o que a concessão da NAVEG cobre, na janela de sete dias e
   com partida não vencida — e esconde a saída cuja embarcação ou porto não resolve. A linha
   `pool: … ofertável depois do recorte: …` do log diz onde ela caiu: falta viagem no pool, falta id na
   concessão, ou a concessão não cobre a viagem. A correção é no cadastro do fluviapp, não aqui.

**Sintoma: o totem diz que não conseguiu carregar as saídas.**

- `500` no `/catalogo` com `catálogo sem concessão` no log: `NAVEG_EMPRESA_ID` aponta para uma empresa sem
  `atuacoes/AGENCIAMENTO`. É `500` de propósito — um `200` vazio pareceria "dia sem saídas". Conferir o id da
  empresa no Firestore e a variável no escopo do deploy.
- Qualquer outro erro: a conta de leitura (§3) ou o Firestore. Erro não fica em cache, então a primeira resposta
  boa já resolve para todo mundo.

**Para ver o catálogo fresco agora, sem esperar o minuto:** o painel da Vercel tem a opção de limpar o cache da
CDN do projeto da API. Quase nunca vale a pena — o minuto passa antes.

## 3. A gravação recusada

**Sintoma:** o cliente vê "não foi possível enviar agora", e o log tem `reserva não gravada` ou
`erro do Firestore de código …`.

- **`auth/invalid-custom-token`** parece do banco e **não é**: o login do serviço falhou. A conta
  `naveg-api-escrita` foi apagada, ou a chave dela trocada sem atualizar `FIREBASE_CONTA_DE_ESCRITA`. Foi o que
  aconteceu em 2026-09-25, das 13:13 às 13:23. Refazer a chave (§4) — **sem** dar papel nenhum à conta: ela só
  assina o token, e quem decide o que grava são as Rules.
- **`permission-denied`**: as Rules do `fluviapp-kmp` recusaram o documento. Ou elas mudaram lá sem a API
  acompanhar, ou a API mudou o documento sem as Rules acompanharem. O job `emulador` da API grava contra as
  Rules em cada PR — conferir se ele rodou contra o checkout atual do KMP. A correção é no repositório que
  divergiu, e vira issue lá se não for este.

## 4. Trocar uma chave

### 4.1 A regra, para qualquer chave

1. **criar a nova** sem apagar a antiga;
2. **colar a nova** na variável da Vercel (ou no segredo do GitHub), no escopo certo, marcada *Sensitive*;
3. **refazer o deploy** de cada ambiente que a usa — **variável salva não vale até o próximo build**: a função
   que está no ar continua com a antiga;
4. **conferir** que o ambiente funciona com a nova (o catálogo carregando, uma reserva gravada);
5. **só então apagar a antiga**.

Na ordem inversa, há um intervalo em que nada funciona. Suspeita de vazamento muda só a pressa: os cinco passos
seguidos, mas no mesmo dia, e a antiga apagada assim que o passo 4 passar.

### 4.2 As chaves que existem hoje

| chave | onde mora | como se refaz | vence |
|---|---|---|---|
| `FIREBASE_CONTA_DE_LEITURA` (`naveg-api-leitura`) | Vercel, API | Google Cloud → IAM → Contas de serviço → a conta → Chaves → JSON (README da API, "As contas de serviço"). **Nunca** o botão "Gerar nova chave privada" do console do Firebase | ~2026-12-24 (90 dias) |
| `FIREBASE_CONTA_DE_ESCRITA` (`naveg-api-escrita`) | Vercel, API | igual; a conta continua **sem papel** | ~2026-12-24 |
| `TURNSTILE_SECRET` | Vercel, API | Cloudflare → Turnstile → o widget → girar a chave secreta | — |
| `PUBLIC_TURNSTILE_SITE_KEY` | Vercel, front (lida no **build**) | só muda com widget novo; aí, também a secreta, e as duas juntas (§1.2) | — |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Vercel, API | painel do Upstash. O token é também o **sal** do resumo do IP: trocar zera os contadores, o que é inofensivo | — |
| `FIREBASE_WEB_API_KEY` | Vercel, API | não é segredo; muda só com outro projeto Firebase | — |
| `NPM_TOKEN` (lê o `@navegsistemas/domain`) | Vercel, API | PAT clássico com `read:packages`. Sem ele, o build da API **falha na instalação** — e falha cedo, que é o certo | — |
| `FLUVIAPP_LEITURA_TOKEN` | segredos da org: Actions **e** Dependabot | token *fine-grained* só de leitura do `fluviapp-kmp` e do `fluviapp`. Faltando no de Dependabot, só os PRs do Dependabot ficam vermelhos no `contrato` | ~2026-12-24 (90 dias) |
| `DEPENDABOT_NPM_TOKEN` | segredo de Dependabot da API | PAT com `read:packages` | ~2026-12-24 (90 dias) |

**Projeto de produção:** nenhuma destas migra. Contas novas, chaves novas, variáveis novas — e as de
`fluvi-app-dev` nunca entram no ambiente de produção (plano de ambientes).

## 5. Levar a API à homologação, e voltar atrás

**O merge na `main` da API não é o deploy da homologação.** Ele gera um *Preview*; a homologação é o deploy de
*Production* (`naveg-api-vercel.vercel.app`, provisório até os domínios). Promover é do PO:

```bash
vercel promote <url do deploy do merge>   # refaz o build com as variáveis de Production
```

**Logo depois de promover, conferir** o totem de homologação carregando as saídas e **uma reserva gravada**
até o painel do KMP. Se algo falhar:

```bash
vercel rollback                            # volta ao deploy anterior, sem rebuild
```

**Atenção na próxima promoção:** a homologação está no deploy do #17. A próxima leva junto o Hono 2 (o ponto de
entrada trocado para `getRequestListener`) e o Vitest 5. A fumaça do preview passou; a conferência acima é
obrigatória mesmo assim.

**O front** não tem promoção: a homologação é o preview da `main`. Voltar atrás é reverter o PR; um
`PUBLIC_…` novo só vale num build novo da `main`.

## 6. App Links e o certificado — quando existir

O plano original pedia "girar o certificado sem quebrar App Links". Hoje **não há App Link**: o
`assetlinks.json` espera o domínio de produção (pendências do README). Quando ele entrar, a regra fica aqui:

- o `/.well-known/assetlinks.json` lista a impressão digital SHA-256 do certificado de assinatura do app —
  com o *Play App Signing*, a **da chave de assinatura do Google**, não a de upload;
- **para trocar o certificado, acrescentar a impressão nova à lista antes** de publicar o app assinado com ela,
  e só tirar a antiga quando nenhuma versão em uso depender dela. Com uma impressão só na lista, o app novo
  perde o link no primeiro dia, e o Android não refaz a verificação sozinho até a próxima instalação ou
  atualização.

## 7. Venda online

> **Só os títulos.** O conteúdo entra com a entrega que o descreve — escrito antes, seria procedimento de um
> sistema que ainda não existe. Plano da venda online, §4 e §7.

### 7.1 O aviso do Mercado Pago que não chega

*A preencher na 7.6.*

### 7.2 Pagamento aprovado sem passagem emitida

*A preencher na 7.6.*

### 7.3 O estorno à mão

*A preencher na 7.6.*

### 7.4 Trocar a chave do Mercado Pago

*A preencher na 7.6.* Segue a regra do §4.1, com a trava ambiente × projeto da API: a homologação recusa subir
com chave de produção, e a produção com chave de teste.

### 7.5 Fechar a compra e deixar só a reserva

*A preencher na 7.6.* É uma chave **na API**, não no front — o catálogo passa a dizer "compra fechada", e o
totem mostra só "Reservar". Fecha sem build nem deploy.
