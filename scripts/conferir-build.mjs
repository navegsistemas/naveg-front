/**
 * **Confere o `dist/` da agência antes de ele ir ao ar** — o orçamento de JavaScript, a política, o mapa do
 * site e a varredura de credencial.
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
import { createHash } from 'node:crypto'

const DIST = fileURLToPath(new URL('../apps/agencia/dist/', import.meta.url))

/**
 * Em kB de gzip. Medido em 2026-09-25: runtime 67,1; ilha 13,9 + carregador 3,2.
 *
 * Em 2026-10-05 a segunda ilha (a encomenda, `docs/plano-da-reserva-de-encomenda.md`, §6) levou o resto a 22,8 (23,1 com a âncora no carregamento):
 * o pedaço comum das duas (domínio e telas) 15,4, o carregador 3,0, e cada ilha 2,1 e 2,2. O teto do resto subiu
 * de 20 para 25 — o que o plano previa, e a folga de ~2 kB que o de 20 tinha.
 */
const TETO_DO_RUNTIME = 70
const TETO_DO_RESTO = 25

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

/* A política de cada página (passo 13.1, `apps/agencia/src/conteudo/seguranca.ts`). O Astro a escreve; aqui se
   confere que nenhuma página ficou sem, que nada abriu `'unsafe-*'`, e que todo script e estilo escrito dentro
   da página tem o seu hash nela — um que não tenha é uma parte do site que o navegador vai barrar. */
const sha256 = (texto) => `'sha256-${createHash('sha256').update(texto).digest('base64')}'`
for (const arquivo of todos.filter((a) => a.endsWith('.html'))) {
  const html = readFileSync(arquivo, 'utf8')
  const nome = relative(DIST, arquivo)
  const politica = html.match(/<meta http-equiv="content-security-policy" content="([^"]*)"/i)?.[1]
  if (politica === undefined) {
    falhas.push(`${nome}: sem Content-Security-Policy`)
    continue
  }
  if (/'unsafe-/.test(politica)) falhas.push(`${nome}: a política abre ${politica.match(/'unsafe-[a-z-]+'/)[0]}`)
  if (/\sstyle="/.test(html)) falhas.push(`${nome}: tem atributo style="", que a política barra`)
  if (/<[a-z][^>]*\son[a-z]+="/i.test(html)) falhas.push(`${nome}: tem atributo on…="", que a política barra`)
  for (const [, tipo, corpo] of html.matchAll(/<(script|style)\b(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (!politica.includes(sha256(corpo))) falhas.push(`${nome}: um <${tipo}> da página não tem o hash na política`)
  }
}

/* O que a `<meta>` não alcança vai no cabeçalho (`apps/agencia/vercel.json`). */
const cabecalhos = Object.fromEntries(
  JSON.parse(readFileSync(new URL('../apps/agencia/vercel.json', import.meta.url), 'utf8'))
    .headers.find((regra) => regra.source === '/(.*)')
    ?.headers.map(({ key, value }) => [key.toLowerCase(), value]) ?? [],
)
for (const nome of ['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'permissions-policy']) {
  if (cabecalhos[nome] === undefined) falhas.push(`vercel.json: sem ${nome} em todas as rotas`)
}
if (!/frame-ancestors 'none'/.test(cabecalhos['content-security-policy'] ?? '')) {
  falhas.push(`vercel.json: sem frame-ancestors 'none' em todas as rotas`)
}

/* O mapa do site (passo 13.3, `apps/agencia/src/conteudo/meta.ts`): toda página que aceita busca está nele, e
   nada nele é página que recusa a busca ou que não existe. O `robots.txt` aponta para ele. */
/* O caminho com `/` também no Windows, onde o `relative` devolve `\`. */
const naRaiz = (nome) => todos.find((a) => relative(DIST, a).replaceAll('\\', '/') === nome)
const mapa = naRaiz('sitemap.xml') && readFileSync(naRaiz('sitemap.xml'), 'utf8')
const robots = naRaiz('robots.txt') && readFileSync(naRaiz('robots.txt'), 'utf8')
if (!mapa) falhas.push('sem sitemap.xml')
if (!robots) falhas.push('sem robots.txt')
else if (!/^Sitemap: https:\/\/[^\s]+\/sitemap\.xml$/m.test(robots)) falhas.push('robots.txt: sem a linha do Sitemap')
if (mapa) {
  const noMapa = new Set([...mapa.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map(([, caminho]) => caminho))
  for (const arquivo of todos.filter((a) => a.endsWith('.html'))) {
    const caminho = `/${relative(DIST, arquivo).replaceAll('\\', '/')}`.replace(/index\.html$/, '')
    const recusa = /<meta name="robots" content="[^"]*noindex/.test(readFileSync(arquivo, 'utf8'))
    if (!recusa && !noMapa.has(caminho)) falhas.push(`${caminho}: aceita busca e não está no sitemap.xml`)
    if (recusa && noMapa.has(caminho)) falhas.push(`${caminho}: está no sitemap.xml, mas tem noindex`)
    noMapa.delete(caminho)
  }
  for (const caminho of noMapa) falhas.push(`${caminho}: está no sitemap.xml, mas não existe no build`)
}

/* A política de privacidade acompanha o site (passo 13.4, `apps/agencia/src/conteudo/privacidade.ts`). Toda
   página declara aqui que parte da política a cobre: `hoje` (a reserva), `conta` (7.4) ou `compra` (7.6). Uma
   página nova que não esteja na tabela é build vermelho — quem a cria decide, ali, se a política precisa mudar.
   E a política tem de ter a parte (`data-cobre="…"`) de cada página no ar: a conta ou a compra não vão ao ar com
   a política ainda descrevendo um site que só reserva. */
const COBERTURA_DA_POLITICA = {
  '/': 'hoje',
  '/totem/': 'hoje',
  '/privacidade/': 'hoje',
}
const politicaDePrivacidade = naRaiz('privacidade/index.html') && readFileSync(naRaiz('privacidade/index.html'), 'utf8')
if (!politicaDePrivacidade) falhas.push('sem a política de privacidade (privacidade/index.html)')
else {
  const partes = new Set([...politicaDePrivacidade.matchAll(/data-cobre="([a-z]+)"/g)].map(([, parte]) => parte))
  for (const arquivo of todos.filter((a) => a.endsWith('.html'))) {
    const caminho = `/${relative(DIST, arquivo).replaceAll('\\', '/')}`.replace(/index\.html$/, '')
    const parte = COBERTURA_DA_POLITICA[caminho]
    if (parte === undefined) {
      falhas.push(`${caminho}: página nova sem parte da política declarada (COBERTURA_DA_POLITICA, em scripts/conferir-build.mjs)`)
    } else if (!partes.has(parte)) {
      falhas.push(`${caminho}: a política de privacidade não tem a parte "${parte}" (data-cobre) — ela muda antes da página ir ao ar`)
    }
  }
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
console.log(`✓ ${todos.length} arquivos conferidos: orçamento dentro do teto, política em toda página, sitemap.xml fiel às páginas, a política de privacidade cobrindo cada página, nenhuma cara de credencial`)
