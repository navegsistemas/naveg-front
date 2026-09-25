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

**2026-09-25: parei no fim do passo 11, com o caminho inteiro funcionando.** O cliente reserva no totem de
homologação, a API grava sob as Rules do `fluviapp-kmp`, e o botão **"Enviar ao atendimento"** abre o WhatsApp
da NAVEG, `(91) 99203-5322`, com a reserva escrita. O atendente acha a reserva pelo código no painel do KMP.
Provado de ponta a ponta nesse dia.

**Como está no ar** (plano de ambientes, §3):

- **Homologação do front:** `naveg-front-agencia.vercel.app`, o preview da `main`, atrás do login da Vercel.
- **A API:** `naveg-api-vercel.vercel.app`, o deploy de *produção*, sobre o `fluvi-app-dev`. Faz as vezes de
  homologação até o lançamento, por decisão (D4). Os domínios entram juntos, um por ambiente.
- **Variável `PUBLIC_…` nova no front:** só vale num build novo **do preview da `main`**. Chave nova na API: só
  vale num build novo de cada ambiente. Trocar uma chave é colar a nova, refazer os builds, e só então apagar a
  antiga.

**O que confere cada PR:** `verificar`, `build e orçamento` e `contrato com o fluviapp` (44 cenários contra o
Kotlin do KMP e do app legado, nenhum pulado) aqui; `verificar`, `auditoria`, `emulador` (a gravação de ponta a
ponta sob as Rules) e `fumaca` (cada deploy responde de verdade) na API. `npm run verify` dá **402 cenários
verdes** e um pulado nesta máquina, e o orçamento está em 67,1 kB de runtime e 17,5 kB de ilha
(`npm run conferir:build`).

**O próximo passo é o 13, endurecimento**, começando pelo **E2E do fluxo de reserva** num navegador de verdade:
o totem, o Turnstile, a chamada à API e o `href` do WhatsApp. O passo 12 é do lado do KMP (a reserva vira
passagem), e já está pela metade lá.

**Pendências, registradas nos planos:**

- **Na org, a fazer por quem administra:** 2FA obrigatório, push protection, e o `CODEOWNERS`, que espera saber
  quem responde por segurança.
- **Na API:** a trava ambiente × projeto, com a exceção da homologação provisória.
- **Esperando o domínio de produção:** a linha "Abrir no app" na mensagem, e a página `/r/{codigo}` (D9).
- **Esperando a data do quiosque:** o QR do link na conclusão.
- **PRs de major do Dependabot** (Astro 7, TypeScript 7, Vitest 5, jsdom 30, `@astrojs/react` 7; na API, Hono 2,
  TypeScript 7, Vitest 5): cada um é uma migração a decidir, não um merge.
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

A página institucional entrega **0 kB de JavaScript até alguém rolar até o totem**. A única ilha é o totem,
com `client:visible`: o código dele só desce quando a seção entra na tela. No quiosque (`/totem`) ele é
`client:load`, porque lá o totem **é** a página. Sem JavaScript, a seção diz para falar com o atendimento.

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

- **Razão social e CNPJ** da NAVEG, para o rodapé e o JSON-LD (passo 6).
- **Domínio de produção** e o SHA-256 do certificado de assinatura do app, para os App Links (passo 11).
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
