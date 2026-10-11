---
name: retomar
description: Retoma o projeto NAVEG (naveg-front e naveg-api-vercel) do ponto onde parou. Usar quando o PO perguntar "onde paramos?", "o que falta?", "por onde seguimos?" ou abrir uma sessão nova querendo continuar o trabalho.
---

# Retomar — "onde paramos?"

O objetivo é chegar ao PO com **o estado real**, não com o que a issue dizia. A issue "Onde paramos" pode estar
atrasada: o PO junta PRs e decide coisas entre uma sessão e outra.

## Passos

1. **Ler as issues fixadas "Onde paramos"** (rótulo `onde-paramos`): a daqui, a da API e a do KMP. Uma issue, e não
   um arquivo, para não pedir PR a cada atualização (PO, 2026-10-11):

   ```bash
   for r in naveg-front naveg-api-vercel fluviapp-kmp; do
     echo "== $r"; gh issue list -R navegsistemas/$r --label onde-paramos --state open --json body --jq '.[0].body'
   done
   ```

2. **`docs/roteiro-de-ui-ux.md`, §9 (o quadro) e §10 (as fichas)**: em que passo do ritual está cada seção da
   interface, e o que o PO já decidiu.
3. **O que está aberto no GitHub**, nos três repositórios. Para cada PR que a issue dava como aberto, ver se foi
   juntado:

   ```bash
   for r in naveg-front naveg-api-vercel fluviapp-kmp; do
     echo "== $r"; gh pr list -R navegsistemas/$r; gh issue list -R navegsistemas/$r
   done
   ```

4. **O que está local e não foi para o GitHub**: `git fetch`, `git status -sb` e `git branch -vv` nos dois
   checkouts (branch sem `origin/` ou com `ahead` é trabalho que só existe aqui). No fluviapp-kmp, só ler pelo `gh`.
5. **Rodar os testes na `main` atualizada**, nos dois checkouts: `git pull` e `npm run verify` (pelo PowerShell,
   com `$env:NPM_TOKEN = gh auth token`; na API, `npm ci` antes se faltar o `node_modules`). O "verde" da issue é
   de um commit; o da sessão é o de agora. Vermelho na `main` vem antes de qualquer próximo passo.

## Antes de propor o próximo passo

- **Se a API vai ser promovida**: lembrar o PO do que a próxima promoção leva (a issue da API diz) e do roteiro
  de conferência em `docs/RUNBOOK.md` §5 — catálogo e uma reserva gravada logo depois, com `vercel rollback` à
  mão. Promover é do PO.
- **Se há PR esperando o PO** (conferir no celular, decidir uma ficha): dizer isso primeiro; não começar a
  seção seguinte por cima (ritual do roteiro, §1).
- **Dependabot**: o major do TypeScript (front #13, API #10) está parado de propósito (ver `CLAUDE.md`). Os
  demais grupos podem ser revistos e propostos para merge.

## Resposta ao PO

Curta, em português: onde estamos (o que está no ar, o que espera ele, o que espera outro repositório), o
resultado dos testes, e **um** próximo passo recomendado, com o porquê. Decisão de produto vai como pergunta com
recomendação; decisão técnica o Claude toma e relata.

Se o estado mudou desde a issue, **reescrevê-la** (skill `salvar-onde-paramos`). Não pede PR.
