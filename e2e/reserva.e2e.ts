/**
 * **A reserva, de ponta a ponta, num navegador de verdade** — o primeiro E2E do passo 13.
 *
 * Os cenários de `apps/agencia/test/totem.spec.tsx` já dirigem o roteiro inteiro em jsdom, com o envio em
 * memória. O que só um navegador prova é o que fica em volta: a ilha hidratando no build estático, o script do
 * Turnstile carregando e entregando o token, o `fetch` atravessando a origem até a API, a resposta lida, e o
 * `href` do WhatsApp que sai no fim. É isso que estes cenários conferem — e por isso a jornada é uma só, a
 * mais comum (rede, inteira), e as variações do roteiro continuam lá.
 */
import type { Locator, Page } from '@playwright/test'

import { CODIGO_DO_SERVIDOR, servirApiFalsa, TOKEN_DE_TESTE_DO_TURNSTILE } from './api-falsa'
import { expect, test } from './politica'

/** O WhatsApp da NAVEG (`conteudo/atendimento.ts`), como o `wa.me` o quer. */
const WHATSAPP_DA_NAVEG = '5591992035322'

/**
 * O envio espera o Turnstile, que vem da Cloudflare de verdade: o script na primeira vez, e um desafio por
 * envio. Com os navegadores em paralelo, isso passa dos 5 s do padrão.
 */
const PRAZO_DO_ENVIO = { timeout: 20_000 }

/** O totem, e só ele: na página há outros títulos, outras listas — e a seção de encomenda, com a mesma moldura. */
const totem = (page: Page): Locator => page.locator('.totem:not(.totem--encomenda)')
/** A pergunta do passo: `h3` na página, sob o título da seção; `h2` no quiosque, que não tem seção. */
const pergunta = (page: Page): Locator => totem(page).locator('.totem-pergunta')

/** Da lista ao botão "Confirmar reserva": ferry, passageiro, rede, inteira, Maria Souza. */
async function preencherAteAConferencia(page: Page) {
  const saida = totem(page).getByRole('listitem').filter({ hasText: 'Ferry de demonstração' }).first()
  await saida.getByRole('button', { name: 'Reservar esta saída' }).click()

  await expect(pergunta(page)).toHaveText('O que vai embarcar?')
  await page.getByRole('button', { name: 'Passageiro' }).click()
  await page.getByRole('button', { name: /^Rede/ }).click()
  await page.getByRole('button', { name: 'Inteira' }).click()

  await expect(pergunta(page)).toHaveText('Em nome de quem fica a reserva?')
  await page.getByLabel('Nome').fill('Maria Souza')
  await page.getByLabel(/Celular com DDD/).fill('(91) 98888-7777')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(pergunta(page)).toHaveText('Confira a reserva')
  await expect(page.getByText('Rede · Inteira · 1 pessoa')).toBeVisible()
}

test.describe('a reserva no quiosque', () => {
  test('da saída ao WhatsApp: o Turnstile, a API e o link com a reserva escrita', async ({ page }) => {
    const api = await servirApiFalsa(page)
    await page.goto('/totem')

    /* Sem faixa de demonstração: este é o build que envia. */
    await expect(totem(page).getByRole('listitem').first()).toBeVisible()
    await expect(page.getByText(/Demonstração\./)).toHaveCount(0)

    await preencherAteAConferencia(page)
    await page.getByRole('button', { name: 'Confirmar reserva' }).click()

    /* O código na tela é o do servidor, não um gerado no navegador. */
    await expect(pergunta(page)).toHaveText('Reserva feita', PRAZO_DO_ENVIO)
    await expect(page.getByText(CODIGO_DO_SERVIDOR, { exact: true })).toBeVisible(PRAZO_DO_ENVIO)

    /* O que atravessou: a ocorrência, as respostas e o token do Turnstile — e nada de reserva pronta. */
    expect(api.pedidos).toHaveLength(1)
    const [pedido] = api.pedidos
    expect(pedido?.viagemId).toMatch(/^demo-ferry-ida-/)
    expect(pedido?.data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(pedido?.desafio).toBe(TOKEN_DE_TESTE_DO_TURNSTILE)
    expect(pedido !== undefined && 'respostas' in pedido ? pedido.respostas : undefined).toMatchObject({
      categoria: 'PASSAGEIRO',
      acomodacao: 'REDE',
      tipo: 'INTEIRA',
      cliente: { nome: 'Maria Souza' },
    })
    expect(Object.keys(pedido ?? {}).sort()).toEqual(['data', 'desafio', 'respostas', 'viagemId'])

    /* O link: a conversa da NAVEG, com o código na primeira linha. */
    const atendimento = page.getByRole('link', { name: 'Enviar ao atendimento' })
    await expect(atendimento).toHaveAttribute('target', '_blank')
    const href = (await atendimento.getAttribute('href')) ?? ''
    const link = new URL(href)
    expect(`${link.origin}${link.pathname}`).toBe(`https://wa.me/${WHATSAPP_DA_NAVEG}`)
    const mensagem = (link.searchParams.get('text') ?? '').split('\n')
    expect(mensagem[0]).toBe(`Reserva ${CODIGO_DO_SERVIDOR}`)
    expect(mensagem[1]).toMatch(/^Porto de demonstração · Cidade Exemplo A\/PA → Porto de demonstração · Cidade Exemplo B\/PA · /)
    expect(mensagem[2]).toBe('Rede · 1 pessoa · Maria Souza')
    expect(mensagem[3]).toBe('Vale até a partida.')
  })

  test('a saída que partiu é recusada, e o totem oferece outra', async ({ page }) => {
    await servirApiFalsa(page, { envio: 'PARTIU' })
    await page.goto('/totem')
    await preencherAteAConferencia(page)
    await page.getByRole('button', { name: 'Confirmar reserva' }).click()

    await page.getByRole('button', { name: 'Escolher outra saída' }).click(PRAZO_DO_ENVIO)
    await expect(pergunta(page)).toHaveText('Escolha a saída')
  })

  test('a API fora do ar não perde o que foi preenchido', async ({ page }) => {
    const api = await servirApiFalsa(page, { envio: 'FORA_DO_AR' })
    await page.goto('/totem')
    await preencherAteAConferencia(page)
    await page.getByRole('button', { name: 'Confirmar reserva' }).click()

    await expect(page.getByRole('alert')).toHaveText(/Não foi possível enviar a reserva agora/, PRAZO_DO_ENVIO)
    await expect(page.getByText('Rede · Inteira · 1 pessoa')).toBeVisible()

    /* Tentar de novo pede um token novo: eles não se reaproveitam. */
    await page.getByRole('button', { name: 'Confirmar reserva' }).click()
    await expect.poll(() => api.pedidos.length, PRAZO_DO_ENVIO).toBe(2)
    expect(api.pedidos.every((p) => p.desafio === TOKEN_DE_TESTE_DO_TURNSTILE)).toBe(true)
  })

  test('só no teclado: a cada passo, o foco vai para a pergunta nova', async ({ page }) => {
    await servirApiFalsa(page)
    await page.goto('/totem')
    await expect(totem(page).getByRole('listitem').first()).toBeVisible()

    /** Aperta Tab até o foco chegar no alvo, como faz quem não usa mouse — e falha se ele nunca chegar. */
    async function tabAte(alvo: Locator) {
      for (let i = 0; i < 40; i++) {
        if (await alvo.evaluate((elemento) => elemento === document.activeElement)) return
        await page.keyboard.press('Tab')
      }
      throw new Error('o Tab não chega no alvo')
    }

    /** Escolhe com o teclado, e confere que o foco foi para a pergunta do passo seguinte. */
    async function escolher(alvo: Locator, proxima: string) {
      await tabAte(alvo)
      await page.keyboard.press('Enter')
      await expect(pergunta(page)).toHaveText(proxima)
      await expect(pergunta(page)).toBeFocused()
    }

    const saida = totem(page).getByRole('listitem').filter({ hasText: 'Ferry de demonstração' }).first()
    await escolher(saida.getByRole('button', { name: 'Reservar esta saída' }), 'O que vai embarcar?')
    await escolher(page.getByRole('button', { name: 'Passageiro' }), 'Onde você quer viajar?')
    await escolher(page.getByRole('button', { name: /^Rede/ }), 'Qual o tipo da passagem?')
    await escolher(page.getByRole('button', { name: 'Inteira' }), 'Em nome de quem fica a reserva?')

    await tabAte(page.getByLabel('Nome'))
    await page.keyboard.type('Maria Souza')
    await tabAte(page.getByLabel(/Celular com DDD/))
    await page.keyboard.type('91988887777')
    await escolher(page.getByRole('button', { name: 'Continuar' }), 'Confira a reserva')

    await tabAte(page.getByRole('button', { name: 'Confirmar reserva' }))
    await page.keyboard.press('Enter')
    await expect(pergunta(page)).toHaveText('Reserva feita', PRAZO_DO_ENVIO)
    await expect(pergunta(page)).toBeFocused()
  })

  test('sem catálogo, o totem diz que não carregou — e não um dia sem saídas', async ({ page }) => {
    await servirApiFalsa(page, { catalogo: 'FORA_DO_AR' })
    await page.goto('/totem')
    await expect(page.getByText('Não foi possível carregar as saídas. Tente de novo em instantes.')).toBeVisible()
    await expect(totem(page).getByRole('listitem')).toHaveCount(0)
  })
})

test.describe('a reserva na página', () => {
  test('rolando até o totem, a ilha hidrata e reserva do mesmo jeito', async ({ page }) => {
    const api = await servirApiFalsa(page)
    const catalogoPedido = page.waitForRequest('**/catalogo')
    await page.goto('/')

    await page.locator('#totem').scrollIntoViewIfNeeded()
    await catalogoPedido

    /* Na página, a reserva começa pelo dia (UI 1.3). O calendário abre no primeiro dia com saída, que tarde da
       noite pode não ter mais o ferry; o segundo dia com saída é um dia inteiro, e tem. */
    await expect(pergunta(page)).toHaveText('Escolha o dia')
    const dias = totem(page).locator('.calendario-dia--reservavel')
    await expect(dias.first()).toBeVisible()
    if ((await dias.count()) > 1) await dias.nth(1).click()
    else {
      await page.getByRole('button', { name: 'Próximo mês' }).click()
      await dias.first().click()
    }

    await preencherAteAConferencia(page)
    await page.getByRole('button', { name: 'Confirmar reserva' }).click()
    await expect(page.getByText(CODIGO_DO_SERVIDOR, { exact: true })).toBeVisible(PRAZO_DO_ENVIO)
    expect(api.pedidos).toHaveLength(1)
  })
})
