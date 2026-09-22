# naveg-front

Agência virtual da **NAVEG — Turismo e Logística**. Single page institucional com uma seção inteira dedicada ao
**totem de reserva**.

A Fase 1 gera **reservas**, não vendas: o totem grava um pedido no Firestore e entrega o código ao atendimento
pelo WhatsApp, que emite a passagem pelo aplicativo. A venda online com cadastro é Fase 2.

## Estado

| passo | o que é | estado |
|---|---|---|
| 0 | Esqueleto do monorepo e ADRs | ✅ |
| 1 | `@naveg/design-system` — tokens, base, marca, ícones | ✅ |
| 2 | `apps/agencia` — casca Astro da single page | ✅ |
| 3 | Seção Capa — proposta, credenciais e a vitrine da flotilha | ✅ |
| 4 | Seção Atendimento — o argumento e quem atende | ✅ |
| 5 | Seção Avaliações — a vitrine e as redes da Meta | ✅ |
| 6 | Rodapé — identificação, contatos, endereços e o que a lei exige | ✅ |
| — | **A página institucional está completa e publicável, sem uma linha de Firebase** | 🏁 |
| 7 | `@naveg/domain` — a reserva, o roteiro do totem, o catálogo do fluviapp, o código `NVG-` e o codec | ✅ |
| 8 | Seção Totem — a ilha React, com catálogo de molde e porta em memória | — |
| 9 | Catálogo do fluviapp publicado no build | — |
| 10 | Escrita da reserva — **bloqueada** pela decisão do ADR-0002; Rules no fluviapp | — |
| 11–13 | WhatsApp; no aplicativo, a reserva vira passagem + deeplink; endurecimento | — |

O plano completo, passo a passo, está em [`docs/plano-de-implementacao.md`](docs/plano-de-implementacao.md).

## Retomar daqui

**Parei no fim do passo 7, revisado contra o aplicativo fluviapp** (`~/Documents/AndroidStudioProjects/fluviapp`,
a gestão comercial que alimenta a agência). O domínio da reserva e o catálogo existem e estão cobertos; nada
deles chega à página ainda. `npm run verify` deve dar **348 cenários verdes** (119 da exibição + 229 do
domínio), `astro check` sem nada, e o `dist/` com **zero arquivo JavaScript**.

Os 229 incluem 21 que **leem o Kotlin do aplicativo** (ou o que estiver em `FLUVIAPP_ORIGINAL`). Sem o
checkout eles aparecem como **pulados**, não como verdes — em outra máquina, `348 passed` vira
`327 passed | 21 skipped`, e isso é o esperado.

**Antes do passo 10 (a escrita) há um bloqueio de segurança, e ele é do fluviapp, não daqui** — ver
[ADR-0002, emenda de 2026-09-22](docs/adr/ADR-0002-a-escrita-client-side-e-o-que-a-protege.md). Em resumo: as
Rules do fluviapp liberam `passagens`, `users`, `funcionarios` e o catálogo inteiro para qualquer
`request.auth != null`, e a autenticação anônima que o plano previa **satisfaz isso**. Ligá-la no projeto
abriria esses dados a qualquer visitante do site.

**O próximo é o passo 8: a ilha React do totem.** Ele não depende do bloqueio — até o passo 10 nada sai do
navegador. Antes de abrir o primeiro `.tsx`:

1. **A ilha não monta nada.** `travessiasOfertadas` dá as saídas disponíveis com os rótulos e o contexto
   pronto; `roteiroDaReserva` dá o nó em foco **com as opções dentro**; `voltar` dá o "voltar";
   `montarReserva` dá a reserva ou as pendências; `gerarCodigoDaReserva` dá o código. Se aparecer vontade de
   escrever um `if` sobre acomodação, natureza ou casco num componente, a regra está faltando no domínio.
2. **O relógio é o do rio.** `agora` e `criadoEm` vêm de `InstanteLocal.emFuso(new Date(), fuso)`, com o fuso
   **da operação** — nunca o do navegador. Qual fuso (`America/Belem`? há portos em `America/Manaus`?) é
   decisão pendente; ver as pendências.
3. **`apps/agencia` passa a depender de `@naveg/domain`.** É a hora de consolidar
   `apps/agencia/src/conteudo/cnpj.ts` com `TipoDocumento.validar('CNPJ', …)`.
4. **O catálogo de exemplo da ilha** implementa `CatalogoDoFluviapp` com dado declaradamente fictício, em
   `test/` ou num arquivo que se anuncie como molde — pela mesma régua dos depoimentos.

O que está pendente de dado — fotos, nome e WhatsApp do atendente, depoimentos, URLs das redes, identificação
da empresa — continua sendo conteúdo, entra em arquivo de `conteudo/` e **não bloqueia nenhum passo
adiante**.

**Pendência operacional:** os branches do projeto antigo ainda estão no remoto. `main` já é o padrão.

```bash
git push origin --delete master dev dev-typescript test
```

## Comandos

```bash
npm install
npm run dev         # a página em http://localhost:4321
npm run build       # gera apps/agencia/dist
npm run verify      # typecheck + astro check + cenários
npm test            # só os cenários
```

### O orçamento

A página institucional entrega **0 kB de JavaScript** — hoje o `dist/` tem só o HTML, uma folha de estilo e o
SVG do logo. O único `<script>` do documento é o JSON-LD, que não executa. A integração do React entra no
passo 8, junto com a ilha do totem que a justifica, e o orçamento passa a ser "0 kB até alguém rolar até o
totem".

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
packages/ui/              as telas do totem, controladas.                                (passo 8)
packages/dados/           a porta (passo 8) e o adaptador Firestore (passo 10).
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
`Pagamento`** (não se vende aqui) e **com `CONTATO`** (a razão de ser da Fase 1). O ramo do veículo é o do
aplicativo: **natureza, depois classe** — e a classe só é perguntada quando há escolha naquele casco (num
navio, nunca) —, o formulário com a placa e a cilindrada da moto como únicos obrigatórios, e o **responsável
opcional**. As opções vêm dentro do nó: numa lancha, "Veículo" não é opção desabilitada, não é opção.

No aplicativo, quem limpa a resposta que ficou para trás ao trocar de escolha é o ViewModel. Aqui não há
ViewModel, então a garantia mora na leitura: **uma resposta só conta se estava entre as opções que o nó
ofereceu**, e `montarReserva` lê os nós do roteiro, não as respostas. A `'MEIA'` de uma rede abandonada não
vira meia numa suíte, e a van escolhida para um ferry não vira van num navio.

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

O contrato (`test/contrato-fluviapp.spec.ts`) confere contra o Kotlin do aplicativo não só os nomes dos enums,
mas **o que eles significam** — a natureza de cada classe, a carga de cada casco, a ocupação de cada
acomodação — e as chaves dos documentos que a agência lê e escreve. A primeira versão conferia só nomes, contra
o `fluviapp-kmp`, e passou verde com seis classes de veículo onde o aplicativo tem dezessete.

O codec (`paraDominio`) recusa em vez de inventar padrão: documento ilegível, estado misto, incoerente — ou
com **um** passageiro ilegível, que derruba a reserva inteira em vez de sumir da lista. Uma suíte para três que
chega ao atendente como suíte para dois é uma família com alguém sem bilhete no embarque.

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

O totem trata nome, documento, data de nascimento e telefone de quem reserva. Isso põe a NAVEG na lei como
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
- **Frequência de rebuild do catálogo** (passo 9): diário agendado mais disparo manual? E a **conta de serviço
  só de leitura** para o build, guardada como segredo do CI. O catálogo no build substitui a ampliação de leitura
  pública que o plano original propunha.
- **App Check no aplicativo** (Play Integrity) **antes** do enforcement no Firestore — sem isso, ligar o App
  Check para o totem derruba os atendentes (passo 10).
- **Bloqueio do passo 10 — autenticação anônima e as Rules do fluviapp.** Ver a emenda do ADR-0002. Precisa de
  decisão do lado do fluviapp antes de qualquer escrita pública.
- **O fuso da operação** — `America/Belem`, ou há portos no fuso de Manaus? O aplicativo usa o relógio do
  aparelho no porto e não precisa dizer; a web precisa.
- **A leitura do catálogo pelo público** — com as Rules atuais ela exige autenticação, e a autenticação
  anônima é justamente o que abre o resto (ver acima). A saída mais segura é o catálogo **gerado no build** a
  partir do fluviapp, que o plano já listava como alternativa; fica para o passo 9.
- **Dois padrões do fluviapp que o site herda por paridade**: viagem sem `horaMin` vira saída à meia-noite, e
  documento sem `ativo` é tratado como ativo. No balcão há quem perceba; no site, a saída das 00:00 aparece
  para o público. A correção, se houver, é no cadastro do fluviapp.
- **O `fluviapp-kmp` está atrás do aplicativo** — sem `ClasseVeiculo`, `NaturezaVeiculo` nem `TipoDocumento`.
  O contrato daqui passou a conferir contra o aplicativo; quando o KMP alcançá-lo, vale apontar para os dois.
- **DDD 55 em `telefone.ts`**: `digitosComPais` decide o código do país pelo prefixo `55`, e lê errado um
  número do centro do RS digitado sem `+55`. É inofensivo ali (o número conferido é o da NAVEG), e o domínio
  decide pelo comprimento para o número do cliente — mas a regra do app merece a mesma correção.
