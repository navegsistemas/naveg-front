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
| 4–6 | Seções de exibição: atendentes, feedback, rodapé | — |
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

## Pendências conhecidas

- **Razão social e CNPJ** da NAVEG, para o rodapé e o JSON-LD (passo 6).
- **Número de WhatsApp** do atendimento, em E.164 (passo 10).
- **Domínio de produção** e o SHA-256 do certificado de assinatura do app, para os App Links (passo 11).
- **Marcas da Meta**: os ícones de Facebook, Instagram e WhatsApp em `src/icones.ts` são simplificações para
  prototipagem. Substituir pelos arquivos oficiais dos brand centers antes do lançamento.
- **Ratificação do analista** para tornar `rotas`, `portos`, `viagens` e `embarcacoes` ativos legíveis
  publicamente — é a única ampliação de leitura que o projeto propõe (passo 9).
