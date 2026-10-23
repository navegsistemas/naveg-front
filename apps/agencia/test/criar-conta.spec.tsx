// @vitest-environment jsdom
/**
 * **Criar a conta** (3.1): o formulário com uma conta falsa no lugar da API. O que se confere: os erros embaixo do campo
 * e o foco no primeiro (achado 4); o que vai para a API; a resposta que é sempre "Confira seu e-mail"; a senha
 * recusada pelo servidor; e a falha que guarda o que foi preenchido (2.6).
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { ContaDoSite, ResultadoDoCadastroNoSite } from '@navegsistemas/dados/conta'
import { DataCalendario, type CadastroDaConta } from '@navegsistemas/domain'

import CriarConta, { dataIso, ERRO_DO_CAMPO, FALHA_DO_CADASTRO, mascaraDaData } from '../src/ilhas/CriarConta'

const hoje = () => DataCalendario.de('2026-10-23') as DataCalendario

/** A conta falsa: guarda o cadastro e responde o que o cenário mandar. */
function contaQueResponde(resultado: ResultadoDoCadastroNoSite) {
  const cadastros: CadastroDaConta[] = []
  const conta: ContaDoSite = {
    criar: async (cadastro) => {
      cadastros.push(cadastro)
      return resultado
    },
    reenviar: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    confirmar: async () => ({ caso: 'LINK_INVALIDO' }),
    entrar: async () => ({ caso: 'CREDENCIAIS_INVALIDAS' }),
    sessao: async () => ({ caso: 'FORA' }),
    esqueci: async () => ({ caso: 'CONFIRA_O_EMAIL' }),
    novaSenha: async () => ({ caso: 'LINK_INVALIDO' }),
    sair: async () => true,
  }
  return { conta, cadastros }
}

function preencher(campos: Partial<Record<'nome' | 'nascimento' | 'email' | 'telefone' | 'senha', string>>) {
  const rotulos = {
    nome: 'Nome completo',
    nascimento: 'Data de nascimento',
    email: 'E-mail',
    telefone: 'Celular com WhatsApp',
    senha: 'Senha',
  } as const
  for (const [campo, valor] of Object.entries(campos)) {
    fireEvent.change(screen.getByLabelText(rotulos[campo as keyof typeof rotulos]), { target: { value: valor } })
  }
}

const COMPLETO = {
  nome: 'Maria Souza',
  nascimento: '20051990',
  email: 'Maria@Exemplo.com.br',
  telefone: '91988887777',
  senha: 'rio e maré cheia',
}

afterEach(cleanup)

describe('as máscaras', () => {
  it('a data se escreve dd/mm/aaaa enquanto se digita, e vira ISO para o domínio', () => {
    expect(mascaraDaData('2')).toBe('2')
    expect(mascaraDaData('2005')).toBe('20/05')
    expect(mascaraDaData('20051990')).toBe('20/05/1990')
    expect(mascaraDaData('20/05/19901')).toBe('20/05/1990')
    expect(dataIso('20/05/1990')).toBe('1990-05-20')
    expect(dataIso('20/05')).toBe('20/05')
  })
})

describe('CriarConta', () => {
  it('preenchido: manda o cadastro, e mostra "Confira seu e-mail" com o endereço', async () => {
    const { conta, cadastros } = contaQueResponde({ caso: 'CONFIRA_O_EMAIL' })
    render(<CriarConta conta={conta} hoje={hoje} />)
    preencher(COMPLETO)
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Confira seu e-mail' })).toBeTruthy()
    expect(screen.getByText('maria@exemplo.com.br')).toBeTruthy()
    expect(cadastros).toEqual([
      {
        nome: 'Maria Souza',
        dataNascimento: '1990-05-20',
        email: 'Maria@Exemplo.com.br',
        telefone: '(91) 98888-7777',
        senha: 'rio e maré cheia',
      },
    ])
  })

  it('vazio: um erro embaixo de cada campo, o foco no primeiro, e nada enviado', async () => {
    const { conta, cadastros } = contaQueResponde({ caso: 'CONFIRA_O_EMAIL' })
    render(<CriarConta conta={conta} hoje={hoje} />)
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    for (const erro of ['NOME', 'NASCIMENTO', 'EMAIL', 'TELEFONE', 'SENHA_CURTA'] as const) {
      expect(screen.getByText(ERRO_DO_CAMPO[erro])).toBeTruthy()
    }
    expect(document.activeElement).toBe(screen.getByLabelText('Nome completo'))
    expect(screen.getByLabelText('Nome completo').getAttribute('aria-invalid')).toBe('true')
    expect(cadastros).toEqual([])
  })

  it('o erro só aparece depois de sair do campo', () => {
    render(<CriarConta conta={contaQueResponde({ caso: 'CONFIRA_O_EMAIL' }).conta} hoje={hoje} />)
    const nascimento = screen.getByLabelText('Data de nascimento')
    fireEvent.change(nascimento, { target: { value: '14032012' } })
    expect(screen.queryByText(ERRO_DO_CAMPO.MENOR_DE_IDADE)).toBeNull()
    fireEvent.blur(nascimento)
    expect(screen.getByText(ERRO_DO_CAMPO.MENOR_DE_IDADE)).toBeTruthy()
  })

  it('a senha recusada pela API: a frase embaixo da senha, e o foco nela', async () => {
    const { conta } = contaQueResponde({ caso: 'SENHA_FRACA', motivo: 'SENHA_VAZADA' })
    render(<CriarConta conta={conta} hoje={hoje} />)
    preencher(COMPLETO)
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText(ERRO_DO_CAMPO.SENHA_VAZADA)).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Senha'))
    /* Mexer na senha tira a frase do servidor. */
    preencher({ senha: 'outra senha qualquer' })
    expect(screen.queryByText(ERRO_DO_CAMPO.SENHA_VAZADA)).toBeNull()
  })

  it('a falha de conexão: o quadro acima do botão, que vira "Tentar de novo", e o preenchido continua', async () => {
    const { conta } = contaQueResponde({ caso: 'FALHA', porque: 'CONEXAO' })
    render(<CriarConta conta={conta} hoje={hoje} />)
    preencher(COMPLETO)
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect((await screen.findByRole('alert')).textContent).toContain(FALHA_DO_CADASTRO.CONEXAO)
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
    expect((screen.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Maria Souza')
  })

  it('"Mostrar" troca a senha para texto, e de volta', () => {
    render(<CriarConta conta={contaQueResponde({ caso: 'CONFIRA_O_EMAIL' }).conta} hoje={hoje} />)
    const senha = screen.getByLabelText('Senha') as HTMLInputElement
    expect(senha.type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(senha.type).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: 'Esconder' }))
    expect(senha.type).toBe('password')
  })

  it('os termos e a privacidade, acima do botão, sem caixa de marcar (F)', async () => {
    render(<CriarConta conta={contaQueResponde({ caso: 'CONFIRA_O_EMAIL' }).conta} hoje={hoje} />)
    expect(screen.getByRole('link', { name: 'Termos de Uso' }).getAttribute('href')).toBe('/termos/')
    expect(screen.getByRole('link', { name: 'Política de Privacidade' }).getAttribute('href')).toBe('/privacidade/')
    expect(screen.queryByRole('checkbox')).toBeNull()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Criar conta' })).toBeTruthy())
  })
})
