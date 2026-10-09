---
name: retomar
description: Retoma o projeto NAVEG (naveg-front e naveg-api-vercel) do ponto onde parou. Usar quando o PO perguntar "onde paramos?", "o que falta?", "por onde seguimos?" ou abrir uma sessão nova querendo continuar o trabalho.
---

# Retomar — "onde paramos?"

O estado mora nos repositórios, não na memória do Claude. Ler, nesta ordem:

1. **`README.md`, seção "Retomar daqui"**, do `naveg-front`: o dia mais recente no topo, com o próximo passo.
2. **`docs/roteiro-de-ui-ux.md`, §9 (o quadro) e §10 (as fichas)**: em que passo do ritual está cada seção da
   interface, e o que o PO já decidiu.
3. **`../naveg-api-vercel/README.md`, seção "Retomar daqui"**: o que está no ar e o que espera promoção.
4. **O que está aberto no GitHub**, nos três repositórios:

   ```bash
   gh pr list -R navegsistemas/naveg-front
   gh pr list -R navegsistemas/naveg-api-vercel
   gh pr list -R navegsistemas/fluviapp-kmp
   gh issue list -R navegsistemas/naveg-front
   gh issue list -R navegsistemas/naveg-api-vercel
   ```

5. **O que está local e não foi para o GitHub**: `git status` e
   `git branch -vv` nos dois checkouts (branch sem `origin/` ou com `ahead` é trabalho que só existe aqui).

## Antes de propor o próximo passo

- **Se a API vai ser promovida**: lembrar o PO do que a próxima promoção leva (o "Retomar daqui" da API diz) e
  do roteiro de conferência em `docs/RUNBOOK.md` §5 — catálogo e uma reserva gravada logo depois, com
  `vercel rollback` à mão. Promover é do PO.
- **Se há PR esperando o PO** (conferir no celular, decidir uma ficha): dizer isso primeiro; não começar a
  seção seguinte por cima (ritual do roteiro, §1).
- **Dependabot**: o major do TypeScript (front #13, API #10) está parado de propósito (ver `CLAUDE.md`). Os
  demais grupos podem ser revistos e propostos para merge.

## Resposta ao PO

Curta, em português: onde estamos (o que está no ar, o que espera ele, o que espera outro repositório), e **um**
próximo passo recomendado, com o porquê. Decisão de produto vai como pergunta com recomendação; decisão técnica
o Claude toma e relata.
