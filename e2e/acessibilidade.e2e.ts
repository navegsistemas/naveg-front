/**
 * **Toda página, para todo mundo** — o passo 13.2: o axe, o teclado e o sem-JavaScript, em cada rota de
 * `rotas.ts`.
 *
 * - **O axe** roda com as ilhas já hidratadas (a página é rolada até o fim antes), porque é nelas que mora o
 *   que muda. As regras são as da WCAG 2.2 AA e as boas práticas do axe;
 * - **o teclado**: o primeiro `Tab` cai no "Pular para o conteúdo", e ele leva para dentro do `<main>`. A troca de
 *   passo do totem tem cenário próprio, só no teclado, abaixo;
 * - **sem JavaScript**, a página tem o seu título, e cada ilha diz como fazer pelo WhatsApp.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { servirApiFalsa } from './api-falsa'
import { expect, test } from './politica'
import { ROTAS } from './rotas'

const REGRAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

/** O WhatsApp da NAVEG (`conteudo/atendimento.ts`), como o `wa.me` o quer. */
const WHATSAPP_DA_NAVEG = '5591992035322'

/** Rola até o fim e volta: as ilhas `client:visible` só hidratam quando a seção entra na tela. */
async function hidratarTudo(page: Page) {
  for (const ilha of await page.locator('astro-island').all()) {
    await ilha.scrollIntoViewIfNeeded()
    await expect(ilha).not.toHaveAttribute('ssr', '')
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

/** O elemento com foco, como se lê: a etiqueta e o texto. */
const focado = (page: Page) =>
  page.evaluate(() => {
    const elemento = document.activeElement
    return elemento === null ? '' : `${elemento.tagName.toLowerCase()} ${(elemento.textContent ?? '').trim()}`
  })

for (const rota of ROTAS) {
  test.describe(`a página ${rota.caminho}`, () => {
    test('o axe não acusa nada, com as ilhas hidratadas', async ({ page }) => {
      await servirApiFalsa(page)
      await page.goto(rota.caminho)
      await hidratarTudo(page)

      const { violations } = await new AxeBuilder({ page }).withTags(REGRAS).analyze()
      expect(violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })

    test('o primeiro Tab é o "Pular para o conteúdo", e ele leva para dentro do conteúdo', async ({ page, browserName }) => {
      /* No Safari, o Tab só passa por link com a opção "realçar cada item" ligada — o padrão do macOS é não —, e o
         Option+Tab, que é o que quem usa teclado aperta lá, não chega ao WebKit do Playwright. A ordem é a mesma do
         Chromium: o HTML é um só. */
      test.skip(browserName === 'webkit', 'o Tab do Safari pula links por padrão')
      await servirApiFalsa(page)
      await page.goto(rota.caminho)

      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
      await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeInViewport()

      await page.keyboard.press('Enter')
      await page.keyboard.press('Tab')
      const dentroDoConteudo = await page.evaluate(() => document.querySelector('main')?.contains(document.activeElement) ?? false)
      expect(dentroDoConteudo, `o foco foi para ${await focado(page)}`).toBe(true)
    })
  })

  test.describe(`a página ${rota.caminho}, sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false })

    test(`tem o seu título, e ${rota.ilhas === 0 ? 'nenhum aviso' : `${rota.ilhas} aviso(s) com o WhatsApp`}`, async ({ page }) => {
      await page.goto(rota.caminho)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

      /* A ilha pré-desenhada some: sem script, "Carregando as saídas…" ficaria ali para sempre. */
      await expect(page.locator('.totem')).toHaveCount(rota.ilhas)
      for (const ilha of await page.locator('.totem').all()) await expect(ilha).toBeHidden()

      const avisos = page.locator('.sem-javascript')
      await expect(avisos).toHaveCount(rota.ilhas)
      for (const aviso of await avisos.all()) {
        await expect(aviso).toBeVisible()
        await expect(aviso).toContainText('precisa de JavaScript, que está desligado neste navegador. Para ')
        const href = (await aviso.getByRole('link').getAttribute('href')) ?? ''
        expect(new URL(href).pathname).toBe(`/${WHATSAPP_DA_NAVEG}`)
      }
    })
  })
}
