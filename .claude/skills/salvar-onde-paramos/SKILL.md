---
name: salvar-onde-paramos
description: Registra onde o trabalho do projeto NAVEG parou, nas issues fixadas "Onde paramos" do naveg-front e do naveg-api-vercel, para retomar em qualquer máquina. Usar quando o PO disser "salva onde paramos", "vamos encerrar", "registra o estado" ou ao fechar um dia de trabalho com decisões novas.
---

# Salvar onde paramos

O estado vive na **issue fixada "Onde paramos"** (rótulo `onde-paramos`) de cada repositório — a do `naveg-front`
e a do `naveg-api-vercel` —, e não num arquivo: a memória local do Claude não viaja entre máquinas, e um arquivo
pedia um PR a cada atualização (PO, 2026-10-11, o mesmo padrão do fluviapp-kmp#48). É ela que a skill `retomar`
lê primeiro.

```bash
n=$(gh issue list -R navegsistemas/naveg-front --label onde-paramos --state open --json number --jq '.[0].number')
gh issue view "$n" -R navegsistemas/naveg-front --json body --jq .body      # o que está lá agora
```

## O que escrever

**Reescrever o corpo inteiro** com a data de hoje (`## AAAA-MM-DD`): a issue é o estado, não um diário. O que já
foi feito sai; o histórico fica nas edições da issue e nos PRs. Não comentar para atualizar, e não abrir outra
issue.

Manter as mesmas partes:

- **Na `main`:** o commit, até que PR, e o resultado do `npm run verify` nesse commit (rodar antes de escrever).
- **Interface (só no front):** uma linha por seção em andamento; o detalhe mora no roteiro.
- **Em PR:** o que espera merge, e por quê.
- **Esperando o PO:** conferir no celular, promover a API, decidir uma ficha, ação na máquina.
- **Próximas tarefas, pela ordem:** com o número da issue de cada uma.
- **Pendências que não podem ser esquecidas:** prazos (vencimento de chaves), configuração que não está no código.
- **Nos outros repositórios:** uma linha cada, só o que afeta este.

Datas sempre absolutas (`2026-10-11`). Links para arquivos do repositório, absolutos
(`https://github.com/navegsistemas/naveg-front/blob/main/...`): a issue não resolve caminho relativo.

## O que continua indo para o repositório, num PR

Decisão nova do PO vai **também** para onde ela mora, com data — e isso sim vai no PR da entrega (ou num
`roteiro/onde-paramos-<assunto>` da `main`, se não houver entrega):

1. **`docs/roteiro-de-ui-ux.md`**: o quadro (§9) e a ficha da seção (§10) — decisões do PO, wireframe (link do
   artifact) e o PR da implementação.
2. **Tabela "Estado"** do README, se um passo do plano mudou.
3. **"Pendências conhecidas"** do README: decisões de negócio novas do PO (privacidade, marca, contador, prazos),
   datadas, com o porquê.
4. **`CLAUDE.md`**: só se surgiu uma lição técnica que vale sempre, ou uma regra nova de como trabalhar.

A issue só aponta para elas.

## Como gravar

- Escrever o texto num arquivo do scratchpad pela ferramenta de escrita (heredoc longo quebra no Git Bash) e
  `gh issue edit "$n" -R navegsistemas/<repo> --body-file <arquivo>` — pelo Git Bash: pelo PowerShell 5.1 o texto
  pode ganhar BOM.
- Se a issue não existir (foi fechada por engano), recriá-la com `gh issue create --title "Onde paramos" --label
  onde-paramos` e `gh issue pin`.
- Trabalho que outro repositório precisa fazer vira **issue lá**, não nota aqui.
- Conferir `git branch -vv` nos dois repositórios: branch local sem push é estado que se perde com a máquina —
  avisar o PO e, se for trabalho que vale guardar, fazer o push.
- No fim, dizer ao PO em duas linhas onde ficou e qual é o próximo passo, com o link da issue.
