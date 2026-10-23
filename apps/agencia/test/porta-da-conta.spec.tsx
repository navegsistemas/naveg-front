// @vitest-environment jsdom
/**
 * **A página da conta** (3.3): quem está dentro, entrar, os erros que não revelam quem tem conta, a conta desativada, e
 * o sair. Uma conta falsa no lugar da API.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { ContaDoSite, ResultadoDaSessao, ResultadoDoEntrar } from '@navegsistemas/dados/conta'

import PortaDaConta, { ERRO_DO_ENTRAR } from '../src/ilhas/PortaDaConta'

function contaFalsa(sessao: ResultadoDaSessao, entrar: ResultadoDoEntrar = { caso: 'DENTRO', confirmada: true }, sair = true) {
  const entradas: [string, string][] = []
  let saidas = 0
  const conta: ContaDoSite = {
    criar: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    reenviar: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    confirmar: async () => ({ caso: 'LINK_INVALIDO' }),
    sessao: async () => sessao,
    esqueci: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    novaSenha: async () => ({ caso: 'LINK_INVALIDO' }),
    entrar: async (email, senha) => {
      entradas.push([email, senha])
      return entrar
    },
    sair: async () => {
      saidas++
      return sair
    },
  }
  return { conta, entradas, saidas: () => saidas }
}

async function entrarCom(email: string, senha: string) {
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

afterEach(cleanup)

describe('PortaDaConta', () => {
  it('ninguém dentro: o entrar, com o "Criar conta" e a reserva sem conta', async () => {
    render(<PortaDaConta conta={contaFalsa({ caso: 'FORA' }).conta} />)
    expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Criar conta' }).getAttribute('href')).toBe('/conta/criar/')
    expect(screen.getByRole('link', { name: 'reserve pela página' }).getAttribute('href')).toBe('/#totem')
  })

  it('já dentro: a conta, sem pedir a senha', async () => {
    render(<PortaDaConta conta={contaFalsa({ caso: 'DENTRO', confirmada: true }).conta} />)
    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeTruthy()
    expect(screen.getByText('Você está na sua conta neste aparelho.')).toBeTruthy()
    expect(screen.queryByText(/Confirme seu e-mail/)).toBeNull()
  })

  it('dentro sem o e-mail confirmado: o aviso "Confirme seu e-mail para comprar" (3.2, D)', async () => {
    render(<PortaDaConta conta={contaFalsa({ caso: 'DENTRO', confirmada: false }).conta} />)
    expect(await screen.findByText(/Confirme seu e-mail para comprar/)).toBeTruthy()
  })

  it('entra com o e-mail e a senha, e mostra a conta', async () => {
    const { conta, entradas } = contaFalsa({ caso: 'FORA' })
    render(<PortaDaConta conta={conta} />)
    await entrarCom(' maria@exemplo.com.br ', 'rio e maré cheia')
    expect(await screen.findByRole('heading', { name: 'Minha conta' })).toBeTruthy()
    expect(entradas).toEqual([['maria@exemplo.com.br', 'rio e maré cheia']])
  })

  it('vazio: os erros embaixo dos campos, e nada vai à API', async () => {
    const { conta, entradas } = contaFalsa({ caso: 'FORA' })
    render(<PortaDaConta conta={conta} />)
    await screen.findByRole('heading', { name: 'Entrar na sua conta' })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Informe o e-mail da conta, como voce@exemplo.com.')).toBeTruthy()
    expect(screen.getByText('Informe a senha.')).toBeTruthy()
    expect(entradas).toEqual([])
  })

  it.each([
    ['CREDENCIAIS_INVALIDAS', { caso: 'CREDENCIAIS_INVALIDAS' }],
    ['TENTATIVAS_DEMAIS', { caso: 'TENTATIVAS_DEMAIS' }],
    ['CONEXAO', { caso: 'FALHA', porque: 'CONEXAO' }],
  ] as const)('não entrou (%s): a frase acima do botão, e o e-mail continua', async (chave, resultado) => {
    render(<PortaDaConta conta={contaFalsa({ caso: 'FORA' }, resultado).conta} />)
    await entrarCom('maria@exemplo.com.br', 'errada')
    expect((await screen.findByRole('alert')).textContent).toBe(ERRO_DO_ENTRAR[chave])
    expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe('maria@exemplo.com.br')
  })

  it('a conta desativada, com a senha certa: a tela própria, com o WhatsApp e a reserva sem conta (F)', async () => {
    render(<PortaDaConta conta={contaFalsa({ caso: 'FORA' }, { caso: 'CONTA_DESATIVADA' }).conta} />)
    await entrarCom('maria@exemplo.com.br', 'certa')
    expect(await screen.findByRole('heading', { name: 'Esta conta está desativada' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).toMatch(/wa\.me/)
    expect(screen.getByRole('link', { name: 'reservar pela página' }).getAttribute('href')).toBe('/#totem')
  })

  it('sair: "Você saiu da sua conta neste aparelho", e o entrar de novo', async () => {
    const { conta, saidas } = contaFalsa({ caso: 'DENTRO', confirmada: true })
    render(<PortaDaConta conta={conta} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }))
    expect((await screen.findByRole('status')).textContent).toBe('Você saiu da sua conta neste aparelho.')
    expect(screen.getByRole('heading', { name: 'Entrar na sua conta' })).toBeTruthy()
    expect(saidas()).toBe(1)
  })

  it('sair sem rede: o aviso, e a pessoa continua dentro', async () => {
    render(<PortaDaConta conta={contaFalsa({ caso: 'DENTRO', confirmada: true }, undefined, false).conta} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Não deu para sair agora')
    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeTruthy()
  })
})
