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
    /* O 204 não tem corpo: o `Response` o recusa. */
    return new Response(status === 204 ? null : JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
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

describe('contaHttp — o "Reenviar" e o link de confirmação (3.2)', () => {
  it('o reenvio manda o e-mail para /conta/confirmacao/reenvio, e o 202 é "Confira seu e-mail"', async () => {
    const { pedidos, buscar } = api(202, { situacao: 'CONFIRA_O_EMAIL' })
    expect(await contaHttp('/api', null, buscar).reenviar('maria@exemplo.com.br')).toEqual({ caso: 'CONFIRA_O_EMAIL' })
    expect(pedidos[0]?.url).toBe('/api/conta/confirmacao/reenvio')
    expect(JSON.parse(pedidos[0]?.init?.body as string)).toEqual({ email: 'maria@exemplo.com.br' })
  })

  it.each([
    [429, 'LIMITE'],
    [503, 'CONEXAO'],
  ])('o reenvio com %i é FALHA por %s', async (status, porque) => {
    const { buscar } = api(status)
    expect(await contaHttp('/api', null, buscar).reenviar('maria@exemplo.com.br')).toEqual({ caso: 'FALHA', porque })
  })

  it('a confirmação manda o id e o código para /conta/confirmacao', async () => {
    const { pedidos, buscar } = api(200, { situacao: 'EMAIL_CONFIRMADO' })
    expect(await contaHttp('/api', null, buscar).confirmar('conta-1', 'c'.repeat(43))).toEqual({ caso: 'EMAIL_CONFIRMADO' })
    expect(pedidos[0]?.url).toBe('/api/conta/confirmacao')
    expect(JSON.parse(pedidos[0]?.init?.body as string)).toEqual({ contaId: 'conta-1', codigo: 'c'.repeat(43) })
  })

  it.each([
    [200, { situacao: 'JA_CONFIRMADO' }, { caso: 'JA_CONFIRMADO' }],
    [410, { erro: 'LINK_VENCIDO' }, { caso: 'LINK_VENCIDO' }],
    [410, { erro: 'LINK_INVALIDO' }, { caso: 'LINK_INVALIDO' }],
    [400, { erro: 'CORPO_INVALIDO' }, { caso: 'LINK_INVALIDO' }],
    [429, {}, { caso: 'FALHA', porque: 'LIMITE' }],
    [503, {}, { caso: 'FALHA', porque: 'CONEXAO' }],
    [200, { situacao: 'OUTRA' }, { caso: 'FALHA', porque: 'CONEXAO' }],
  ])('a confirmação com %i %j', async (status, corpo, resultado) => {
    const { buscar } = api(status, corpo)
    expect(await contaHttp('/api', null, buscar).confirmar('conta-1', 'c'.repeat(43))).toEqual(resultado)
  })

  it('sem a verificação da página, o cadastro não chega à API', async () => {
    const { pedidos, buscar } = api(202)
    expect(await contaHttp('/api', null, buscar).criar(CADASTRO)).toEqual({ caso: 'FALHA', porque: 'DESAFIO' })
    expect(pedidos).toEqual([])
  })
})

describe('contaHttp — entrar, quem está dentro e sair (3.3)', () => {
  it('entrar manda o e-mail, a senha e o desafio para /conta/entrar, e o 200 é DENTRO', async () => {
    const { pedidos, buscar } = api(200, { situacao: 'DENTRO', confirmada: false })
    expect(await contaHttp('/api', desafio, buscar).entrar('maria@exemplo.com.br', 'segredo')).toEqual({
      caso: 'DENTRO',
      confirmada: false,
    })
    expect(pedidos[0]?.url).toBe('/api/conta/entrar')
    expect(JSON.parse(pedidos[0]?.init?.body as string)).toEqual({
      email: 'maria@exemplo.com.br',
      senha: 'segredo',
      desafio: 'token-do-turnstile',
    })
  })

  it.each([
    [401, { erro: 'CREDENCIAIS_INVALIDAS' }, { caso: 'CREDENCIAIS_INVALIDAS' }],
    [429, { erro: 'TENTATIVAS_DEMAIS' }, { caso: 'TENTATIVAS_DEMAIS' }],
    [403, { erro: 'CONTA_DESATIVADA' }, { caso: 'CONTA_DESATIVADA' }],
    [429, { erro: 'LIMITE_EXCEDIDO' }, { caso: 'FALHA', porque: 'LIMITE' }],
    [403, { erro: 'DESAFIO_INVALIDO' }, { caso: 'FALHA', porque: 'DESAFIO' }],
    [503, { erro: 'ENTRAR_INDISPONIVEL' }, { caso: 'FALHA', porque: 'CONEXAO' }],
  ])('entrar com %i %j', async (status, corpo, resultado) => {
    const { buscar } = api(status, corpo)
    expect(await contaHttp('/api', desafio, buscar).entrar('maria@exemplo.com.br', 'x')).toEqual(resultado)
  })

  it('entrar sem a verificação da página não chega à API', async () => {
    const { pedidos, buscar } = api(200)
    expect(await contaHttp('/api', null, buscar).entrar('maria@exemplo.com.br', 'x')).toEqual({ caso: 'FALHA', porque: 'DESAFIO' })
    expect(pedidos).toEqual([])
  })

  it.each([
    [200, { situacao: 'DENTRO', confirmada: true }, { caso: 'DENTRO', confirmada: true }],
    [401, { erro: 'SEM_SESSAO' }, { caso: 'FORA' }],
    [503, { erro: 'ENTRAR_INDISPONIVEL' }, { caso: 'FALHA' }],
  ])('a sessão com %i %j', async (status, corpo, resultado) => {
    const { pedidos, buscar } = api(status, corpo)
    expect(await contaHttp('/api', null, buscar).sessao()).toEqual(resultado)
    expect(pedidos[0]?.url).toBe('/api/conta/sessao')
  })

  it('sair é o POST /conta/sair, e o 204 é true', async () => {
    const { pedidos, buscar } = api(204)
    expect(await contaHttp('/api', null, buscar).sair()).toBe(true)
    expect(pedidos[0]?.url).toBe('/api/conta/sair')
    expect(await contaHttp('/api', null, async () => Promise.reject(new TypeError('rede'))).sair()).toBe(false)
  })
})

describe('contaHttp — esqueci a senha (3.4)', () => {
  it('o pedido manda o e-mail para /conta/senha/esqueci, e o 202 é "Confira seu e-mail"', async () => {
    const { pedidos, buscar } = api(202, { situacao: 'CONFIRA_O_EMAIL' })
    expect(await contaHttp('/api', null, buscar).esqueci('maria@exemplo.com.br')).toEqual({ caso: 'CONFIRA_O_EMAIL' })
    expect(pedidos[0]?.url).toBe('/api/conta/senha/esqueci')
    expect(JSON.parse(pedidos[0]?.init?.body as string)).toEqual({ email: 'maria@exemplo.com.br' })
  })

  it('a senha nova manda o link e a senha para /conta/senha/nova, e o 200 é DENTRO', async () => {
    const { pedidos, buscar } = api(200, { situacao: 'DENTRO', confirmada: true })
    expect(await contaHttp('/api', null, buscar).novaSenha('conta-1', 'c'.repeat(43), 'a balsa sai às sete')).toEqual({
      caso: 'DENTRO',
    })
    expect(pedidos[0]?.url).toBe('/api/conta/senha/nova')
    expect(JSON.parse(pedidos[0]?.init?.body as string)).toEqual({
      contaId: 'conta-1',
      codigo: 'c'.repeat(43),
      senha: 'a balsa sai às sete',
    })
  })

  it.each([
    [410, { erro: 'LINK_INVALIDO' }, { caso: 'LINK_INVALIDO' }],
    [410, { erro: 'LINK_VENCIDO' }, { caso: 'LINK_VENCIDO' }],
    [403, { erro: 'CONTA_DESATIVADA' }, { caso: 'CONTA_DESATIVADA' }],
    [400, { erro: 'CORPO_INVALIDO' }, { caso: 'LINK_INVALIDO' }],
    [422, { erro: 'SENHA_FRACA', pendencias: ['SENHA_CURTA'] }, { caso: 'SENHA_FRACA', motivo: 'SENHA_CURTA' }],
    [422, { erro: 'SENHA_FRACA', pendencias: ['SENHA_COMUM'] }, { caso: 'SENHA_FRACA', motivo: 'SENHA_COMUM' }],
    [422, { erro: 'SENHA_FRACA', pendencias: ['SENHA_VAZADA'] }, { caso: 'SENHA_FRACA', motivo: 'SENHA_VAZADA' }],
    [429, { erro: 'LIMITE_EXCEDIDO' }, { caso: 'FALHA', porque: 'LIMITE' }],
    [503, { erro: 'SENHA_INDISPONIVEL' }, { caso: 'FALHA', porque: 'CONEXAO' }],
  ])('a senha nova com %i %j', async (status, corpo, resultado) => {
    const { buscar } = api(status, corpo)
    expect(await contaHttp('/api', null, buscar).novaSenha('conta-1', 'c'.repeat(43), 'x')).toEqual(resultado)
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
