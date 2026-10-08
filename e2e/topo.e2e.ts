/**
 * **O topo e o menu** — a 1.1 do roteiro de UI/UX (`docs/roteiro-de-ui-ux.md`, §10), decidida pelo PO em
 * 2026-10-08.
 *
 * - **largo** (40rem ou mais, o tablet em pé incluído): uma linha só, com Encomendas, Contato e "Reservar agora";
 * - **estreito**: a linha do logo, do botão e do menu, presa ao rolar; o menu abre, e **fecha sozinho** ao tocar
 *   num item e no `Esc`;
 * - **sem JavaScript**, o menu continua abrindo — o `<details>` é do navegador.
 */
import type { Page } from '@playwright/test'

import { servirApiFalsa } from './api-falsa'
import { expect, test } from './politica'
import { botaoDoMenu, menuDoTopo } from './topo'

const LARGO = { width: 768, height: 1024 }
const ESTREITO = { width: 360, height: 740 }

/** A linha do topo cabe numa altura só: o logo de 34px, o botão de 44px e as folgas. */
const ALTURA_DE_UMA_LINHA = 70

const topo = (page: Page) => page.getByRole('banner')
const reservarAgora = (page: Page) => topo(page).getByRole('link', { name: 'Reservar agora' })

test.describe('o topo, largo', () => {
  test('uma linha só, com as encomendas, o contato e o "Reservar agora" — e sem o botão do menu', async ({ page }) => {
    await servirApiFalsa(page)
    await page.setViewportSize(LARGO)
    await page.goto('/')

    await expect(menuDoTopo(page).getByRole('link')).toHaveText(['Encomendas', 'Contato'])
    await expect(reservarAgora(page)).toBeVisible()
    await expect(botaoDoMenu(page)).toBeHidden()
    expect((await topo(page).boundingBox())?.height).toBeLessThanOrEqual(ALTURA_DE_UMA_LINHA)
  })
})

test.describe('o topo, estreito', () => {
  test.beforeEach(async ({ page }) => {
    await servirApiFalsa(page)
    await page.setViewportSize(ESTREITO)
    await page.goto('/')
  })

  test('uma linha só, com o menu fechado, e ela continua à vista depois de rolar', async ({ page }) => {
    await expect(menuDoTopo(page)).toBeHidden()
    expect((await topo(page).boundingBox())?.height).toBeLessThanOrEqual(ALTURA_DE_UMA_LINHA)

    await page.locator('#atendentes').scrollIntoViewIfNeeded()
    await expect(reservarAgora(page)).toBeInViewport()
    await expect(botaoDoMenu(page)).toBeInViewport()
  })

  test('o menu abre, e fecha sozinho quando se toca num item — com a seção à vista, sem nada por cima', async ({ page }) => {
    await botaoDoMenu(page).click()
    await expect(menuDoTopo(page).getByRole('link')).toHaveText(['Encomendas', 'Contato'])

    await menuDoTopo(page).getByRole('link', { name: 'Encomendas' }).click()
    await expect(menuDoTopo(page)).toBeHidden()

    const titulo = page.getByRole('heading', { level: 2, name: 'Envie sua encomenda' })
    await expect(titulo).toBeInViewport()
    const fimDoTopo = (await topo(page).boundingBox())?.height ?? 0
    expect((await titulo.boundingBox())?.y).toBeGreaterThanOrEqual(fimDoTopo)
  })

  test('o Esc fecha o menu e devolve o foco ao botão', async ({ page }) => {
    await botaoDoMenu(page).click()
    await expect(menuDoTopo(page)).toBeVisible()

    await menuDoTopo(page).getByRole('link', { name: 'Encomendas' }).focus()
    await page.keyboard.press('Escape')
    await expect(menuDoTopo(page)).toBeHidden()
    await expect(botaoDoMenu(page)).toBeFocused()
  })
})

test.describe('o topo, estreito e sem JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('o menu abre e fecha no botão — o `<details>` é do navegador', async ({ page }) => {
    await page.setViewportSize(ESTREITO)
    await page.goto('/')

    await botaoDoMenu(page).click()
    await expect(menuDoTopo(page).getByRole('link', { name: 'Encomendas' })).toBeVisible()
    await botaoDoMenu(page).click()
    await expect(menuDoTopo(page)).toBeHidden()
  })
})
