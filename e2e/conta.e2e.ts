/**
 * **Criar a conta, num navegador de verdade** — a 3.1 do roteiro de UI/UX.
 *
 * Os cenários de `apps/agencia/test/criar-conta.spec.tsx` dirigem o formulário em jsdom. Aqui se confere o que só o
 * navegador prova: a ilha hidratando, as máscaras enquanto se digita, o Turnstile com a ação `cadastro`, o corpo que vai
 * ao `POST /conta` e a resposta "Confira seu e-mail"; e a falha da API, com o preenchido guardado.
 */
import type { Page } from '@playwright/test'

import { CODIGO_QUE_CONFIRMA, CODIGO_VENCIDO, servirApiFalsa, TOKEN_DE_TESTE_DO_TURNSTILE } from './api-falsa'
import { expect, test } from './politica'

const PRAZO_DO_ENVIO = { timeout: 20_000 }

async function preencher(page: Page) {
  await page.getByLabel('Nome completo').fill('Maria Souza')
  await page.getByLabel('Data de nascimento').pressSequentially('20051990')
  await expect(page.getByLabel('Data de nascimento')).toHaveValue('20/05/1990')
  await page.getByLabel('E-mail').fill('maria@exemplo.com.br')
  await page.getByLabel('Celular com WhatsApp').pressSequentially('91988887777')
  await expect(page.getByLabel('Celular com WhatsApp')).toHaveValue('(91) 98888-7777')
  await page.getByLabel('Senha', { exact: true }).fill('rio e maré cheia')
}

/** O botão abaixo da dobra: no meio da tela antes do clique, ou ele se perde na beirada (lição de 2026-10-21). */
async function criar(page: Page, nome = 'Criar conta') {
  const botao = page.getByRole('button', { name: nome })
  await expect(botao).toBeEnabled(PRAZO_DO_ENVIO)
  await botao.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await botao.click()
}

test('a conta criada: o cadastro e o token vão à API, e a tela diz "Confira seu e-mail"', async ({ page }) => {
  const api = await servirApiFalsa(page)
  await page.goto('/conta/criar/')
  await expect(page.getByRole('heading', { level: 1, name: 'Criar sua conta' })).toBeVisible()

  await preencher(page)
  await criar(page)

  await expect(page.getByRole('heading', { level: 1, name: 'Confira seu e-mail' })).toBeVisible(PRAZO_DO_ENVIO)
  await expect(page.getByText('maria@exemplo.com.br')).toBeVisible()
  expect(api.cadastros).toEqual([
    {
      nome: 'Maria Souza',
      dataNascimento: '1990-05-20',
      email: 'maria@exemplo.com.br',
      telefone: '(91) 98888-7777',
      senha: 'rio e maré cheia',
      desafio: TOKEN_DE_TESTE_DO_TURNSTILE,
    },
  ])
})

test('vazio: os erros embaixo dos campos, e nada vai à API', async ({ page }) => {
  const api = await servirApiFalsa(page)
  await page.goto('/conta/criar/')
  await criar(page)
  await expect(page.getByText('Informe o seu nome completo.')).toBeVisible()
  await expect(page.getByLabel('Nome completo')).toBeFocused()
  expect(api.cadastros).toEqual([])
})

test('a API fora do ar: o quadro com o WhatsApp, o "Tentar de novo", e o preenchido continua', async ({ page }) => {
  await servirApiFalsa(page, { envio: 'FORA_DO_AR' })
  await page.goto('/conta/criar/')
  await preencher(page)
  await criar(page)

  await expect(page.getByRole('alert')).toContainText('A conta não foi criada', PRAZO_DO_ENVIO)
  await expect(page.getByRole('alert').getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me/)
  await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
  await expect(page.getByLabel('Nome completo')).toHaveValue('Maria Souza')
})

/* A 3.2: o link de confirmação aberto. O código vai depois do `#`, e sai do endereço assim que a página o lê. */

test('o link que confirma: "E-mail confirmado", e o código some do endereço', async ({ page }) => {
  await servirApiFalsa(page)
  await page.goto(`/conta/confirmar/#conta-1.${CODIGO_QUE_CONFIRMA}`)
  await expect(page.getByRole('heading', { level: 1, name: 'E-mail confirmado' })).toBeVisible(PRAZO_DO_ENVIO)
  expect(new URL(page.url()).hash).toBe('')
  await expect(page.getByRole('link', { name: 'Reservar agora' }).last()).toHaveAttribute('href', '/#totem')
})

test('o link vencido: pedir um link novo pelo e-mail, e "Confira seu e-mail"', async ({ page }) => {
  const api = await servirApiFalsa(page)
  await page.goto(`/conta/confirmar/#conta-1.${CODIGO_VENCIDO}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Este link venceu' })).toBeVisible(PRAZO_DO_ENVIO)
  await page.getByLabel('E-mail da conta').fill('maria@exemplo.com.br')
  await page.getByRole('button', { name: 'Mandar um link novo' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Confira seu e-mail' })).toBeVisible(PRAZO_DO_ENVIO)
  await expect(page.getByRole('button', { name: /^Reenviar em \d+ s$/ })).toBeDisabled()
  expect(api.reenvios).toEqual(['maria@exemplo.com.br'])
})
