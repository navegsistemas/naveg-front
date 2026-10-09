---
name: salvar-onde-paramos
description: Registra no repositório onde o trabalho do projeto NAVEG parou, para retomar em qualquer máquina. Usar quando o PO disser "salva onde paramos", "vamos encerrar", "registra o estado" ou ao fechar um dia de trabalho com decisões novas.
---

# Salvar onde paramos

O estado vai para o repositório, num PR — não para a memória local do Claude, que não viaja entre máquinas.

## O que atualizar

1. **`README.md` do `naveg-front`, seção "Retomar daqui"**: um bloco novo no topo, com a data
   (`**AAAA-MM-DD: …**`), dizendo:
   - o que foi para o ar (com os números dos PRs);
   - o que espera o PO (conferir, decidir) e o que espera outro repositório (com o número da issue);
   - **o próximo passo combinado**.
   Encurtar ou apagar os blocos antigos que ficaram velhos — o "Retomar daqui" é o estado, não um diário.
2. **`docs/roteiro-de-ui-ux.md`**: o quadro (§9) e a ficha da seção (§10) — decisões do PO **com data**,
   wireframe (link do artifact) e o PR da implementação.
3. **Tabela "Estado"** do README, se um passo do plano mudou.
4. **"Pendências conhecidas"** do README: decisões de negócio novas do PO (privacidade, marca, contador, prazos)
   entram aqui, datadas, com o porquê.
5. **`../naveg-api-vercel/README.md`, "Retomar daqui"**, se a API mudou — num PR de lá.
6. **`CLAUDE.md`**: só se surgiu uma lição técnica que vale sempre, ou uma regra nova de como trabalhar.

## Como entregar

- Branch `roteiro/onde-paramos-<assunto>` a partir da `main`, commit "Onde paramos: …", PR pequeno.
- Trabalho que outro repositório precisa fazer vira **issue lá**, não nota aqui.
- Conferir `git branch -vv` nos dois repositórios: branch local sem push é estado que se perde com a máquina —
  avisar o PO e, se for trabalho que vale guardar, fazer o push.
- No fim, dizer ao PO em duas linhas onde ficou e qual é o próximo passo.
