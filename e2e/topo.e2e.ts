/**
 * **O topo e o menu** — a 1.1 do roteiro de UI/UX (`docs/roteiro-de-ui-ux.md`, §10), decidida pelo PO em
 * 2026-10-08.
 *
 * - **largo** (50rem ou mais; desde "Minha conta", 3.5, o tablet em pé recolhe): uma linha só, com Encomendas,
 *   Atendentes, Social, Contato, Minha conta e
 *   "Reservar agora";
 * - **estreito**: a linha do logo, do botão e do menu, presa ao rolar; o menu abre, e **fecha sozinho** ao tocar
 *   num item e no `Esc`;
 * - **sem JavaScript**, o menu continua abrindo — o `<details>` é do navegador.
 */
import type { Page } from '@playwright/test'

import { servirApiFalsa } from './api-falsa'
import { expect, test } from './politica'
import { botaoDoMenu, menuDoTopo } from './topo'

const LARGO = { width: 1024, height: 768 }
/** O tablet em pé: desde "Minha conta" (3.5, C), o menu recolhe aqui, para o topo não ir a duas linhas. */
const TABLET_EM_PE = { width: 768, height: 1024 }
/** Logo abaixo de 50rem: o menu já recolhe, e nada se espreme. */
const LIMITE_DO_ESTREITO = { width: 790, height: 900 }
const ESTREITO = { width: 360, height: 740 }

/** A linha do topo cabe numa altura só: o logo de 34px, o botão de 44px e as folgas. */
const ALTURA_DE_UMA_LINHA = 70

const topo = (page: Page) => page.getByRole('banner')
const reservarAgora = (page: Page) => topo(page).getByRole('link', { name: 'Reservar agora' })

test.describe('o topo, largo', () => {
  test('uma linha só, com as encomendas, os atendentes, o social, o contato, "Minha conta" e o "Reservar agora" — e sem o botão do menu', async ({ page }) => {
    await servirApiFalsa(page)
    await page.setViewportSize(LARGO)
    await page.goto('/')

    await expect(menuDoTopo(page).getByRole('link')).toHaveText(['Encomendas', 'Atendentes', 'Social', 'Contato', 'Minha conta'])
    await expect(reservarAgora(page)).toBeVisible()
    await expect(botaoDoMenu(page)).toBeHidden()
    expect((await topo(page).boundingBox())?.height).toBeLessThanOrEqual(ALTURA_DE_UMA_LINHA)
  })

  test('logo abaixo de 50rem o menu já recolhe — os cinco itens não ficam espremidos ao lado do botão', async ({ page }) => {
    await servirApiFalsa(page)
    await page.setViewportSize(LIMITE_DO_ESTREITO)
    await page.goto('/')

    await expect(botaoDoMenu(page)).toBeVisible()
    await expect(menuDoTopo(page)).toBeHidden()
  })

  test('no tablet em pé o menu recolhe, e o topo fica numa linha (3.5, C)', async ({ page }) => {
    await servirApiFalsa(page)
    await page.setViewportSize(TABLET_EM_PE)
    await page.goto('/')

    await expect(botaoDoMenu(page)).toBeVisible()
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
    await expect(menuDoTopo(page).getByRole('link')).toHaveText(['Encomendas', 'Atendentes', 'Social', 'Contato', 'Minha conta'])

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

test.describe('"Minha conta" no topo (3.5)', () => {
  test('o último item do menu leva à página da conta, nas duas larguras', async ({ page }) => {
    await servirApiFalsa(page)
    for (const tamanho of [LARGO, ESTREITO]) {
      await page.setViewportSize(tamanho)
      await page.goto('/')
      if (tamanho === ESTREITO) await botaoDoMenu(page).click()
      await menuDoTopo(page).getByRole('link', { name: 'Minha conta' }).click()
      await expect(page).toHaveURL(/\/conta\/$/)
      if (tamanho === ESTREITO) await botaoDoMenu(page).click()
      await expect(menuDoTopo(page).getByRole('link', { name: 'Minha conta' })).toHaveAttribute('aria-current', 'page')
    }
  })
})
