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
| 7–8 | Domínio da reserva e a ilha do totem | — |
| 9–12 | Firestore, WhatsApp, deeplink, endurecimento | — |

O plano completo, passo a passo, está em [`docs/plano-de-implementacao.md`](docs/plano-de-implementacao.md).

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
packages/domain/          o domínio da reserva.              Sem React, sem Firebase.   (passo 7)
packages/ui/              as telas do totem, controladas.                                (passo 8)
packages/dados/           a porta e o adaptador Firestore.                               (passo 9)
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
- **Ratificação do analista** para tornar `rotas`, `portos`, `viagens` e `embarcacoes` ativos legíveis
  publicamente — é a única ampliação de leitura que o projeto propõe (passo 9).
