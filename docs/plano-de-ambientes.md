# Plano de ambientes e da esteira — desenvolvimento, homologação e produção

> **Proposta de 2026-09-23.** Escrita depois de a API ir ao ar, para arrumar a casa antes que "tudo é dev" vire
> hábito. Cobre os dois repositórios da agência — este e a [`naveg-api-vercel`](../../naveg-api-vercel) — e o
> que eles dependem do fluviapp. As decisões que não são técnicas estão marcadas **[D1]…[D8]** e reunidas no
> fim, cada uma com uma recomendação.

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
| **Org no GitHub** | `navegsistemas`, plano free, 3 membros, **2FA não obrigatório** | um token vazado de qualquer membro chega aos dois repositórios públicos |
| **Repositórios do fluviapp** | `fluviapp` e `fluviapp-kmp` **privados, na conta pessoal** | o CI daqui não consegue clonar o contrato; a continuidade depende de uma pessoa |

O que já está certo, e o plano preserva: segredo nenhum no repositório, a conta de leitura separada da de
escrita, a configuração que falha na partida, e o domínio versionado por tag.

## 2. Princípios

1. **Um ambiente não enxerga o outro.** Cada um tem o próprio banco, as próprias contas, as próprias chaves e o
   próprio contador de limite. Um preview não tem credencial de produção — nem por engano, nem por herança de
   variável.
2. **Produção só recebe o que passou por homologação.** O mesmo commit, já testado — não um parecido.
3. **A máquina confere, a pessoa decide.** Cenário, tipo, orçamento de bundle e varredura de segredo são
   automáticos e bloqueiam o merge; ir para produção é um ato explícito, com aprovação.
4. **Os ambientes daqui seguem os do fluviapp.** A agência lê e grava no Firestore **do aplicativo**: a reserva
   feita no totem de homologação tem de aparecer no aplicativo de homologação. Por isso não existe "produção da
   agência" antes de existir "produção do fluviapp" (ver §7).
5. **Tudo o que for possível sem pagar, agora; o que custa, com decisão.**

## 3. Os três ambientes

| | **Local** (dev) | **Homologação** (preview) | **Produção** |
|---|---|---|---|
| **Para quê** | escrever e testar código | ver a mudança inteira funcionando, com dados de teste, antes de ir ao ar; é onde o PO e o atendimento aprovam | o público |
| **Quem usa** | quem desenvolve | PO, atendimento, testadores do aplicativo de homologação | clientes da NAVEG |
| **Firestore** | **emulador** (o do repositório do fluviapp, com as Rules de lá) | `fluvi-app-dev` | **projeto de produção do fluviapp** [D1] |
| **Credencial do Google** | nenhuma (o emulador dispensa) | contas `naveg-api-leitura`/`-escrita` do `fluvi-app-dev` | contas próprias, **no projeto de produção** |
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
  credencial na máquina.
- **A API confere, na partida, que o ambiente e o projeto combinam.** Com `VERCEL_ENV=production`, o
  `FIREBASE_PROJECT_ID` tem de ser o de produção; com `preview`, **não pode** ser. É a trava contra a variável
  errada no ambiente errado — o erro mais provável desta configuração, e o mais caro.
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
| `producao` | o que está em produção | **só por PR vindo da `main`** | tudo o que a `main` tem + **aprovação obrigatória** + só fast-forward da `main` |

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
  do merge de release — exatamente quando menos se quer surpresa. Aqui `producao` nunca tem commit próprio.

## 5. A esteira: CI no GitHub Actions

Tudo roda em **pull request** e em push na `main`; os jobs marcados **✱** são checks obrigatórios do ruleset.
Actions é gratuito em repositório público.

### `naveg-front`

| job | o que faz |
|---|---|
| **✱ verificar** | `npm ci`, `typecheck`, `astro check`, cenários |
| **✱ contrato com o fluviapp** | clona o fluviapp (token de leitura, §6) e roda a camada 2 do contrato — sem isso os 21 cenários que leem o Kotlin ficam pulados para sempre no CI |
| **✱ build e orçamento** | `npm run build` com as variáveis de homologação; confere o orçamento de JavaScript (0 kB fora da ilha; teto declarado para a ilha) e **varre o `dist/`** por qualquer coisa com cara de credencial |
| **publicar o domínio** | o que já existe: por tag `domain-v*`, depois de `verify` |

### `naveg-api-vercel`

| job | o que faz |
|---|---|
| **✱ verificar** | `npm ci` (o pacote do domínio lido com o `GITHUB_TOKEN`, §6), `typecheck`, cenários |
| **✱ emulador** | sobe o emulador do Firestore com as **Rules do fluviapp** e grava uma reserva de ponta a ponta pela conta de serviço — o item do aceite do passo 10 que falta |
| **✱ auditoria** | `npm audit --omit=dev --audit-level=high` |
| **fumaça pós-deploy** | disparado pelo `deployment_status` da Vercel: `GET /saude` e `GET /catalogo` no ambiente que acabou de subir; em produção, falha abre uma issue |

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
| conta de escrita do Google | — (emulador) | `fluvi-app-dev` | projeto de produção | Vercel |
| `TURNSTILE_SECRET` | chave de teste | widget de homologação | widget de produção | Vercel |
| `UPSTASH_*` | — | banco de homologação | banco de produção | Vercel |
| token do pacote do domínio | `NPM_TOKEN` da pessoa | leitura por repositório (abaixo) | idem | Vercel / GitHub |
| leitura do fluviapp no CI | — | — | — | GitHub (secret do repositório) |

- **Sem chave JSON, em produção.** A Vercel emite um token OIDC por deploy, e o *subject* dele diz o ambiente:
  `owner:<time>:project:<projeto>:environment:production`. No Google Cloud, a *Workload Identity Federation*
  deixa **só esse subject** agir como a conta de produção. Resultado: não há chave para vazar, e um preview
  **não consegue** usar a identidade de produção nem se a variável for copiada errada. É a troca da "chave
  JSON na Fase 1" registrada no README da API. Custa uma mudança pequena na conexão (`conexao.ts`) e a
  configuração no GCP; homologação pode continuar com JSON por enquanto.
- **O pacote do domínio sem PAT no CI.** No GitHub Packages, o pacote pode conceder leitura ao repositório da
  API (*Manage Actions access*); o CI lê com o `GITHUB_TOKEN`, que expira sozinho. O `NPM_TOKEN` pessoal fica
  só na Vercel e nas máquinas — e com a Vercel lendo por um token de **conta técnica**, não de uma pessoa.
- **Rotação**: chave JSON a cada 90 dias (a primeira vence por volta de 2026-12-22); tokens do Upstash e o
  segredo do Turnstile, a cada saída de alguém com acesso.

## 7. O acoplamento com o fluviapp (e o KMP)

A agência não tem banco próprio: ela lê o catálogo **do aplicativo** e grava reservas que **o aplicativo**
converte em passagens. Isso amarra os ambientes daqui aos de lá:

| fluviapp | agência |
|---|---|
| aplicativo de homologação (App Distribution, grupo `homologacao`) → `fluvi-app-dev` | homologação → `fluvi-app-dev` |
| aplicativo de produção (grupo `producao`) → **hoje também `fluvi-app-dev`** | produção → **o mesmo projeto do aplicativo de produção** |

**Enquanto o aplicativo de produção usar o `fluvi-app-dev`, "produção da agência" não tem banco próprio para
usar.** Há dois caminhos, e a escolha é de quem responde pelo fluviapp — o que torna a migração do KMP o
momento natural para decidir [D1]:

- **o KMP nasce com um projeto de produção** (recomendado): o `fluvi-app-dev` volta a ser só de
  desenvolvimento e homologação; a agência aponta a produção para o projeto novo, com contas novas. As Rules,
  os índices e a regra de `reservas` passam a ser publicados **nos dois projetos** pela esteira de lá (o
  `regras.yml` já tem o gatilho manual; ganha o projeto como parâmetro).
- **o `fluvi-app-dev` vira oficialmente o projeto de produção** (renomear não dá; é só assumir): então é
  homologação que precisa de um projeto novo, com cadastro de teste. Mais barato hoje, mais confuso sempre —
  o nome mente.

Dois ajustes que valem nos dois caminhos:

- **mover `fluviapp` e `fluviapp-kmp` para a org `navegsistemas`** [D5]: o CI daqui passa a clonar o contrato
  com um token da org, e o sistema central deixa de depender de uma conta pessoal;
- **quando o KMP virar o centralizador**, o contrato de enums passa a apontar para ele, e se ele expuser API
  própria de catálogo e reserva, esta API pode ser aposentada — o README dela já prevê isso, e a separação de
  ambientes deste plano vale igual para a do KMP.

## 8. A casa do GitHub e da Vercel

| o quê | hoje | proposta | custo |
|---|---|---|---|
| **2FA na org** | não obrigatório | **obrigatório** | — |
| **Rulesets** | nenhum | `main` e `producao` como no §4 | — |
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

## 10. A ordem

| fase | o quê | depende de |
|---|---|---|
| **0 · a casa, hoje** | 2FA; rulesets na `main`; CI de PR nos dois repositórios (verificar, build, auditoria); push protection; Dependabot; `CODEOWNERS`; a API aceitando o emulador | nada — é gratuito e não muda o que está no ar |
| **1 · homologação estável** | branch `producao` criada a partir da `main` e configurada como *Production Branch*; domínios fixos de homologação; widget de homologação do Turnstile; Upstash de homologação; `ORIGENS_PERMITIDAS` e `PUBLIC_URL_DA_API` por ambiente; a trava ambiente × projeto; o job do emulador; fumaça pós-deploy | D3, D4 (domínio de homologação) |
| **2 · produção** | projeto Firebase de produção e contas nele (ou OIDC); widget e Upstash de produção; domínio; Vercel Pro; ruleset de `producao` com aprovação; o primeiro PR de promoção | D1, D2, D4 |
| **3 · endurecimento** | OIDC sem chave em homologação também; *log drain*; alerta de catálogo vazio; o fluviapp na org com o contrato clonado no CI | D5 |

A fase 0 cabe numa sessão e não depende de decisão nenhuma. A fase 2 é a que **não deve começar** antes de D1:
ligar produção num banco que ainda é o de desenvolvimento só troca o nome do problema.

## 11. Decisões para o PO

| | decisão | recomendação |
|---|---|---|
| **D1** | Qual é o projeto Firebase de produção? | **Um projeto novo, criado com a migração do KMP**; o `fluvi-app-dev` fica para dev e homologação |
| **D2** | Vercel Pro para produção? | **Sim**, num time da NAVEG. O Hobby é não comercial pelos termos da Vercel, e produção de uma empresa nele é risco de ter o deploy pausado |
| **D3** | Trunk-based com promoção (`main` → `producao`)? | **Sim**, como no §4 |
| **D4** | Os domínios | `agencia.naveg.com.br`/`api.naveg.com.br` em produção; `homolog.` e `api-homolog.` em homologação |
| **D5** | Mover `fluviapp` e `fluviapp-kmp` para a org? | **Sim** — CI e continuidade |
| **D6** | Os repositórios da agência voltam a ser privados? | **Indiferente para a segurança**; só vale se a Vercel for Pro. Recomendação: manter públicos até lá |
| **D7** | Quem aprova a promoção para produção? | O PO, com uma segunda pessoa como suplente — aprovação de uma pessoa só trava férias |
| **D8** | Sem chave JSON em produção (OIDC) desde o início? | **Sim**: é a proteção mais forte do plano, e mais barata de fazer antes de haver produção do que depois |
