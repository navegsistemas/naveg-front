// @vitest-environment jsdom
/**
 * **Confirmar o e-mail** (3.2): a tela "Confira seu e-mail", com o "Reenviar" de 60 segundos, e a página do link, com
 * cada resposta da API. Uma conta falsa no lugar da API; o relógio do "Reenviar" é do cenário.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ContaDoSite, ResultadoDaConfirmacao, ResultadoDoReenvio } from '@navegsistemas/dados/conta'

import { ConfiraSeuEmail, FALHA_DO_REENVIO } from '../src/ilhas/ConfiraSeuEmail'
import ConfirmarEmail, { linkDoEndereco, TEXTO_DO_LINK } from '../src/ilhas/ConfirmarEmail'

const CODIGO = 'c'.repeat(43)

function contaFalsa(confirmacao: ResultadoDaConfirmacao, reenvio: ResultadoDoReenvio = { caso: 'CONFIRA_O_EMAIL' }) {
  const confirmacoes: [string, string][] = []
  const reenvios: string[] = []
  const conta: ContaDoSite = {
    criar: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    reenviar: async (email) => {
      reenvios.push(email)
      return reenvio
    },
    confirmar: async (contaId, codigo) => {
      confirmacoes.push([contaId, codigo])
      return confirmacao
    },
    entrar: async () => ({ caso: 'CREDENCIAIS_INVALIDAS' }),
    sessao: async () => ({ caso: 'FORA' }),
    sair: async () => true,
  }
  return { conta, confirmacoes, reenvios }
}

afterEach(cleanup)

describe('ConfiraSeuEmail — o "Reenviar" (3.2, B)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('espera 60 segundos, com a contagem no botão; depois reenvia, avisa, e espera de novo', async () => {
    let agora = 1_000_000
    const relogio = () => agora
    const { conta, reenvios } = contaFalsa({ caso: 'EMAIL_CONFIRMADO' })
    render(<ConfiraSeuEmail conta={conta} email="maria@exemplo.com.br" relogio={relogio} />)

    expect(screen.getByText('maria@exemplo.com.br')).toBeTruthy()
    const botao = () => screen.getByRole('button', { name: /Reenviar/ }) as HTMLButtonElement
    expect(botao().textContent).toBe('Reenviar em 60 s')
    expect(botao().disabled).toBe(true)

    agora += 8_000
    await act(async () => void vi.advanceTimersByTime(1_000))
    expect(botao().textContent).toBe('Reenviar em 52 s')

    agora += 52_000
    await act(async () => void vi.advanceTimersByTime(1_000))
    expect(botao().textContent).toBe('Reenviar o e-mail')
    await act(async () => void fireEvent.click(botao()))

    expect(reenvios).toEqual(['maria@exemplo.com.br'])
    expect(screen.getByRole('status').textContent).toBe('Enviamos de novo para maria@exemplo.com.br.')
    expect(botao().textContent).toBe('Reenviar em 60 s')
  })

  it('o limite da hora: a frase, e nenhum "Enviamos de novo"', async () => {
    let agora = 1_000_000
    const { conta } = contaFalsa({ caso: 'EMAIL_CONFIRMADO' }, { caso: 'FALHA', porque: 'LIMITE' })
    render(<ConfiraSeuEmail conta={conta} email="maria@exemplo.com.br" relogio={() => agora} />)
    agora += 61_000
    await act(async () => void vi.advanceTimersByTime(1_000))
    await act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Reenviar o e-mail' })))
    expect(screen.getByRole('alert').textContent).toBe(FALHA_DO_REENVIO.LIMITE)
    expect(screen.getByRole('status').textContent).toBe('')
  })
})

describe('o link no endereço', () => {
  it('lê o id e o código depois do #, e recusa o que não tem a forma', () => {
    expect(linkDoEndereco(`#conta-1.${CODIGO}`)).toEqual({ contaId: 'conta-1', codigo: CODIGO })
    expect(linkDoEndereco('#conta-1.curto')).toBeNull()
    expect(linkDoEndereco('')).toBeNull()
  })
})

describe('ConfirmarEmail — o link aberto (3.2, estados 3 e 4)', () => {
  beforeEach(() => window.history.replaceState(null, '', `/conta/confirmar/#conta-1.${CODIGO}`))

  it('confirmado: manda o id e o código, tira o código do endereço, e diz que a conta está pronta', async () => {
    const { conta, confirmacoes } = contaFalsa({ caso: 'EMAIL_CONFIRMADO' })
    render(<ConfirmarEmail conta={conta} />)
    expect(await screen.findByRole('heading', { name: 'E-mail confirmado' })).toBeTruthy()
    expect(confirmacoes).toEqual([['conta-1', CODIGO]])
    expect(window.location.hash).toBe('')
    expect(screen.getByRole('link', { name: 'Reservar agora' }).getAttribute('href')).toBe('/#totem')
  })

  it('já confirmado: a frase, sem pedir nada', async () => {
    render(<ConfirmarEmail conta={contaFalsa({ caso: 'JA_CONFIRMADO' }).conta} />)
    expect(await screen.findByRole('heading', { name: TEXTO_DO_LINK.JA_CONFIRMADO.titulo })).toBeTruthy()
  })

  it('vencido: pede o e-mail da conta, manda o link novo, e mostra "Confira seu e-mail"', async () => {
    const { conta, reenvios } = contaFalsa({ caso: 'LINK_VENCIDO' })
    render(<ConfirmarEmail conta={conta} />)
    expect(await screen.findByRole('heading', { name: TEXTO_DO_LINK.LINK_VENCIDO.titulo })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Mandar um link novo' }))
    expect(screen.getByText('Informe um e-mail, como voce@exemplo.com.')).toBeTruthy()
    expect(reenvios).toEqual([])

    fireEvent.change(screen.getByLabelText('E-mail da conta'), { target: { value: ' Maria@Exemplo.com.br ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mandar um link novo' }))
    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeTruthy()
    expect(reenvios).toEqual(['maria@exemplo.com.br'])
  })

  it('sem o link no endereço: não chama a API, e pede um link novo', async () => {
    window.history.replaceState(null, '', '/conta/confirmar/')
    const { conta, confirmacoes } = contaFalsa({ caso: 'EMAIL_CONFIRMADO' })
    render(<ConfirmarEmail conta={conta} />)
    expect(await screen.findByRole('heading', { name: TEXTO_DO_LINK.LINK_INVALIDO.titulo })).toBeTruthy()
    expect(confirmacoes).toEqual([])
  })

  it('sem conexão: "Tentar de novo" confere o mesmo link outra vez', async () => {
    const { conta, confirmacoes } = contaFalsa({ caso: 'FALHA', porque: 'CONEXAO' })
    render(<ConfirmarEmail conta={conta} />)
    expect(await screen.findByRole('heading', { name: 'Não deu para confirmar agora' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await screen.findByRole('heading', { name: 'Não deu para confirmar agora' })
    expect(confirmacoes).toEqual([
      ['conta-1', CODIGO],
      ['conta-1', CODIGO],
    ])
  })
})
