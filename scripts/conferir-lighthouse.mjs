/**
 * **O Lighthouse de cada página, no perfil de celular** — a régua da 13.6: as quatro categorias (desempenho,
 * acessibilidade, boas práticas e SEO) em **90 ou mais**, em toda rota.
 *
 * Roda no CI de cada pull request (`.github/workflows/verificar.yml`) e à mão: `npm run conferir:lighthouse`.
 * Faz o build, sobe o `astro preview`, mede e o derruba.
 *
 * - **o build é o de demonstração** (`PUBLIC_URL_DA_API=demonstracao`): o totem lê o catálogo de demonstração, sem
 *   rede. Como no E2E, a régua não fica vermelha porque a API de homologação caiu ou demorou — e o que se mede
 *   é a página, não a API. O resto do build é o mesmo que vai ao ar;
 * - **página com `noindex` não é cobrada por ser indexável** — o `/totem` fica fora da busca de propósito
 *   (13.3, `conteudo/meta.ts`), e o Lighthouse tiraria 34 pontos de SEO por isso. Só essa auditoria sai; o resto
 *   do SEO continua valendo. Quem diz se a página tem `noindex` é o próprio HTML do `dist/`;
 *
 * - **as rotas são as de `e2e/rotas.ts`**, as mesmas do axe, do teclado e do sem-JavaScript: uma página nova —
 *   as da compra, cada uma no dia em que existir — entra na régua só por entrar na lista;
 * - **o perfil é o padrão do Lighthouse**, que é o de celular: tela pequena, CPU 4× mais lenta e rede 4G lenta,
 *   simuladas. É o celular de quem reserva no porto;
 * - **cada rota é medida três vezes, e vale a mediana** de cada categoria. O desempenho oscila de uma medição
 *   para outra na mesma máquina, e uma régua que falha por sorte vira régua que ninguém respeita;
 * - os relatórios em HTML ficam em `lighthouse/`, que o CI guarda quando falha.
 *
 * Baixar a régua é decisão, e se faz aqui, com o motivo no commit — como os tetos do `conferir-build.mjs`.
 */
import { execSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'

import { ROTAS } from '../e2e/rotas.ts'

const REGUA = 90
const MEDICOES = 3
const PORTA = 4322
const BASE = `http://localhost:${PORTA}`
const RELATORIOS = fileURLToPath(new URL('../lighthouse/', import.meta.url))
const DIST = fileURLToPath(new URL('../apps/agencia/dist/', import.meta.url))

const CATEGORIAS = [
  ['performance', 'desempenho'],
  ['accessibility', 'acessibilidade'],
  ['best-practices', 'boas práticas'],
  ['seo', 'SEO'],
]

/**
 * O `astro preview` do `dist/` recém-construído, numa porta que não briga com o `npm run dev` nem com o E2E.
 *
 * O Astro 7 só admite **um** preview por projeto: com outro de pé (o de alguém, em qualquer porta), o nosso não
 * subiria. `--ignore-lock` sobe este ao lado, sem tocar no outro. E a porta tem de estar **livre**: se já
 * houver quem responda nela, a régua mediria o build de outra pessoa sem ninguém perceber — então para antes.
 */
async function subirPreview() {
  if (await responde(BASE)) {
    throw new Error(`a porta ${PORTA} já tem quem responda; feche o que está nela (\`npx astro preview stop\`) e rode de novo`)
  }
  const preview = spawn(`npm run preview --workspace=@navegsistemas/agencia -- --port ${PORTA} --ignore-lock`, {
    shell: true,
    stdio: 'ignore',
  })
  return preview
}

async function responde(url) {
  try {
    return (await fetch(url)).ok
  } catch {
    return false
  }
}

async function esperar(url, prazoMs = 60_000) {
  const limite = Date.now() + prazoMs
  while (Date.now() < limite) {
    if (await responde(url)) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`o preview não respondeu em ${url}`)
}

/** A página leva `noindex`? Lido do HTML que vai ao ar, e não de uma lista que pudesse divergir dele. */
function semIndice(caminho) {
  const html = readFileSync(`${DIST}${caminho.replace(/^\//, '')}index.html`, 'utf8')
  return /<meta\s+name="robots"\s+content="[^"]*noindex/.test(html)
}

const mediana = (valores) => [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)]
const nomeDoArquivo = (caminho) => (caminho.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'inicio') + '.html'

execSync('npm run build', { stdio: 'inherit', env: { ...process.env, PUBLIC_URL_DA_API: 'demonstracao', PUBLIC_TURNSTILE_SITE_KEY: '' } })

/**
 * O Chrome, com até três tentativas. No runner do GitHub ele já demorou mais do que os 25 s que o
 * `chrome-launcher` espera por padrão para anunciar a porta (2026-10-08, no PR #41) — uma falha da máquina, não
 * da página, e que não pode virar régua vermelha. Cada tentativa espera 50 s, e o log do Chrome aparece se
 * todas falharem.
 */
async function abrirChrome(tentativas = 3) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await chromeLauncher.launch({
        chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
        maxConnectionRetries: 100,
        logLevel: tentativa === tentativas ? 'error' : 'silent',
      })
    } catch (erro) {
      if (tentativa === tentativas) throw erro
      console.warn(`o Chrome não abriu (tentativa ${tentativa} de ${tentativas}): ${erro.message}`)
    }
  }
}

const preview = await subirPreview()
const chrome = await abrirChrome()
const falhas = []

try {
  await esperar(BASE)
  mkdirSync(RELATORIOS, { recursive: true })

  for (const { caminho } of ROTAS) {
    const notas = Object.fromEntries(CATEGORIAS.map(([id]) => [id, []]))
    let relatorio = ''

    for (let i = 0; i < MEDICOES; i++) {
      const resultado = await lighthouse(`${BASE}${caminho}`, {
        port: chrome.port,
        output: 'html',
        logLevel: 'error',
        onlyCategories: CATEGORIAS.map(([id]) => id),
        skipAudits: semIndice(caminho) ? ['is-crawlable'] : [],
      })
      if (resultado === undefined) throw new Error(`o Lighthouse não devolveu resultado para ${caminho}`)
      for (const [id] of CATEGORIAS) notas[id].push(Math.round((resultado.lhr.categories[id].score ?? 0) * 100))
      relatorio = resultado.report
    }

    writeFileSync(`${RELATORIOS}${nomeDoArquivo(caminho)}`, relatorio)

    const linha = CATEGORIAS.map(([id, nome]) => {
      const nota = mediana(notas[id])
      if (nota < REGUA) falhas.push(`${caminho}: ${nome} ${nota} (medições ${notas[id].join(', ')}), abaixo de ${REGUA}`)
      return `${nome} ${nota}`
    })
    console.log(`${caminho.padEnd(16)} ${linha.join(' · ')}`)
  }
} finally {
  await chrome.kill()
  preview.kill()
  /* No Windows, o `npm` sobe o preview num processo filho que o `kill` acima não alcança. */
  if (process.platform === 'win32' && preview.pid !== undefined) spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore' })
}

if (falhas.length > 0) {
  console.error(`\nAbaixo da régua de ${REGUA} (relatórios em lighthouse/):`)
  for (const falha of falhas) console.error(`- ${falha}`)
  process.exit(1)
}
console.log(`\nToda página com ${REGUA} ou mais nas quatro categorias, no celular.`)
