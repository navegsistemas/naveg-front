/**
 * **A conta do cliente** — o cadastro, o documento na primeira compra, o codec e os lotes, contra a forma que a regra
 * do fluviapp-kmp confere (`formaDaConta`, `documentosDeConta`). Divergir aqui não dá erro no código: dá
 * `PERMISSION_DENIED` no lote, e a conta não nasce.
 */
import { describe, expect, it } from 'vitest'

import {
  ACOES_DO_SERVIDOR,
  ACOES_NA_CONTA,
  atendimentoFeito,
  atendimentoRecusado,
  enderecoDoServidor,
  pedidoDoDocumento,
} from '../src/conta/atendimento-da-conta.js'
import {
  CAMPOS_DA_CONTA,
  chaveDoIndiceDaConta,
  contaDoDocumento,
  contaNova,
  contaParaDocumento,
  contaTemDocumento,
  documentoDaConta,
  documentoMascarado,
  idadeEm,
  loteDaContaApagada,
  loteDaContaNova,
  loteDoDocumentoDaConta,
  normalizarEmail,
  pendenciasDoCadastro,
  type CadastroDaConta,
  type ContaDoCliente,
} from '../src/conta/conta-do-cliente.js'
import { DataCalendario } from '../src/primitivos/calendario.js'

const data = (texto: string): DataCalendario => DataCalendario.de(texto) as DataCalendario
const HOJE = data('2026-10-20')

const CADASTRO: CadastroDaConta = {
  nome: '  Maria   Souza ',
  dataNascimento: '1990-05-12',
  email: ' Maria.Souza@Exemplo.com ',
  telefone: '(91) 98888-7777',
  senha: 'travessia-boa',
}

function conta(): ContaDoCliente {
  const resultado = contaNova('c1', CADASTRO, 1_792_500_000_000, HOJE)
  if (resultado.caso !== 'CONTA') throw new Error('o cadastro de exemplo devia valer')
  return resultado.conta
}

/** A `formaDaConta` da regra, escrita de novo aqui: é ela que o documento gravado tem de passar. */
function passaNaRegra(documento: object): boolean {
  const d = documento as Readonly<Record<string, unknown>>
  const chaves = Object.keys(d)
  const opcional = (k: string, tipo: 'number' | 'boolean' | 'string') => d[k] === undefined || d[k] === null || typeof d[k] === tipo
  const temDocumento = d['tipoDocumento'] !== undefined && d['tipoDocumento'] !== null
  const permissao = (canal: string) =>
    (d[canal] == null && d[`${canal}Em`] == null) ||
    (typeof d[canal] === 'boolean' && Number.isInteger(d[`${canal}Em`]) && (d[`${canal}Em`] as number) > 0)
  return (
    chaves.every((k) => (CAMPOS_DA_CONTA as readonly string[]).includes(k)) &&
    ['nome', 'email', 'telefone', 'dataNascimento', 'criadaEm', 'ativa'].every((k) => chaves.includes(k)) &&
    typeof d['nome'] === 'string' && d['nome'].length > 0 && d['nome'].length <= 120 &&
    typeof d['email'] === 'string' && d['email'].length > 0 && d['email'].length <= 254 &&
    typeof d['telefone'] === 'string' && d['telefone'].length > 0 && d['telefone'].length <= 30 &&
    (temDocumento
      ? ['CPF', 'CNPJ', 'RG', 'CNH', 'PASSAPORTE'].includes(d['tipoDocumento'] as string) &&
        typeof d['numeroDocumento'] === 'string' && /^[0-9A-Z]{5,14}$/.test(d['numeroDocumento'])
      : d['numeroDocumento'] == null) &&
    typeof d['dataNascimento'] === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d['dataNascimento']) &&
    Number.isInteger(d['criadaEm']) &&
    typeof d['ativa'] === 'boolean' &&
    opcional('confirmadaEm', 'number') &&
    (d['ultimoEnvioTipo'] == null || ['CONFIRMACAO', 'TROCA_DE_SENHA'].includes(d['ultimoEnvioTipo'] as string)) &&
    opcional('ultimoEnvioEm', 'number') &&
    opcional('bloqueadaAte', 'number') &&
    permissao('envioPorEmail') &&
    permissao('envioPorWhatsapp')
  )
}

describe('o cadastro (3.1)', () => {
  it('vira conta por confirmar, ativa e sem documento, com o nome, o e-mail e o celular canônicos', () => {
    expect(conta()).toEqual({
      id: 'c1',
      nome: 'Maria Souza',
      email: 'maria.souza@exemplo.com',
      telefone: '5591988887777',
      dataNascimento: '1990-05-12',
      documento: null,
      criadaEm: 1_792_500_000_000,
      confirmadaEm: null,
      ativa: true,
      ultimoEnvio: null,
      bloqueadaAte: null,
      envioPorEmail: null,
      envioPorWhatsapp: null,
    })
  })

  it('a senha não entra na conta', () => {
    expect(JSON.stringify(contaParaDocumento(conta()))).not.toContain(CADASTRO.senha)
  })

  it('cada campo errado tem a sua pendência', () => {
    const pendencias = pendenciasDoCadastro(
      { nome: '   ', dataNascimento: '2026-02-30', email: 'maria@', telefone: '98888-7777', senha: '1234567' },
      HOJE,
    )
    expect([...pendencias]).toEqual(['NOME', 'NASCIMENTO', 'EMAIL', 'TELEFONE', 'SENHA_CURTA'])
    const comPendencia = contaNova('c1', { ...CADASTRO, email: 'sem-arroba' }, 1, HOJE)
    expect(comPendencia.caso === 'PENDENTE' && [...comPendencia.pendencias]).toEqual(['EMAIL'])
  })

  it('18 anos completos no dia do aniversário, e não antes (3.1, D)', () => {
    expect([...pendenciasDoCadastro({ ...CADASTRO, dataNascimento: '2008-10-20' }, HOJE)]).toEqual([])
    expect([...pendenciasDoCadastro({ ...CADASTRO, dataNascimento: '2008-10-21' }, HOJE)]).toEqual(['MENOR_DE_IDADE'])
    expect([...pendenciasDoCadastro({ ...CADASTRO, dataNascimento: '2026-10-21' }, HOJE)]).toEqual(['NASCIMENTO'])
    expect(idadeEm(data('2008-02-29'), data('2026-02-28'))).toBe(17)
    expect(idadeEm(data('2008-02-29'), data('2026-03-01'))).toBe(18)
  })

  it('o e-mail sem espaço, em minúsculas, com um ponto no domínio e até 254', () => {
    expect(normalizarEmail(' A@B.COM ')).toBe('a@b.com')
    expect(normalizarEmail('a@b')).toBeNull()
    expect(normalizarEmail('a b@c.com')).toBeNull()
    expect(normalizarEmail(`${'a'.repeat(250)}@b.com`)).toBeNull()
  })
})

describe('o documento, na primeira compra', () => {
  it('CPF, RG, CNH e Passaporte; sem CNPJ, e o CPF com o dígito verificador', () => {
    expect(documentoDaConta('CPF', '529.982.247-25')).toEqual({ tipo: 'CPF', numero: '52998224725' })
    expect(documentoDaConta('PASSAPORTE', 'ab-123456')).toEqual({ tipo: 'PASSAPORTE', numero: 'AB123456' })
    expect(documentoDaConta('CNPJ', '11.222.333/0001-81')).toBeNull()
    expect(documentoDaConta('CPF', '529.982.247-24')).toBeNull()
    expect(documentoDaConta('TITULO', '123456')).toBeNull()
  })

  it('a chave do índice é a do passageiro: o tipo e o número canônico', () => {
    expect(chaveDoIndiceDaConta({ tipo: 'CPF', numero: '529.982.247-25' })).toBe('CPF:52998224725')
  })

  it('o lote leva a conta e o índice juntos, e o documento entra uma vez só', () => {
    const resultado = loteDoDocumentoDaConta(conta(), 'CPF', '52998224725')
    expect(resultado.caso).toBe('LOTE')
    if (resultado.caso !== 'LOTE') return
    expect(resultado.escritas).toEqual([
      { op: 'atualizar', caminho: 'contasDeCliente/c1', dados: { tipoDocumento: 'CPF', numeroDocumento: '52998224725' } },
      { op: 'criar', caminho: 'documentosDeConta/CPF:52998224725', dados: { contaId: 'c1' } },
    ])
    expect(contaTemDocumento(resultado.conta)).toBe(true)
    expect(passaNaRegra(contaParaDocumento(resultado.conta))).toBe(true)
    expect(loteDoDocumentoDaConta(resultado.conta, 'CPF', '52998224725').caso).toBe('JA_TEM_DOCUMENTO')
    expect(loteDoDocumentoDaConta(conta(), 'CNPJ', '11222333000181').caso).toBe('DOCUMENTO_INVALIDO')
  })

  it('na tela, sempre mascarado (4.2, D)', () => {
    expect(documentoMascarado({ tipo: 'CPF', numero: '52998224725' })).toBe('CPF ###.###.247-25')
  })
})

describe('o codec e os lotes', () => {
  it('a conta nova passa na regra, e sem documento não há chave de documento nem null', () => {
    const documento = contaParaDocumento(conta())
    expect(passaNaRegra(documento)).toBe(true)
    expect(Object.keys(documento)).toEqual(['nome', 'email', 'telefone', 'dataNascimento', 'criadaEm', 'ativa'])
    expect(JSON.stringify(documento)).not.toContain('null')
  })

  it('ida e volta, com tudo o que o servidor espelha', () => {
    const cheia: ContaDoCliente = {
      ...conta(),
      documento: { tipo: 'CPF', numero: '52998224725' },
      confirmadaEm: 1_792_500_100_000,
      ultimoEnvio: { tipo: 'TROCA_DE_SENHA', em: 1_792_500_200_000 },
      bloqueadaAte: 1_792_500_300_000,
      envioPorEmail: { permitida: true, em: 1_792_500_400_000 },
      envioPorWhatsapp: { permitida: false, em: 1_792_500_400_000 },
    }
    const documento = contaParaDocumento(cheia)
    expect(Object.keys(documento)).toEqual([...CAMPOS_DA_CONTA])
    expect(passaNaRegra(documento)).toBe(true)
    expect(contaDoDocumento('c1', documento)).toEqual(cheia)
  })

  it('o que a regra recusaria não vira conta', () => {
    const documento = contaParaDocumento(conta())
    expect(contaDoDocumento('c1', { ...documento, telefone: '' })).toBeNull()
    expect(contaDoDocumento('c1', { ...documento, dataNascimento: '12/05/1990' })).toBeNull()
    expect(contaDoDocumento('c1', { ...documento, numeroDocumento: '52998224725' })).toBeNull()
    expect(contaDoDocumento('c1', { ...documento, tipoDocumento: 'CPF', numeroDocumento: '529.982.247-25' })).toBeNull()
    expect(contaDoDocumento('', documento)).toBeNull()
    expect(contaDoDocumento('c1', null)).toBeNull()
  })

  it('a permissão sem a data conta como não respondida, e null é ausência', () => {
    const documento = { ...contaParaDocumento(conta()), envioPorEmail: true, confirmadaEm: null, tipoDocumento: null }
    const lida = contaDoDocumento('c1', documento)
    expect(lida?.envioPorEmail).toBeNull()
    expect(lida?.confirmadaEm).toBeNull()
    expect(lida?.documento).toBeNull()
  })

  it('criar: só a conta, sem documento; com documento, o índice junto', () => {
    expect(loteDaContaNova(conta())).toEqual([
      { op: 'criar', caminho: 'contasDeCliente/c1', dados: contaParaDocumento(conta()) },
    ])
    const comDocumento = { ...conta(), documento: { tipo: 'RG' as const, numero: '1234567' } }
    expect(loteDaContaNova(comDocumento)[1]).toEqual({
      op: 'criar',
      caminho: 'documentosDeConta/RG:1234567',
      dados: { contaId: 'c1' },
    })
  })

  it('apagar leva o índice no mesmo lote, para o documento não ficar preso', () => {
    expect(loteDaContaApagada(conta())).toEqual([{ op: 'apagar', caminho: 'contasDeCliente/c1' }])
    expect(loteDaContaApagada({ ...conta(), documento: { tipo: 'CPF', numero: '52998224725' } })).toEqual([
      { op: 'apagar', caminho: 'contasDeCliente/c1' },
      { op: 'apagar', caminho: 'documentosDeConta/CPF:52998224725' },
    ])
  })
})

describe('o atendimento da conta (#84)', () => {
  const PEDIDO = {
    contaId: 'c1',
    acao: 'CORRIGIR_EMAIL',
    emailNovo: 'novo@exemplo.com',
    porId: 'u-supervisor',
    porNome: 'Supervisor',
    criadoEm: 1_792_500_000_000,
    situacao: 'PENDENTE',
  }

  it('as ações do servidor são as seis da regra; as do painel ficam de fora', () => {
    expect([...ACOES_DO_SERVIDOR]).toEqual(ACOES_NA_CONTA.slice(0, 6))
    expect(pedidoDoDocumento('a1', { ...PEDIDO, acao: 'DESATIVAR', emailNovo: null, situacao: 'FEITO' })).toBeNull()
  })

  it('o pedido pendente é lido; o fechado, o desconhecido e o e-mail fora de lugar, não', () => {
    expect(pedidoDoDocumento('a1', PEDIDO)).toEqual({
      id: 'a1',
      contaId: 'c1',
      acao: 'CORRIGIR_EMAIL',
      emailNovo: 'novo@exemplo.com',
      porId: 'u-supervisor',
      porNome: 'Supervisor',
      criadoEm: 1_792_500_000_000,
    })
    expect(pedidoDoDocumento('a1', { ...PEDIDO, situacao: 'FEITO' })).toBeNull()
    expect(pedidoDoDocumento('a1', { ...PEDIDO, acao: 'INVENTADA' })).toBeNull()
    expect(pedidoDoDocumento('a1', { ...PEDIDO, emailNovo: null })).toBeNull()
    expect(pedidoDoDocumento('a1', { ...PEDIDO, acao: 'LIBERAR_TENTATIVAS' })).toBeNull()
    expect(pedidoDoDocumento('a1', { ...PEDIDO, acao: 'LIBERAR_TENTATIVAS', emailNovo: null })?.acao).toBe('LIBERAR_TENTATIVAS')
  })

  it('o fechamento muda só as quatro chaves da regra, e apaga o e-mail novo', () => {
    expect(atendimentoFeito(10)).toEqual({ situacao: 'FEITO', concluidoEm: 10, motivo: null, emailNovo: null })
    expect(atendimentoRecusado(10, 'EMAIL_EM_USO')).toEqual({
      situacao: 'RECUSADO',
      concluidoEm: 10,
      motivo: 'EMAIL_EM_USO',
      emailNovo: null,
    })
    expect(atendimentoRecusado(10, 'x'.repeat(80)).motivo).toHaveLength(60)
  })

  it('o endereço do servidor tem a forma da regra', () => {
    expect(enderecoDoServidor(' https://naveg-api-vercel.vercel.app ')).toEqual({ url: 'https://naveg-api-vercel.vercel.app' })
    expect(enderecoDoServidor('ftp://x')).toBeNull()
    expect(enderecoDoServidor('https://com espaco')).toBeNull()
    expect(enderecoDoServidor(`https://${'a'.repeat(201)}`)).toBeNull()
  })
})
