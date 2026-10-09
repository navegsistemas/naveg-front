---
name: preparar-maquina
description: Prepara uma máquina nova (ou restaurada) para trabalhar no naveg-front e no naveg-api-vercel — Node, gh, Vercel, NPM_TOKEN, Java, os checkouts e a conferência com verify. Usar quando o PO disser que trocou de máquina, formatou o PC, ou quando node/gh/vercel/npm ci falharem por falta de ambiente.
---

# Preparar a máquina

Feito pela última vez em 2026-10-08 (Windows 11, PowerShell). Conferir o que já existe antes de instalar.
Login em conta (GitHub, Vercel) é do PO: pedir que ele rode o comando de login quando chegar a hora.

## 1. Ferramentas

| o quê | versão | como |
|---|---|---|
| Node | 22 (o `.nvmrc` da API diz 22) | `winget install OpenJS.NodeJS.LTS` |
| Git | — | `winget install Git.Git` |
| GitHub CLI | — | `winget install GitHub.cli`, depois `gh auth login` (PO; conta `kurtmatheus`) com `read:packages` |
| Vercel CLI | — | `npm i -g vercel`, depois `vercel login` (PO; time `kurtmatheus-projects`) |
| Java | 17 | JDK 17 no PATH (só o `test:emulador` da API pede; não precisa `JAVA_HOME`) |

Depois de instalar, reabrir o VS Code para o PATH novo valer. Se `git`/`node` não aparecerem, é o PATH velho.

## 2. O token do GitHub Packages

O `@navegsistemas/domain` vem do GitHub Packages; o `.npmrc` dos dois repositórios lê `NPM_TOKEN`. Decisão do
PO: `NPM_TOKEN` = `gh auth token`. No perfil do PowerShell (`notepad $PROFILE`):

```powershell
$env:NPM_TOKEN = gh auth token
```

Se o perfil não rodar: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` (PO decide). Numa sessão sem a
variável, pôr `$env:NPM_TOKEN = gh auth token;` na frente do comando.

## 3. Os checkouts

```powershell
cd ~/VSCodeProjects
gh repo clone navegsistemas/naveg-front
gh repo clone navegsistemas/naveg-api-vercel
cd ~/AndroidStudioProjects
gh repo clone navegsistemas/fluviapp-kmp      # as Rules do Firestore, para o test:emulador da API
cd ~/Documents/AndroidStudioProjects
gh repo clone navegsistemas/fluviapp          # o fluviapp original: os padrões do teste de contrato
```

## 4. Instalar e conferir

**Pelo PowerShell** (o vitest pelo Git Bash com cwd `/c/...` quebra):

```powershell
cd ~/VSCodeProjects/naveg-front
npm ci; npx playwright install; npm run verify      # 1 teste pulado é o esperado (contrato, só no CI)
cd ../naveg-api-vercel
npm ci; npm run verify; npm run test:emulador
```

## 5. A API ligada à Vercel

Na API (não no front, que faz o deploy pelo GitHub): `vercel link` (projeto `naveg-api-vercel`) e
`vercel env pull .env.local` se for rodar `vercel dev`. **O `vercel link` acrescenta `.env*` ao `.gitignore`
— desfazer**, porque a regra de lá já cobre e precisa do `!.env.example`.

## 6. O Claude Code

O contexto do projeto está no repositório (`CLAUDE.md` e `.claude/skills/` de cada um). A memória local do
Claude começa vazia numa máquina nova, e tudo bem: rodar a skill `retomar`.
