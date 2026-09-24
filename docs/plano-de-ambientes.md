# Plano de ambientes e da esteira — desenvolvimento, homologação e produção

> **Proposta de 2026-09-23.** Escrita depois de a API ir ao ar, para arrumar a casa antes que "tudo é dev" vire
> hábito. Cobre os dois repositórios da agência — este e a [`naveg-api-vercel`](../../naveg-api-vercel) — e o
> que eles dependem do fluviapp. As decisões que não são técnicas estão marcadas **[D1]…[D9]** e reunidas no
> fim, cada uma com uma recomendação.
>
> **Revisão de 2026-09-23 (noite), contra as regras publicadas.** Três coisas mudaram no mesmo dia: o
> `fluviapp-kmp` virou **o centralizador** e a fonte do contrato, e o aplicativo Android original passou a ser
> **legado e referência** (ADR-0010 do KMP); o KMP adotou o mesmo desenho de ambientes deste plano — `master`
> em homologação, `producao` por promoção, produção **preparada e desligada** (ADR-0012 de lá); e a API da
> agência passa a gravar **sob as Rules**, como usuário de serviço, com um evento por reserva (ADR-0013 de lá).
> As Rules novas já estão publicadas no `fluvi-app-dev`. D1 foi decidida e D5 feita; D8 mudou de custo; entrou
> a D9. O que mudou está marcado *(revisto)*.

## 1. Onde estamos

Uma fotografia, conferida no GitHub, na Vercel e no Firebase no dia da proposta:

| o quê | hoje | o problema |
|---|---|---|
| **Ambientes** | um só, de fato: tudo lê e grava no `fluvi-app-dev` | não há onde testar sem mexer no que o balcão vê, nem onde produção fique a salvo de um teste |
| **Branches** | só `main`, nos dois repositórios, **sem proteção** | qualquer push vai direto ao ar (a API deploia a cada push na `main`) |
| **CI** | só a publicação do domínio, por tag; **nenhum cenário roda em pull request**; a API não tem CI | o que garante a qualidade é alguém lembrar de rodar `npm run verify` |
| **Vercel** | plano **Hobby**, conta pessoal (`kurtmatheus-projects`); só a API tem projeto | o Hobby é **restrito a uso pessoal e não comercial** (fair use da Vercel) — a NAVEG é uma empresa; logs duram **1 hora** |
| **Variáveis da API** | um conjunto, com as chaves do `fluvi-app-dev`; a proteção do envio desligada | nada separa o que um preview pode tocar do que produção toca |
| **Firebase** | `fluvi-app-dev` (o do aplicativo) e `naveg-app-homol` (não é destino) | **não existe projeto de produção**; o próprio aplicativo distribui "produção" apontando para o `fluvi-app-dev` |
| **Rules** *(revisto)* | as do `fluviapp-kmp`, publicadas **automaticamente** no `fluvi-app-dev` a cada merge no `master` de lá; já cercam `reservas` e `eventos` | a API no ar já grava **sob elas**, com o evento (`naveg-api-vercel#1` e #2); o envio só está desligado enquanto faltarem as variáveis do Turnstile, do Upstash e a chave Web |
| **Org no GitHub** | `navegsistemas`, plano free, 3 membros, **2FA não obrigatório** | um token vazado de qualquer membro chega aos dois repositórios públicos |
| **Repositórios do fluviapp** *(revisto)* | `fluviapp-kmp` (o centralizador) e `fluviapp` (legado e referência), **privados, na org `navegsistemas` desde 2026-09-23** (D5) | o CI daqui ainda não clona o contrato: falta o token da org e os jobs (fase 0b) |

O que já está certo, e o plano preserva: segredo nenhum no repositório, a conta de leitura separada da de
escrita, a configuração que falha na partida, e o domínio versionado por tag.

## 2. Princípios

1. **Um ambiente não enxerga o outro.** Cada um tem o próprio banco, as próprias contas, as próprias chaves e o
   próprio contador de limite. Um preview não tem credencial de produção — nem por engano, nem por herança de
   variável.
2. **Produção só recebe o que passou por homologação.** O mesmo commit, já testado — não um parecido.
3. **A máquina confere, a pessoa decide.** Cenário, tipo, orçamento de bundle e varredura de segredo são
   automáticos e bloqueiam o merge; ir para produção é um ato explícito, com aprovação.
4. **Os ambientes daqui seguem os do fluviapp.** A agência lê e grava no Firestore **da plataforma**: a reserva
   feita no totem de homologação tem de aparecer no centralizador (o painel do KMP) de homologação. Por isso não
   existe "produção da agência" antes de existir "produção do fluviapp" (ver §7).
5. **Tudo o que for possível sem pagar, agora; o que custa, com decisão.**

## 3. Os três ambientes

| | **Local** (dev) | **Homologação** (preview) | **Produção** |
|---|---|---|---|
| **Para quê** | escrever e testar código | ver a mudança inteira funcionando, com dados de teste, antes de ir ao ar; é onde o PO e o atendimento aprovam | o público |
| **Quem usa** | quem desenvolve | PO, atendimento, testadores do aplicativo de homologação | clientes da NAVEG |
| **Firestore** *(revisto)* | **emulador** do Firestore **e do Auth**, com as Rules do `fluviapp-kmp` | `fluvi-app-dev` | **projeto de produção do fluviapp**, criado pelo KMP [D1] |
| **Credencial do Google** *(revisto)* | nenhuma (o emulador dispensa) | `naveg-api-leitura` (lê o catálogo) e `naveg-api-escrita` (**só assina o token de serviço**, sem papel no Firestore) do `fluvi-app-dev` | as mesmas duas, **no projeto de produção** |
| **Chave Web do Firebase** *(novo)* | a do emulador (qualquer texto) | a do app Web do `fluvi-app-dev` | a do app Web de produção |
| **Front** | `npm run dev` | domínio fixo de homologação (ex.: `homolog.agencia.naveg.com.br`) + previews de PR | `agencia.naveg.com.br` [D4] |
| **API** | `vercel dev` / `http://localhost:3000` | domínio fixo de homologação (ex.: `api-homolog.naveg.com.br`) | `api.naveg.com.br` |
| **Turnstile** | chaves **de teste** (sempre passam) | **widget próprio**, restrito ao domínio de homologação | widget próprio, restrito ao domínio de produção |
| **Upstash** | dispensável (a proteção pode ficar desligada) | banco (ou prefixo) de homologação | banco de produção |
| **Deploy** | — | automático, a cada merge na `main` | **promoção explícita**, com aprovação |
| **Acesso** | — | aberto só a quem tem o link; `noindex` (padrão da Vercel em preview) | público |

### O que muda no código para isso funcionar

Pequeno, e cada item com cenário:

- **A API aceita o emulador sem conta de serviço.** Hoje ela exige o JSON mesmo quando `FIRESTORE_EMULATOR_HOST`
  está definido; com o emulador, as duas contas passam a ser dispensáveis. É o que deixa desenvolver sem nenhuma
  credencial na máquina. *(revisto)* Pela metade: o PR `naveg-api-vercel#1` trouxe `npm run test:emulador`, que
  grava de ponta a ponta contra o emulador e as Rules do KMP; falta a **API inteira** subir contra ele.
- **A API confere, na partida, que o ambiente e o projeto combinam.** Com `VERCEL_ENV=production`, o
  `FIREBASE_PROJECT_ID` tem de ser o de produção; com `preview`, **não pode** ser. É a trava contra a variável
  errada no ambiente errado — o erro mais provável desta configuração, e o mais caro. *(revisto)* A mesma
  conferência vale para a chave Web e para o projeto das duas contas: o KMP já faz o equivalente no instalador
  do painel (`conferirAmbienteDoInstalador`, ADR-0012 de lá).
- **O front deixa de ter a produção como padrão.** O padrão atual (`URL_DA_API_PADRAO`) foi uma boa decisão com um
  ambiente só; com três, um build sem variável apontaria para produção. Passa a ser **obrigatório** declarar
  `PUBLIC_URL_DA_API` nos builds da Vercel (o CI confere), e o padrão local vira `demonstracao`.
- **`ORIGENS_PERMITIDAS` por ambiente.** Homologação libera o domínio fixo de homologação e `localhost`;
  produção, **só** o domínio de produção. Os previews de PR do front falam com a API de homologação por um
  proxy do próprio domínio de homologação, ou são liberados por um padrão restrito ao projeto — decisão de
  implementação da fase 1, não de negócio.

## 4. Branches e o fluxo no GitHub

**Recomendação: trunk-based, com produção por promoção.** Uma branch de trabalho de verdade (`main`), branches
curtas por mudança, e uma branch de produção que só anda **para frente**, e só com o que a `main` já tem.

```
feat/xyz ──PR──▶ main ──────────────▶ homologação   (automático, a cada merge)
                  │
                  └──PR "Promover"──▶ producao ──▶ produção   (aprovação + checks)
```

| branch | o que é | quem escreve | proteção (ruleset) |
|---|---|---|---|
| `feat/*`, `fix/*` | uma mudança; vive horas ou dias | quem desenvolve | nenhuma; gera um **preview de PR** |
| `main` | o que está em homologação | **só por PR** | PR obrigatório, checks obrigatórios (§5), histórico linear (squash), sem force-push, sem apagar |
| `producao` | o que está em produção | **só por PR vindo da `main`** | tudo o que a `main` tem + **aprovação obrigatória**; a promoção entra com o **commit de merge** do PR |

- **Na Vercel**, a *Production Branch* de cada projeto passa a ser `producao`; a `main` vira um preview com
  **domínio fixo atribuído à branch** — o recurso que a Vercel documenta como *staging por branch de preview*, e
  que existe no Hobby. As variáveis de homologação ficam no escopo **Preview**; as de produção, **Production**.
- **Promover** é abrir um PR `main → producao`. O PR mostra exatamente o que vai mudar em produção, pede a
  aprovação, e o merge dispara o deploy. **Voltar atrás** é o *Instant Rollback* da Vercel (sem rebuild) e, em
  seguida, um PR que desfaz na `main`.
- **O `@navegsistemas/domain` continua saindo por tag** a partir da `main`. A API de **produção** usa versão
  **exata** (sem `^`): uma versão nova do domínio só chega a produção pelo mesmo caminho de promoção. O
  Dependabot abre o PR de atualização na API.
- **Por que não `develop` + `main` (git-flow):** duas branches longas divergem, e a divergência aparece na hora
  do merge de release — exatamente quando menos se quer surpresa. Aqui `producao` só tem, além do que veio da `main`, os **commits de merge das promoções** — um por release, e nada escrito direto nela *(decidido em 2026-09-24: o GitHub não faz fast-forward por PR, e o commit de merge marca cada ida a produção)*.

## 5. A esteira: CI no GitHub Actions

Tudo roda em **pull request** e em push na `main`; os jobs marcados **✱** são checks obrigatórios do ruleset.
Actions é gratuito em repositório público.

### `naveg-front`

| job | o que faz |
|---|---|
| **✱ verificar** | `npm ci`, `typecheck`, `astro check`, cenários |
| **✱ contrato com o fluviapp** *(revisto)* | clona o **`fluviapp-kmp`** e o `fluviapp` legado (token da org, §6) e roda a camada 2 do contrato — sem isso os 24 cenários que leem o Kotlin ficam pulados para sempre no CI. Os dois já estão na org (D5); falta o token e o job |
| **✱ build e orçamento** | `npm run build` com as variáveis de homologação; confere o orçamento de JavaScript (0 kB fora da ilha; teto declarado para a ilha) e **varre o `dist/`** por qualquer coisa com cara de credencial |
| **publicar o domínio** | o que já existe: por tag `domain-v*`, depois de `verify` |

### `naveg-api-vercel`

| job | o que faz |
|---|---|
| **✱ verificar** | `npm ci` (o pacote do domínio lido com o `GITHUB_TOKEN`, §6), `typecheck`, cenários |
| **✱ emulador** *(revisto)* | clona o `fluviapp-kmp` e roda `npm run test:emulador`: Firestore e Auth no emulador, as **Rules do KMP**, a reserva e o `reserva.criada` gravados pelo usuário de serviço, e a recusa da reserva de outra agência. O cenário já existe; falta o job |
| **✱ auditoria** | `npm audit --omit=dev --audit-level=high` |
| **✱ fumaça pós-deploy** *(revisto: obrigatório, e já na fase 0)* | disparado pelo `deployment_status` da Vercel: `GET /saude` e `GET /catalogo` no ambiente que acabou de subir — **inclusive o preview do PR, e aí bloqueia o merge**; em produção, falha abre uma issue. O incidente de 2026-09-23 (a API caída na partida, com todos os cenários verdes) é exatamente o que ele pega |

### Nos dois

- **Varredura de segredos com *push protection*** (gratuita em repositório público): o push com uma chave é
  recusado antes de chegar ao GitHub.
- **Dependabot** para npm e para as próprias Actions, semanal, agrupado.
- **`CODEOWNERS`**: `api/`, `src/config.ts`, `src/protecao/`, `.github/` e o que mexe em segurança pedem a revisão
  de quem responde por ela.

## 6. Segredos e identidade

**Onde cada segredo mora, por ambiente** — e nenhum segredo de produção existe fora do escopo Production:

| segredo | local | homologação | produção | onde |
|---|---|---|---|---|
| conta de leitura do Google | — (emulador) | `fluvi-app-dev` | projeto de produção | Vercel |
| conta de escrita do Google *(revisto: só assina o token de serviço, sem papel no Firestore)* | — (emulador) | `fluvi-app-dev` | projeto de produção | Vercel |
| `FIREBASE_WEB_API_KEY` *(novo; não é segredo, mas é por ambiente)* | qualquer texto | app Web do `fluvi-app-dev` | app Web de produção | Vercel |
| `TURNSTILE_SECRET` | chave de teste | widget de homologação | widget de produção | Vercel |
| `UPSTASH_*` | — | banco de homologação | banco de produção | Vercel |
| token do pacote do domínio | `NPM_TOKEN` da pessoa | leitura por repositório (abaixo) | idem | Vercel / GitHub |
| leitura do fluviapp no CI | — | — | — | GitHub — *(revisto)* um token da org (*fine-grained*) com leitura só de `fluviapp-kmp` e `fluviapp` |

- **Sem chave JSON, em produção.** A Vercel emite um token OIDC por deploy, e o *subject* dele diz o ambiente:
  `owner:<time>:project:<projeto>:environment:production`. No Google Cloud, a *Workload Identity Federation*
  deixa **só esse subject** agir como a conta de produção. Resultado: não há chave para vazar, e um preview
  **não consegue** usar a identidade de produção nem se a variável for copiada errada. É a troca da "chave
  JSON na Fase 1" registrada no README da API. Custa uma mudança pequena na conexão (`conexao.ts`) e a
  configuração no GCP; homologação pode continuar com JSON por enquanto.

  *(revisto)* **Com a API sob as Rules, a conta de escrita precisa assinar o token customizado**, e assinar sem
  chave é pedir ao IAM (`signBlob`): ela ganha *Service Account Token Creator* **sobre si mesma**, e o Admin SDK
  é iniciado com `serviceAccountId` em vez de `cert(...)`. Continua sem chave para vazar; é um papel a mais e
  uma segunda mudança na conexão (`servico.ts`). A leitura do catálogo segue o desenho original.
- **Depois que a API gravar pelo token** *(novo)*: tirar o papel *Cloud Datastore User* da conta de escrita, em
  cada projeto. Enquanto ele existir, a chave vazada ainda grava por cima das Rules. Em produção a conta já
  nasce sem ele (ADR-0013 §3.4 do KMP).
- **A chave Web sem restrição por referenciador** *(novo)*: quem a usa é o servidor, que não manda `Referer`.
  Se for restringida, que seja por API (Identity Toolkit e Firestore), nunca por site.
- **O pacote do domínio sem PAT no CI.** No GitHub Packages, o pacote pode conceder leitura ao repositório da
  API (*Manage Actions access*); o CI lê com o `GITHUB_TOKEN`, que expira sozinho. O `NPM_TOKEN` pessoal fica
  só na Vercel e nas máquinas — e com a Vercel lendo por um token de **conta técnica**, não de uma pessoa.
- **Rotação**: chave JSON a cada 90 dias (a primeira vence por volta de 2026-12-22); tokens do Upstash e o
  segredo do Turnstile, a cada saída de alguém com acesso.

## 7. O acoplamento com o fluviapp (o KMP) *(revisto)*

A agência não tem banco próprio: ela lê o catálogo **da plataforma** e grava reservas que **o centralizador**
trata. Isso amarra os ambientes daqui aos de lá — e, desde 2026-09-23, "lá" é o **`fluviapp-kmp`**. O
aplicativo Android original é **legado e referência**: continua distribuindo até a paridade, e o contrato só o
lê no que ainda não foi portado.

O KMP adotou o mesmo desenho deste plano (ADR-0012 de lá):

| fluviapp-kmp | agência |
|---|---|
| `master` → **homologação** (`fluvi-app-dev`); a esteira **publica as Rules sozinha** a cada merge | `main` → homologação (`fluvi-app-dev`) |
| `producao`, só por PR do `master`, com trava de que o commit já está no `master` → **produção**, num projeto novo | `producao` → produção, **no mesmo projeto** |
| produção **preparada e desligada**: o ramo, o projeto e os segredos de produção ainda não existem | idem |

**D1 está decidida** (ADR-0012 §5 e ADR-0013 §1 do KMP): o projeto de produção é **novo**, criado quando for a
hora de entrar em produção; o `fluvi-app-dev` fica para desenvolvimento e homologação. A ordem que isso impõe:

1. **o KMP liga produção primeiro** — cria o projeto, registra o app Web (é de onde sai a chave Web), cria o
   primeiro `ADM`, abre o ramo `producao`. O primeiro push dele **publica as Rules de `reservas` e `eventos` no
   projeto de produção**;
2. **só então a agência** cria as duas contas lá (a de escrita **sem papel no Firestore**), põe a chave Web e o
   projeto no escopo *Production* da Vercel e abre a sua `producao`.

Ligar a agência antes do passo 1 grava num projeto sem Rules de reserva — negado por omissão, com sorte; e sem
o centralizador de produção para tratá-las, de qualquer jeito.

**O contrato tem fonte no KMP** (P4 do ADR-0010 de lá): o teste de contrato daqui lê os enums, os documentos
do catálogo, o `ReservaDocumento.kt` e o `EventoDocumento.kt` no `fluviapp-kmp`, e as coleções no
`firestore.rules` de lá. Mover um desses arquivos lá quebra o teste aqui — de propósito.

**D5 está feita** (2026-09-23): `fluviapp-kmp` e `fluviapp` estão na org `navegsistemas`, privados. Deixou de ser só
continuidade: é o que deixa o CI daqui clonar o contrato e as Rules, e o KMP ganhar proteção de ramo e
aprovação no PR de promoção (o que o ADR-0012 §6 de lá deixou de fora por falta de plano — e que, privado numa
org free, continua pedindo o plano Team). Os checkouts locais já apontam para a org; os caminhos que o teste lê (`FLUVIAPP_KMP`,
`FLUVIAPP_ORIGINAL`) não mudam.

**Esta API continua existindo.** O ADR-0010 do KMP mantém as três aplicações — centralizador, API da agência e
agência — com o Firestore como barramento; a aposentadoria da API, que este plano cogitava, não está no desenho.

## 8. A casa do GitHub e da Vercel

| o quê | hoje | proposta | custo |
|---|---|---|---|
| **2FA na org** | não obrigatório | **obrigatório** | — |
| **Rulesets** | *(2026-09-24)* um só, em `main` e `producao`: PR obrigatório, sem force-push, sem apagar | `main` e `producao` como no §4 | — |
| **Secret scanning + push protection** | padrão | ligado e conferido nos dois repositórios | — (público) |
| **Visibilidade** | públicos (por causa do Hobby) | podem voltar a **privados** se a Vercel for Pro; senão, continuam públicos — o código não tem segredo, e o plano não depende disso [D6] | — |
| **Dono do deploy** | conta pessoal na Vercel | um **time da NAVEG** na Vercel, com os dois projetos | ver D2 |
| **Plano da Vercel** | Hobby (não comercial) | **Pro para produção** [D2] — resolve o termo de uso, dá 1 dia de logs, *log drains* e um ambiente customizado | US$ 20/mês por assento de desenvolvedor |
| **Domínio** | `*.vercel.app` | `agencia.naveg.com.br` e `api.naveg.com.br`, com os de homologação ao lado [D4] | o domínio |

## 9. Observabilidade

- **Uptime** de `/saude` e `/catalogo` em produção, de fora (qualquer monitor gratuito serve), com alerta para
  o PO e quem desenvolve.
- **Logs**: 1 hora no Hobby é pouco para investigar um "o catálogo sumiu de manhã"; no Pro, 1 dia, e um *log
  drain* para guardar mais. A API já escreve linhas próprias para isso (o resumo do catálogo, o código da
  reserva gravada) — e nenhuma com dado pessoal, o que permite guardá-las.
- **A linha de contagem do catálogo** vira alerta quando "ofertável depois do recorte" for 0 em produção.

## 10. A ordem *(revisto)*

| fase | o quê | depende de |
|---|---|---|
| **A · ligar a API sob as regras, agora** *(novo)* | ~~merge de `naveg-front#1` e tag `domain-v0.5.0`; o lock da API no 0.5.0; merge de `naveg-api-vercel#1` e #2~~ (feitos em 2026-09-23 — o #1 derrubou a API por 12 minutos, ver o incidente no passo 10 do plano de implementação). **Falta:** na Vercel da API, `FIREBASE_WEB_API_KEY`, `TURNSTILE_SECRET`, `UPSTASH_*`, `ORIGENS_PERMITIDAS`; **o projeto do front na Vercel**, que ainda não existe; a prova (reserva do totem aparece e é cancelada no painel de homologação do KMP); tirar o *Cloud Datastore User* da conta de escrita | nada — as Rules já estão no ar |
| **0 · a casa** | 2FA; rulesets na `main`; CI de PR nos dois repositórios (verificar, build, auditoria, **fumaça no preview**); push protection; Dependabot; `CODEOWNERS`; a API inteira subindo contra o emulador | nada — é gratuito e não muda o que está no ar |
| **0b · o contrato no CI** *(novo, era da fase 3)* | ~~`fluviapp-kmp` e `fluviapp` em `navegsistemas`~~ (feito em 2026-09-23); token da org só de leitura; os jobs **contrato** e **emulador** no CI daqui e da API | nada |
| **1 · homologação estável** | ~~branch `producao` criada a partir da `main` e configurada como *Production Branch*~~ (feito em 2026-09-24, com o ruleset e a primeira promoção, #3); domínios fixos de homologação; widget de homologação do Turnstile; Upstash de homologação; `ORIGENS_PERMITIDAS` e `PUBLIC_URL_DA_API` por ambiente; a trava ambiente × projeto (e chave Web) | D3, D4 (domínio de homologação) |
| **2 · produção** | **depois que o KMP ligar a produção dele** (§7); contas no projeto novo, a de escrita sem papel no Firestore (ou OIDC com *Token Creator*); chave Web de produção; widget e Upstash de produção; domínio; Vercel Pro; ruleset de `producao` com aprovação; o primeiro PR de promoção | produção do KMP, D2, D4, D8 |
| **3 · endurecimento** | OIDC sem chave em homologação também; *log drain*; alerta de catálogo vazio | — |

A fase A e a 0 cabem em sessões curtas e não dependem de decisão nenhuma. A fase 2 **não deve começar** antes
de o KMP criar o projeto de produção e publicar as Rules nele: ligar a agência antes grava num banco sem Rules
de reserva e sem centralizador para tratá-las.

## 11. Decisões para o PO *(revisto)*

| | decisão | situação |
|---|---|---|
| **D1** | Qual é o projeto Firebase de produção? | ✅ **Decidida (2026-09-23):** um projeto novo, criado pelo KMP quando for a hora de entrar em produção; o `fluvi-app-dev` fica para dev e homologação |
| **D2** | Vercel Pro para produção? | Aberta. Recomendação: **sim**, num time da NAVEG. O Hobby é não comercial pelos termos da Vercel, e produção de uma empresa nele é risco de ter o deploy pausado |
| **D3** | Trunk-based com promoção (`main` → `producao`)? | Recomendação: **sim**, como no §4 — e é o que o KMP adotou (ADR-0012 de lá) |
| **D4** | Os domínios | Aberta. Recomendação: `agencia.naveg.com.br`/`api.naveg.com.br` em produção; `homolog.` e `api-homolog.` em homologação |
| **D5** | Mover `fluviapp` e `fluviapp-kmp` para a org? | ✅ **Feita (2026-09-23).** Com repositórios privados numa org free não há regra de ramo nem *Environments*: a aprovação obrigatória do PR de promoção do KMP pede o plano Team, ou continua como hoje (as três travas do ADR-0012 de lá). Atenção aos minutos de Actions: privado numa org free divide 2.000 min/mês, e o instalador do Desktop roda em Windows, que conta em dobro |
| **D6** | Os repositórios da agência voltam a ser privados? | **Indiferente para a segurança**; só vale se a Vercel for Pro. Recomendação: manter públicos até lá |
| **D7** | Quem aprova a promoção para produção? | O PO, com uma segunda pessoa como suplente — aprovação de uma pessoa só trava férias |
| **D8** | Sem chave JSON em produção (OIDC) desde o início? | Recomendação: **sim** — mas custa um pouco mais do que antes: a conta de escrita assina o token de serviço pelo IAM, e ganha *Token Creator* sobre si mesma (§6) |
| **D9** *(novo)* | O que a página `/r/{codigo}` mostra? | Aberta. Recomendação: **estática na Fase 1** — o código e a orientação ao atendente. Mostrar a situação (aberta, cancelada, convertida) pede um `GET` público na API e faz do código uma senha; se vier, sem nome nem telefone e com limite por IP |

**Decorrente, e registrado para não se perder:** com o app Android original como legado, o deeplink de
`/r/{codigo}` (App Links) vai para o **app móvel do KMP**, quando ele existir — não para o legado. Até lá, a
página abre no navegador, e o atendente acha a reserva pelo código no painel.
