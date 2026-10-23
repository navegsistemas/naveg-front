// @vitest-environment jsdom
/**
 * **Esqueci a senha** (3.4): pedir o link, com o e-mail do entrar já preenchido e a resposta que não revela nada; e a
 * senha nova pelo link, com cada resposta da API. Uma conta falsa no lugar da API.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ContaDoSite, ResultadoDaSenhaNova } from '@navegsistemas/dados/conta'

import { CHAVE_DO_EMAIL_DO_ENTRAR } from '../src/ilhas/conta-do-site'
import EsqueciASenha from '../src/ilhas/EsqueciASenha'
import NovaSenha, { ERRO_DA_SENHA_NOVA } from '../src/ilhas/NovaSenha'

const CODIGO = 'c'.repeat(43)

function contaFalsa(senhaNova: ResultadoDaSenhaNova = { caso: 'DENTRO' }) {
  const pedidos: string[] = []
  const trocas: [string, string, string][] = []
  const conta: ContaDoSite = {
    criar: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    reenviar: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    confirmar: async () => ({ caso: 'LINK_INVALIDO' }),
    entrar: async () => ({ caso: 'CREDENCIAIS_INVALIDAS' }),
    sessao: async () => ({ caso: 'FORA' }),
    sair: async () => true,
    esqueci: async (email) => {
      pedidos.push(email)
      return { caso: 'CONFIRA_O_EMAIL' }
    },
    novaSenha: async (contaId, codigo, senha) => {
      trocas.push([contaId, codigo, senha])
      return senhaNova
    },
  }
  return { conta, pedidos, trocas }
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

describe('EsqueciASenha — pedir o link (3.4, estado 1)', () => {
  it('vem com o e-mail do entrar, manda o pedido, e responde sem dizer se há conta (B)', async () => {
    sessionStorage.setItem(CHAVE_DO_EMAIL_DO_ENTRAR, 'Maria@Exemplo.com.br')
    const { conta, pedidos } = contaFalsa()
    render(<EsqueciASenha conta={conta} />)
    expect(((await screen.findByLabelText('E-mail')) as HTMLInputElement).value).toBe('Maria@Exemplo.com.br')

    fireEvent.click(screen.getByRole('button', { name: 'Mandar o link' }))
    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeTruthy()
    expect(screen.getByText(/Se houver uma conta com/).textContent).toContain('maria@exemplo.com.br')
    expect(screen.getByText(/Ele vale por 1 hora/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Mandar de novo em \d+ s$/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).toMatch(/wa\.me/)
    expect(pedidos).toEqual(['maria@exemplo.com.br'])
  })

  it('sem e-mail: o erro embaixo do campo, e nada vai à API', () => {
    const { conta, pedidos } = contaFalsa()
    render(<EsqueciASenha conta={conta} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mandar o link' }))
    expect(screen.getByText('Informe o e-mail da conta, como voce@exemplo.com.')).toBeTruthy()
    expect(pedidos).toEqual([])
    expect(screen.getByRole('link', { name: 'Voltar para Entrar' }).getAttribute('href')).toBe('/conta/')
  })
})

describe('NovaSenha — a senha nova pelo link (3.4, estados 3 e 4)', () => {
  beforeEach(() => window.history.replaceState(null, '', `/conta/nova-senha/#conta-1.${CODIGO}`))

  it('troca: manda o link e a senha, tira o código do endereço, e diz que a pessoa está dentro (C)', async () => {
    const { conta, trocas } = contaFalsa()
    render(<NovaSenha conta={conta} />)
    expect(window.location.hash).toBe('')
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: 'a balsa sai às sete' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha nova' }))
    expect(await screen.findByRole('heading', { name: 'Senha trocada' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('saiu dela nos outros')
    expect(trocas).toEqual([['conta-1', CODIGO, 'a balsa sai às sete']])
    expect(screen.getByRole('link', { name: 'Ir para Minha conta' }).getAttribute('href')).toBe('/conta/')
  })

  it('a senha curta não chega à API', () => {
    const { conta, trocas } = contaFalsa()
    render(<NovaSenha conta={conta} />)
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: 'curta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha nova' }))
    expect(screen.getByText(ERRO_DA_SENHA_NOVA.SENHA_CURTA)).toBeTruthy()
    expect(trocas).toEqual([])
  })

  it('a senha vazada, recusada pela API: a frase embaixo do campo', async () => {
    render(<NovaSenha conta={contaFalsa({ caso: 'SENHA_FRACA', motivo: 'SENHA_VAZADA' }).conta} />)
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: 'uma senha que vazou' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha nova' }))
    expect(await screen.findByText(ERRO_DA_SENHA_NOVA.SENHA_VAZADA)).toBeTruthy()
  })

  it.each([['LINK_VENCIDO'], ['LINK_INVALIDO']] as const)('o link %s: "Este link não vale mais", com o pedido de outro', async (caso) => {
    render(<NovaSenha conta={contaFalsa({ caso }).conta} />)
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: 'a balsa sai às sete' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha nova' }))
    expect(await screen.findByRole('heading', { name: 'Este link não vale mais' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Pedir um link novo' }).getAttribute('href')).toBe('/conta/esqueci/')
  })

  it('sem o link no endereço: "Este link não vale mais", sem pedir a senha', async () => {
    window.history.replaceState(null, '', '/conta/nova-senha/')
    render(<NovaSenha conta={contaFalsa().conta} />)
    expect(await screen.findByRole('heading', { name: 'Este link não vale mais' })).toBeTruthy()
    expect(screen.queryByLabelText('Senha nova')).toBeNull()
  })

  it('a conta desativada depois do pedido: a tela da 3.3, F', async () => {
    render(<NovaSenha conta={contaFalsa({ caso: 'CONTA_DESATIVADA' }).conta} />)
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: 'a balsa sai às sete' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha nova' }))
    expect(await screen.findByRole('heading', { name: 'Esta conta está desativada' })).toBeTruthy()
  })

  it('sem conexão: o quadro, e o link continua valendo', async () => {
    render(<NovaSenha conta={contaFalsa({ caso: 'FALHA', porque: 'CONEXAO' }).conta} />)
    fireEvent.change(screen.getByLabelText('Senha nova'), { target: { value: 'a balsa sai às sete' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar a senha nova' }))
    expect((await screen.findByRole('alert')).textContent).toBe(ERRO_DA_SENHA_NOVA.CONEXAO)
  })
})
