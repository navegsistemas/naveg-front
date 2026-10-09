# naveg-front — o que o Claude precisa saber

Este arquivo e as skills em `.claude/skills/` são o contexto do projeto para o Claude Code. Estão no
repositório para valer em qualquer máquina: a memória local do Claude não viaja.

## Quem é quem

- **Matheus (Kurt Matheus Sampaio de Matos) é analista de sistemas e de requisitos, e PO** do `naveg-front`, do
  `naveg-api-vercel` e do fluviapp. Ele decide requisito, prioridade e regra de negócio; a implementação é do
  Claude.
- Decidir sozinho o que é de engenharia (biblioteca, formato, estrutura de pasta, como testar) e só relatar.
  Levar ao PO o que muda produto, prazo, custo, risco ou regra de negócio — **com recomendação e trade-off**,
  não com um menu de opções técnicas. Quando uma escolha técnica tem consequência de negócio (custo, bloqueio,
  dado pessoal), explicar a consequência primeiro.
- Comentários "palavra do analista" ou "decisão do analista" no código do fluviapp são dele.
- Escrever em português, no tom do README: frases curtas, o porquê junto da regra.

## Onde mora o estado

Não há estado fora do repositório. Ao retomar, ler nesta ordem (a skill `retomar` faz isso):

1. o **"Retomar daqui"** do [README](README.md) — onde paramos e o próximo passo;
2. o [roteiro de UI/UX](docs/roteiro-de-ui-ux.md), **§10 (as fichas)** — o estado de cada seção da interface;
3. o "Retomar daqui" do README do `naveg-api-vercel` (em `../naveg-api-vercel`);
4. os PRs e issues abertos nos três repositórios (`navegsistemas/naveg-front`, `naveg-api-vercel`, `fluviapp-kmp`).

O plano é um só, para front e API: [docs/plano-de-implementacao.md](docs/plano-de-implementacao.md). Decisões
de arquitetura em [docs/adr/](docs/adr/); operação em [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Como o trabalho anda

- **Interface (a 7.1): seção por seção, com calma**, pelo ritual do roteiro (§1): levantamento → análise →
  wireframe → decisão do PO → implementação. Não pular nem juntar seções; não implementar antes de decidir.
  Skill: `secao-de-ui`.
- **Um PR pequeno por assunto**, num branch próprio a partir da `main`. Commits em português, título curto
  ("UI 1.2: …", "Onde paramos: …"), corpo dizendo o porquê e citando o pedido do PO com data.
- **Pendência de outro repositório vira issue lá** (`gh issue create -R navegsistemas/<repo>`), com a decisão do
  PO, o porquê, o que muda, a ordem entre repositórios e o que acontece enquanto não muda — não PR de docs nem
  nota em plano. Citar a issue no PR/README daqui. Padrão do PO desde fluviapp-kmp#41.
- **Não mexer no checkout local do fluviapp-kmp**: ele pode estar num branch em andamento.
- Ao encerrar, quando o PO pedir "salva onde paramos": skill `salvar-onde-paramos`.

## O que só o PO faz

- **Promover a API** para a homologação (`vercel promote`) e qualquer ação em produção. O Claude confere
  depois, por `gh api repos/navegsistemas/naveg-api-vercel/deployments?environment=Production` e `vercel logs`.
- Conferir no celular, na homologação, o que foi para o ar.
- Mergear Dependabot de major com decisão pendente (ver "Pendências técnicas").

## Lições técnicas (já custaram caro)

- **Arquivos em CRLF** (`core.autocrlf=true`): troca multilinha por script/sed falha — usar a ferramenta de
  edição. `sed` com `#` no texto quebra quando `#` é o delimitador.
- **Vitest pelo PowerShell.** Pelo Git Bash com cwd `/c/...` quebra ("reading 'config'").
- **`NPM_TOKEN`** (para o `@navegsistemas/domain` no GitHub Packages) = `gh auth token`. Se a sessão não tiver:
  `$env:NPM_TOKEN = gh auth token` no próprio comando.
- **Nunca matar todos os `node.exe`** da máquina. Parar só o processo que a sessão subiu.
- **Astro 7:** o CSP não dá hash a `<script is:inline>` (usar script processado, que sai inline com hash); estilo
  escopado não alcança o `<svg>` do `Icone` (envolver em `<span>`); um `astro preview` por projeto
  (`--ignore-lock` sobe outro ao lado).
- **Rolagem suave:** o CSS sozinho reabre o defeito de 2026-10-05 (15/128 falhas no E2E); quem resolve é o
  `RolagemQueChega.astro`.
- Se `git`/`node` sumirem da sessão, o PATH está velho: reabrir o VS Code; usar `npm.cmd`.

## Comandos

`npm run verify` (typecheck + astro check + vitest) · `npm run e2e` · `npm run conferir:lighthouse` ·
`npm run dev`. O 1 teste pulado do verify é a "camada 2 · obrigatória" do contrato (só no CI, com
`CONTRATO_OBRIGATORIO`).

## Pendências técnicas paradas de propósito

- **TypeScript 7 (PR #13, e #10 na API):** parado por decisão do PO. Dois bloqueios: (1) `tsc -p e2e` não acha
  `process` do TS 6 em diante — a correção está no branch `fix/tipos-do-node-no-e2e`; (2) o `astro check` recusa
  o TS 7.0 (o suporte experimental vem com o TS 7.1, via `@astrojs/ts-content-mapper`). Quando voltar: conferir
  se o Astro já suporta, abrir o PR do branch e fechar o #13.

## Outras máquinas e repositórios

Preparar uma máquina nova: skill `preparar-maquina`. O fluviapp-kmp mora em `~/AndroidStudioProjects/fluviapp-kmp`
e o fluviapp original em `~/Documents/AndroidStudioProjects/fluviapp` (fora de `VSCodeProjects`).
