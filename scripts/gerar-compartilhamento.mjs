/**
 * **Gera a imagem de compartilhamento** — o cartão que aparece ao mandar o link do site no WhatsApp (passo 13.3).
 *
 * `npm run gerar:compartilhamento` escreve `apps/agencia/public/compartilhamento.png`, e o PNG vai no commit:
 * o build não gera nada, só serve o arquivo. Rodar de novo só quando o logo, as cores ou a frase mudarem — ou
 * quando chegar a foto de uma embarcação, e a imagem passar a ser ela.
 *
 * O desenho é o logo empilhado sobre a areia (o fundo claro da página), com a frase em navy e uma faixa
 * laranja embaixo: o logo tem letra navy, e sobre fundo navy ele sumiria. Quem desenha é o Chromium do
 * Playwright, que já está no projeto para o E2E. As medidas e a frase são as de `SITE.imagemDeCompartilhamento`
 * (`conteudo/site.ts`), e as cores, as de `COR_DA_MARCA` — repetidas aqui porque o script não lê TypeScript, e
 * conferidas contra os dois arquivos antes de desenhar.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const raiz = new URL('../', import.meta.url)
const lerTexto = (caminho) => readFileSync(new URL(caminho, raiz), 'utf8')

const cores = { navy: '#103a5b', laranja: '#fa8b17', areia: '#f7f4f1' }
const LARGURA = 1200
const ALTURA = 630
const FRASE = 'Reserve sua passagem de barco'

const conferir = (arquivo, trechos) => {
  const texto = lerTexto(arquivo)
  for (const trecho of trechos) {
    if (!texto.includes(trecho)) throw new Error(`${arquivo} não tem mais ${trecho}: atualize este script`)
  }
}
conferir('packages/design-system/src/marca.ts', [
  `navy: '${cores.navy}'`,
  `laranja: '${cores.laranja}'`,
  `fundoClaro: '${cores.areia}'`,
])
conferir('apps/agencia/src/conteudo/site.ts', [`largura: ${LARGURA}`, `altura: ${ALTURA}`, `"${FRASE}"`])
const logo = lerTexto('packages/design-system/src/marca/naveg-empilhado.svg')
const destino = fileURLToPath(new URL('apps/agencia/public/compartilhamento.png', raiz))

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; box-sizing: border-box; }
      body {
        width: ${LARGURA}px; height: ${ALTURA}px;
        background: ${cores.areia};
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px;
        border-bottom: 28px solid ${cores.laranja};
      }
      svg { width: 300px; height: auto; }
      p {
        font: 600 56px/1.1 ui-serif, Georgia, 'Times New Roman', serif;
        color: ${cores.navy};
      }
    </style>
  </head>
  <body>
    ${logo}
    <p>${FRASE}</p>
  </body>
</html>`

const navegador = await chromium.launch()
try {
  const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA } })
  await pagina.setContent(html)
  await pagina.screenshot({ path: destino, type: 'png' })
} finally {
  await navegador.close()
}
console.log(`✓ ${destino} (${LARGURA}×${ALTURA})`)
