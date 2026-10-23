/**
 * **O cadastro pela API** (3.1) — o que o site manda, e o que cada resposta vira.
 *
 * As réguas: o corpo leva o cadastro e **um desafio por envio**; o `202` é sempre "Confira seu e-mail", com conta nova
 * ou não (a API não revela); e o que não é resposta conhecida vira `FALHA` por conexão — nunca uma conta dada como
 * criada.
 */
import { describe, expect, it } from 'vitest'

import { DataCalendario, type CadastroDaConta } from '@navegsistemas/domain'

import { contaHttp, ContaEmMemoria } from '../src/conta.js'
import { DesafioSemConexao } from '../src/envio.js'
import type { Buscar } from '../src/http.js'

const CADASTRO: CadastroDaConta = {
  nome: 'Maria Souza',
  dataNascimento: '1990-05-20',
  email: 'maria@exemplo.com.br',
  telefone: '(91) 98888-7777',
  senha: 'rio e maré cheia',
}

/** Um `fetch` que guarda o pedido e responde o que o cenário mandar. */
function api(status: number, corpo: unknown = {}) {
  const pedidos: { url: string; init: RequestInit | undefined }[] = []
  const buscar: Buscar = async (url, init) => {
    pedidos.push({ url, init })
    return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
  }
  return { pedidos, buscar }
}

const desafio = async () => 'token-do-turnstile'

describe('contaHttp — o POST /conta', () => {
  it('manda o cadastro e o desafio para /conta, e o 202 é "Confira seu e-mail"', async () => {
    const { pedidos, buscar } = api(202, { situacao: 'CONFIRA_O_EMAIL' })
    expect(await contaHttp('/api/', desafio, buscar).criar(CADASTRO)).toEqual({ caso: 'CONFIRA_O_EMAIL' })
    expect(pedidos[0]?.url).toBe('/api/conta')
    expect(pedidos[0]?.init?.method).toBe('POST')
    expect(JSON.parse(pedidos[0]?.init?.body as string)).toEqual({ ...CADASTRO, desafio: 'token-do-turnstile' })
  })

  it('o 422 com pendências vira INVALIDO, só com as do domínio', async () => {
    const { buscar } = api(422, { erro: 'CADASTRO_INVALIDO', pendencias: ['NOME', 'MENOR_DE_IDADE', 'INVENTADA'] })
    expect(await contaHttp('/api', desafio, buscar).criar(CADASTRO)).toEqual({
      caso: 'INVALIDO',
      pendencias: new Set(['NOME', 'MENOR_DE_IDADE']),
    })
  })

  it.each([
    ['SENHA_COMUM', 'SENHA_COMUM'],
    ['SENHA_VAZADA', 'SENHA_VAZADA'],
  ])('o 422 SENHA_FRACA com %s diz o motivo', async (pendencia, motivo) => {
    const { buscar } = api(422, { erro: 'SENHA_FRACA', pendencias: [pendencia] })
    expect(await contaHttp('/api', desafio, buscar).criar(CADASTRO)).toEqual({ caso: 'SENHA_FRACA', motivo })
  })

  it('a senha curta que a API recusou volta como a pendência do domínio', async () => {
    const { buscar } = api(422, { erro: 'SENHA_FRACA', pendencias: ['SENHA_CURTA'] })
    expect(await contaHttp('/api', desafio, buscar).criar(CADASTRO)).toEqual({
      caso: 'INVALIDO',
      pendencias: new Set(['SENHA_CURTA']),
    })
  })

  it.each([
    [429, {}, 'LIMITE'],
    [403, { erro: 'DESAFIO_INVALIDO' }, 'DESAFIO'],
    [403, { erro: 'ORIGEM_NAO_PERMITIDA' }, 'CONEXAO'],
    [503, { erro: 'CADASTRO_INDISPONIVEL' }, 'CONEXAO'],
    [500, {}, 'CONEXAO'],
    [422, {}, 'CONEXAO'],
  ])('o %i vira FALHA por %s', async (status, corpo, porque) => {
    const { buscar } = api(status, corpo)
    expect(await contaHttp('/api', desafio, buscar).criar(CADASTRO)).toEqual({ caso: 'FALHA', porque: porque })
  })

  it('a rede que cai é FALHA por conexão', async () => {
    const buscar: Buscar = async () => Promise.reject(new TypeError('Failed to fetch'))
    expect(await contaHttp('/api', desafio, buscar).criar(CADASTRO)).toEqual({ caso: 'FALHA', porque: 'CONEXAO' })
  })

  it('o desafio que não resolve não chega à API: DESAFIO, ou CONEXAO quando é a rede', async () => {
    const { pedidos, buscar } = api(202)
    const semRede = async () => Promise.reject(new DesafioSemConexao('sem rede'))
    const recusado = async () => Promise.reject(new Error('falhou'))
    expect(await contaHttp('/api', semRede, buscar).criar(CADASTRO)).toEqual({ caso: 'FALHA', porque: 'CONEXAO' })
    expect(await contaHttp('/api', recusado, buscar).criar(CADASTRO)).toEqual({ caso: 'FALHA', porque: 'DESAFIO' })
    expect(pedidos).toEqual([])
  })
})

describe('ContaEmMemoria — a demonstração', () => {
  const hoje = () => DataCalendario.de('2026-10-23') as DataCalendario

  it('confere os campos pelo domínio, e guarda o cadastro que passa', async () => {
    const conta = new ContaEmMemoria(hoje)
    expect(await conta.criar(CADASTRO)).toEqual({ caso: 'CONFIRA_O_EMAIL' })
    expect(conta.cadastros).toEqual([CADASTRO])
  })

  it('o menor de idade e o celular errado: INVALIDO, como a API diria', async () => {
    const conta = new ContaEmMemoria(hoje)
    const resultado = await conta.criar({ ...CADASTRO, dataNascimento: '2012-03-14', telefone: '9888-7777' })
    expect(resultado).toEqual({ caso: 'INVALIDO', pendencias: new Set(['MENOR_DE_IDADE', 'TELEFONE']) })
    expect(conta.cadastros).toEqual([])
  })
})
