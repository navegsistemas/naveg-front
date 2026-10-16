/**
 * **A encomenda, de ponta a ponta, num navegador de verdade** — a 2.7 do roteiro de UI/UX.
 *
 * A encomenda é reservada pelo caminho da reserva ("O que vai embarcar?" → Encomenda), e a seção "Envie sua encomenda"
 * só explica, com o botão que abre a reserva já em "Encomenda" (decisões A e B, PO, 2026-10-15). Os cenários de
 * `apps/agencia/test/totem.spec.tsx` dirigem o roteiro em jsdom. Aqui se confere o que só o navegador prova: o menu
 * levando à seção, o botão levando à âncora da reserva, a ilha hidratando e começando pela encomenda, o calendário da
 * semana, o Turnstile, o corpo que vai à API (`encomenda`, sem `retirada`: naveg-front#58), o código do servidor e o
 * `href` do WhatsApp. E o quiosque **sem** encomenda (C9).
 */
import type { Locator, Page } from '@playwright/test'

import { CODIGO_DO_SERVIDOR, servirApiFalsa, TOKEN_DE_TESTE_DO_TURNSTILE } from './api-falsa'
import { expect, test } from './politica'
import { irPeloMenu } from './topo'

const WHATSAPP_DA_NAVEG = '5591992035322'
const PRAZO_DO_ENVIO = { timeout: 20_000 }

const totem = (page: Page): Locator => page.locator('.totem')
const pergunta = (page: Page): Locator => totem(page).locator('.totem-pergunta')

/** Da seção "Envie sua encomenda" à reserva feita: três caixas de mantimentos, 5 a 20 kg, mandadas por Maria Souza. */
async function mandarTresCaixas(page: Page) {
  const titulo = page.getByRole('heading', { level: 2, name: 'Envie sua encomenda' })
  await expect(titulo).toBeInViewport()

  /* O botão leva à reserva, que começa pela encomenda: a primeira pergunta já é o tipo. */
  await page.locator('#encomendas').getByRole('link', { name: 'Mandar uma encomenda' }).click()
  await expect(pergunta(page)).toHaveText('O que vai mandar?')
  await totem(page).getByRole('button', { name: /^Caixa/ }).click()
  await totem(page).getByLabel(/O que é/).fill('mantimentos')
  await totem(page).getByRole('button', { name: 'Continuar' }).click()

  await expect(pergunta(page)).toHaveText('Quantos volumes?')
  await totem(page).getByRole('button', { name: '3 volumes' }).click()
  await expect(pergunta(page)).toHaveText('Quanto pesa, mais ou menos?')
  await totem(page).getByRole('button', { name: /^5 a 20 kg/ }).click()

  /* O dia: só a semana acende (decisão E), e uma linha diz por quê. */
  await expect(pergunta(page)).toHaveText('Escolha o dia')
  await expect(totem(page).getByText('3 volumes · Caixa (mantimentos) · 5 a 20 kg')).toBeVisible()
  await expect(totem(page).getByText(/A encomenda se reserva para os próximos 7 dias/)).toBeVisible()
  await totem(page).locator('.calendario-dia--reservavel').first().click()
  const saida = totem(page).locator('.totem-travessias').getByRole('listitem').first()
  await saida.getByRole('button', { name: 'Reservar esta saída' }).click()

  /* Quem manda, com o celular obrigatório (F); quem recebe, opcional, e aqui pulado. */
  await expect(pergunta(page)).toHaveText('Quem está mandando?')
  await totem(page).getByLabel('Nome').fill('Maria Souza')
  await totem(page).getByLabel(/Celular com DDD/).fill('(91) 98888-7777')
  await totem(page).getByRole('button', { name: 'Continuar' }).click()

  await expect(pergunta(page)).toHaveText('Quem recebe no destino?')
  await totem(page).getByRole('button', { name: /^Pular/ }).click()

  /* Sem o destinatário, a retirada é a combinar (G), e a conferência diz como funciona. */
  await expect(pergunta(page)).toHaveText('Confira a reserva')
  await expect(totem(page).getByText('A combinar com o atendimento')).toBeVisible()
  await expect(totem(page).getByText(/retirada no porto com documento/).first()).toBeVisible()
  await totem(page).getByRole('button', { name: 'Confirmar reserva' }).click()
  await expect(pergunta(page)).toHaveText('Reserva feita', PRAZO_DO_ENVIO)
}

test.describe('a encomenda na página', () => {
  test('pelo item "Encomendas" do menu: da seção ao WhatsApp, com o corpo de encomenda e sem a retirada', async ({
    page,
  }) => {
    const api = await servirApiFalsa(page)
    await page.goto('/')

    await irPeloMenu(page, 'Encomendas')
    await mandarTresCaixas(page)
    await expect(totem(page).getByText(CODIGO_DO_SERVIDOR, { exact: true })).toBeVisible()
    await expect(totem(page).getByRole('button', { name: 'Reservar mais alguma coisa' })).toBeVisible()

    /* O que atravessou: a ocorrência, a encomenda e o token — sem `respostas`, e sem a retirada nem o destinatário. */
    expect(api.pedidos).toHaveLength(1)
    const [pedido] = api.pedidos
    expect(Object.keys(pedido ?? {}).sort()).toEqual(['data', 'desafio', 'encomenda', 'viagemId'])
    expect(pedido?.desafio).toBe(TOKEN_DE_TESTE_DO_TURNSTILE)
    const encomenda = pedido !== undefined && 'encomenda' in pedido ? pedido.encomenda : undefined
    expect(encomenda).toMatchObject({
      tipoVolume: 'CAIXA',
      quantidadeVolumes: 3,
      complemento: 'mantimentos',
      faixaPeso: 'DE_5_A_20',
      cliente: { nome: 'Maria Souza' },
    })
    expect(encomenda?.cliente?.telefone).toMatch(/98888-?7777$/)
    expect(encomenda).not.toHaveProperty('retirada')
    expect(encomenda).not.toHaveProperty('destinatario')

    const atendimento = totem(page).getByRole('link', { name: 'Enviar ao atendimento' })
    await expect(atendimento).toHaveAttribute('target', '_blank')
    const link = new URL((await atendimento.getAttribute('href')) ?? '')
    expect(`${link.origin}${link.pathname}`).toBe(`https://wa.me/${WHATSAPP_DA_NAVEG}`)
    const mensagem = (link.searchParams.get('text') ?? '').split('\n')
    expect(mensagem[0]).toBe(`Encomenda ${CODIGO_DO_SERVIDOR}`)
    expect(mensagem).toContain('3 volumes · Caixa (mantimentos) · 5 a 20 kg')
    expect(mensagem.some((linha) => linha.startsWith('De Maria Souza, ') && linha.endsWith('quem retira, a combinar'))).toBe(
      true,
    )
  })

  test('pelo botão "Enviar encomenda" da capa, do mesmo jeito', async ({ page }) => {
    const api = await servirApiFalsa(page)
    await page.goto('/')

    await page.locator('#capa').getByRole('link', { name: 'Enviar encomenda' }).click()
    await mandarTresCaixas(page)
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
