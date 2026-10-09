---
name: secao-de-ui
description: Conduz uma seção da interface do site NAVEG pelo ritual do roteiro de UI/UX (levantamento, análise, wireframe, decisão do PO, implementação). Usar quando o trabalho for a 7.1 ou as etapas seguintes do roteiro — "vamos para a 1.3", "a próxima seção", "o wireframe da capa".
---

# Uma seção da interface, pelo ritual

A fonte é `docs/roteiro-de-ui-ux.md`: o ritual (§1), as réguas (§2), o quadro (§9) e as fichas (§10). Ler a
ficha da seção e as das anteriores antes de começar. **Uma seção por vez**: a próxima só começa quando a
anterior chegou à decisão do PO. Não juntar seções, não implementar antes de decidir.

## 1. Levantamento

Como a seção está hoje, no celular (360px) e no computador, em cada estado. Subir o site (`npm run dev`),
capturar as telas, ler o componente em `apps/agencia/src/componentes/` e o conteúdo em
`apps/agencia/src/conteudo/`. Registrar na ficha: o que o código já faz e o que se vê.

## 2. Análise

Achados curtos, cada um com o porquê, conferindo a seção contra as réguas da §2 (celular primeiro, laranja só
superfície, acessível de verdade, erros que levam ao WhatsApp, sem pressa falsa, dado pessoal no mínimo, sem
conteúdo inventado) e contra o que as etapas seguintes vão pedir dela (a venda online, a conta).

## 3. Proposta

- Wireframe **só daquela seção**, como Artifact privado do PO em claude.ai (celular e computador lado a lado).
- As perguntas ao PO, nomeadas por letra (A, B, C…), **cada uma com a recomendação** e o trade-off. Quando
  falta um dado que só o negócio tem (frequência das saídas, um texto, uma foto), dizer qual.
- Ficha atualizada no roteiro e PR "Onde paramos: …" com a seção "em análise, esperando o PO".

## 4. Decisão — do PO

Registrar na ficha cada decisão com a data; "está bom como está" também é decisão. O wireframe final vai no link.

## 5. Implementação

- Branch `ui/<n.n>-<secao>` a partir da `main`, um PR pequeno com só o que foi decidido.
- Conteúdo em `conteudo/*.ts`, componente em `componentes/*.astro`; fotos originais em `src/assets/`
  (o `astro:assets` gera os recortes).
- Cenário vitest do conteúdo, **E2E e axe da seção** (`npm run e2e`), `npm run verify` e
  `npm run conferir:lighthouse` (a régua é 90 nas quatro categorias, no celular; as seções feitas até aqui
  dão 100 — se cair, dizer no PR por quê).
- PR com o que o PO decidiu, com a data, e o que conferir na prévia. Depois do merge, o PO confere no celular.

## Lembretes

- CSP do Astro 7: script processado, não `is:inline`. Estilo escopado não alcança o `<svg>` do `Icone`.
- Pedidos do PO já guardados para seções futuras ficam no "Retomar daqui" e nas fichas — conferir antes da
  análise (ex.: recolher seções no celular na 1.5/1.6/1.7; "Minha conta" no menu do tablet na 7.4).
