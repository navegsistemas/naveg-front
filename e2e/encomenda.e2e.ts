/**
 * **A encomenda, de ponta a ponta, num navegador de verdade** — `docs/plano-da-reserva-de-encomenda.md`, §7.
 *
 * Os cenários de `apps/agencia/test/encomenda.spec.tsx` dirigem o roteiro em jsdom. Aqui se confere o que só o
 * navegador prova: as duas portas de entrada (o item "Encomendas" na barra e o botão da capa) levando à seção, a
 * ilha hidratando quando ela entra na tela, o Turnstile, o corpo que vai à API (`encomenda`, e não `respostas`),
 * o código do servidor e o `href` do WhatsApp. E o quiosque **sem** encomenda (C9).
 */
import type { Locator, Page } from '@playwright/test'

import { CODIGO_DO_SERVIDOR, servirApiFalsa, TOKEN_DE_TESTE_DO_TURNSTILE } from './api-falsa'
import { expect, test } from './politica'

const WHATSAPP_DA_NAVEG = '5591992035322'
const PRAZO_DO_ENVIO = { timeout: 20_000 }

const secao = (page: Page): Locator => page.locator('#encomendas .totem')
const pergunta = (page: Page): Locator => secao(page).getByRole('heading', { level: 3 })

/** Da lista à conclusão: três caixas, 5 a 20 kg, para João Lima, mandadas por Maria Souza. */
async function enviarTresCaixas(page: Page) {
  const saida = secao(page).getByRole('listitem').filter({ hasText: 'Ferry de demonstração' }).first()
  await saida.getByRole('button', { name: 'Enviar nesta saída' }).click()

  await expect(pergunta(page)).toHaveText('O que vai mandar?')
  await secao(page).getByRole('button', { name: /^Caixa/ }).click()
  await secao(page).getByLabel('Quantos volumes').fill('3')
  await secao(page).getByLabel(/O que é/).fill('mantimentos')
  await secao(page).getByRole('button', { name: 'Continuar' }).click()

  await secao(page).getByRole('button', { name: /^5 a 20 kg/ }).click()
  await secao(page).getByRole('button', { name: /^Outra pessoa/ }).click()

  await expect(pergunta(page)).toHaveText('Para quem vai?')
  await secao(page).getByLabel('Nome').fill('João Lima')
  await secao(page).getByLabel('Celular com DDD').fill('(96) 98888-7777')
  await secao(page).getByRole('button', { name: 'Continuar' }).click()

  await expect(pergunta(page)).toHaveText('Quem está mandando?')
  await secao(page).getByLabel('Nome').fill('Maria Souza')
  await secao(page).getByRole('button', { name: 'Continuar' }).click()

  await expect(pergunta(page)).toHaveText('Confira a encomenda')
  await secao(page).getByRole('button', { name: 'Confirmar' }).click()
  await expect(pergunta(page)).toHaveText('Encomenda reservada', PRAZO_DO_ENVIO)
}

test.describe('a encomenda na página', () => {
  test('pelo item "Encomendas" da barra: da saída ao WhatsApp, com o corpo de encomenda', async ({ page }) => {
    const api = await servirApiFalsa(page)
    await page.goto('/')

    await page.getByRole('navigation', { name: 'Seções da página' }).getByRole('link', { name: 'Encomendas' }).click()
    const titulo = page.getByRole('heading', { level: 2, name: 'Envie sua encomenda' })
    await expect(titulo).toBeInViewport()
    /* E continua nela quando as saídas chegam: nada que hidrata acima pode empurrar a seção para baixo. */
    await expect(secao(page).getByRole('listitem').first()).toBeVisible()
    await expect(titulo).toBeInViewport()

    await enviarTresCaixas(page)
    await expect(secao(page).getByText(CODIGO_DO_SERVIDOR, { exact: true })).toBeVisible()

    /* O que atravessou: a ocorrência, a encomenda e o token — sem `respostas`, e nada de reserva pronta. */
    expect(api.pedidos).toHaveLength(1)
    const [pedido] = api.pedidos
    expect(Object.keys(pedido ?? {}).sort()).toEqual(['data', 'desafio', 'encomenda', 'viagemId'])
    expect(pedido?.desafio).toBe(TOKEN_DE_TESTE_DO_TURNSTILE)
    expect(pedido !== undefined && 'encomenda' in pedido ? pedido.encomenda : undefined).toEqual({
      tipoVolume: 'CAIXA',
      quantidadeVolumes: 3,
      complemento: 'mantimentos',
      faixaPeso: 'DE_5_A_20',
      retirada: 'OUTRA_PESSOA',
      destinatario: { nome: 'João Lima', telefone: '(96) 98888-7777' },
      cliente: { nome: 'Maria Souza' },
    })

    const atendimento = secao(page).getByRole('link', { name: 'Enviar ao atendimento' })
    await expect(atendimento).toHaveAttribute('target', '_blank')
    const link = new URL((await atendimento.getAttribute('href')) ?? '')
    expect(`${link.origin}${link.pathname}`).toBe(`https://wa.me/${WHATSAPP_DA_NAVEG}`)
    const mensagem = (link.searchParams.get('text') ?? '').split('\n')
    expect(mensagem[0]).toBe(`Encomenda ${CODIGO_DO_SERVIDOR}`)
    expect(mensagem[2]).toBe('3 volumes · Caixa (mantimentos) · 5 a 20 kg')
    expect(mensagem[3]).toBe('De Maria Souza para João Lima, (96) 98888-7777')
    expect(mensagem[4]).toBe('Entregue no porto antes da partida.')
  })

  test('pelo botão "Enviar encomenda" da capa, do mesmo jeito', async ({ page }) => {
    const api = await servirApiFalsa(page)
    await page.goto('/')

    await page.locator('#capa').getByRole('link', { name: 'Enviar encomenda' }).click()
    await enviarTresCaixas(page)
    expect(api.pedidos).toHaveLength(1)
  })
})

test.describe('o quiosque', () => {
  test('fica só com passagem: nenhuma encomenda, nem seção, nem botão', async ({ page }) => {
    await servirApiFalsa(page)
    await page.goto('/totem')
    await expect(page.locator('.totem').getByRole('listitem').first()).toBeVisible()
    await expect(page.locator('#encomendas')).toHaveCount(0)
    await expect(page.getByText(/encomenda/i)).toHaveCount(0)
  })
})
