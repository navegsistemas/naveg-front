/**
 * **Confere o `dist/` da agência antes de ele ir ao ar** — o orçamento de JavaScript e a varredura de credencial.
 *
 * Roda depois do `npm run build`, no CI de cada pull request (`.github/workflows/verificar.yml`), e à mão:
 * `npm run build && npm run conferir:build`.
 *
 * ### O orçamento
 *
 * A página é estática por padrão: **nenhum `<script src>` no HTML**. O JavaScript só desce pela ilha do totem,
 * que o Astro carrega quando a seção entra na tela. O que se mede é o gzip de cada arquivo em `_astro/`, em
 * dois tetos — o runtime do React (o `client.*.js`), que só muda quando o React muda, e todo o resto (a ilha e
 * o carregador do Astro), que é o que cresce com o código daqui. Os números estão no README ("O orçamento");
 * subir um teto é decisão, e se faz aqui, com o motivo no commit.
 *
 * ### A varredura
 *
 * Tudo em `dist/` é público. O que tem cara de credencial não pode estar lá: chave privada, JSON de conta de
 * serviço, token do Upstash, do GitHub ou do npm, a chave Web do Firebase (que é da API, não do front). A
 * chave **pública** do Turnstile vai no HTML de propósito, e não é procurada.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST = fileURLToPath(new URL('../apps/agencia/dist/', import.meta.url))

/** Em kB de gzip. Medido em 2026-09-25: runtime 67,1; ilha 13,9 + carregador 3,2. */
const TETO_DO_RUNTIME = 70
const TETO_DO_RESTO = 20

const CARA_DE_CREDENCIAL = [
  ['chave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['JSON de conta de serviço', /"(private_key|private_key_id|client_email)"\s*:/],
  ['chave do Google (a Web do Firebase é da API)', /AIza[0-9A-Za-z_-]{35}/],
  ['Upstash', /upstash\.io|UPSTASH_REDIS_REST_TOKEN/],
  ['token do GitHub', /\b(ghp|gho|ghs|ghu)_[0-9A-Za-z]{36}\b|github_pat_[0-9A-Za-z_]{40,}/],
  ['token do npm', /\bnpm_[0-9A-Za-z]{36}\b/],
  ['nome de variável secreta', /TURNSTILE_SECRET|FIREBASE_CONTA_DE_(LEITURA|ESCRITA)/],
]

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })
}

const falhas = []
const todos = arquivos(DIST)
/* kB decimal, como o Vite imprime no build: os números batem com o log dele. */
const kb = (bytes) => bytes / 1000

let runtime = 0
let resto = 0
for (const arquivo of todos.filter((a) => a.endsWith('.js'))) {
  const gzip = kb(gzipSync(readFileSync(arquivo)).length)
  const nome = relative(DIST, arquivo)
  if (/(^|[\\/])client\.[^\\/]+\.js$/.test(nome)) runtime += gzip
  else resto += gzip
  console.log(`  ${nome.padEnd(40)} ${gzip.toFixed(1).padStart(6)} kB gzip`)
}
console.log(`runtime do React: ${runtime.toFixed(1)} kB (teto ${TETO_DO_RUNTIME})`)
console.log(`ilha e carregador: ${resto.toFixed(1)} kB (teto ${TETO_DO_RESTO})`)
if (runtime > TETO_DO_RUNTIME) falhas.push(`o runtime do React passou do teto: ${runtime.toFixed(1)} kB > ${TETO_DO_RUNTIME} kB`)
if (resto > TETO_DO_RESTO) falhas.push(`a ilha e o carregador passaram do teto: ${resto.toFixed(1)} kB > ${TETO_DO_RESTO} kB`)

for (const arquivo of todos.filter((a) => a.endsWith('.html'))) {
  const html = readFileSync(arquivo, 'utf8')
  const externos = html.match(/<script\b[^>]*\bsrc=/g) ?? []
  if (externos.length > 0) falhas.push(`${relative(DIST, arquivo)}: ${externos.length} <script src> — a página deveria ser estática`)
}

for (const arquivo of todos) {
  const texto = readFileSync(arquivo, 'latin1')
  for (const [oQue, padrao] of CARA_DE_CREDENCIAL) {
    if (padrao.test(texto)) falhas.push(`${relative(DIST, arquivo)}: tem cara de credencial (${oQue})`)
  }
}

if (falhas.length > 0) {
  for (const falha of falhas) console.error(`✗ ${falha}`)
  process.exit(1)
}
console.log(`✓ ${todos.length} arquivos conferidos: orçamento dentro do teto, nenhuma cara de credencial`)
