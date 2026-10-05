/**
 * **O pedido de reserva no fio** — o corpo que o totem manda e o servidor lê.
 *
 * A régua: o que o totem manda passa inteiro; o que o totem **nunca** mandaria — enum desconhecido, número
 * quebrado, texto enorme, tipo trocado — é `null`, e vira `400` na API. Nenhum deles pode chegar à montagem,
 * onde um `.trim()` num objeto seria um `500`.
 */
import { describe, expect, it } from 'vitest'

import {
  LIMITE_DO_DESAFIO,
  LIMITE_DO_NOME,
  pedidoDeReservaDoJson,
  respostasDaEncomendaDoJson,
  respostasDoJson,
  type PedidoDeReserva,
  type PedidoDeReservaJson,
} from '../src/reserva/pedido-http.js'
import { data, ENCOMENDA_PARA_OUTRA } from './exemplos.js'

const PEDIDO: PedidoDeReservaJson = {
  viagemId: 'viagem-quarta-18h',
  data: '2026-10-14',
  respostas: {
    categoria: 'PASSAGEIRO',
    acomodacao: 'REDE',
    tipo: 'INTEIRA',
    quantidadePessoas: 1,
    cliente: { nome: 'Maria Souza', telefone: '(91) 98888-7777' },
  },
  desafio: 'token-do-turnstile',
}

/** O pedido pela rede, como o totem o manda. */
const peloFio = (corpo: unknown) => pedidoDeReservaDoJson(JSON.parse(JSON.stringify(corpo)))

/** As respostas de passagem do pedido lido, quando é de passagem. */
const respostasDe = (pedido: PedidoDeReserva | null) => (pedido?.caso === 'PASSAGEM' ? pedido.respostas : undefined)

describe('o pedido de reserva', () => {
  it('o que o totem manda passa inteiro', () => {
    expect(peloFio(PEDIDO)).toEqual({
      caso: 'PASSAGEM',
      ocorrencia: { viagemId: 'viagem-quarta-18h', data: data('2026-10-14') },
      respostas: PEDIDO.respostas,
      desafio: 'token-do-turnstile',
    })
  })

  it('o veículo também — natureza, classe e cilindrada', () => {
    const moto = {
      ...PEDIDO,
      respostas: { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', cilindrada: 160, cliente: { nome: 'João' } },
    }
    expect(respostasDe(peloFio(moto))).toEqual(moto.respostas)
  })

  it('a observação é ignorada — o totem não tem esse campo, e texto livre público é o primeiro lugar de um abuso', () => {
    const comObservacao = { ...PEDIDO, respostas: { ...PEDIDO.respostas, observacao: 'qualquer coisa' } }
    expect(respostasDe(peloFio(comObservacao))).not.toHaveProperty('observacao')
  })

  it('o que o servidor deriva sozinho não é lido do corpo — código, instante, status', () => {
    const atrevido = { ...PEDIDO, codigo: 'NVG-AAAAAA', criadoEm: '2020-01-01T00:00:00', status: 'CONVERTIDA' }
    expect(peloFio(atrevido)).toEqual(peloFio(PEDIDO))
  })

  it('sem desafio, sem ocorrência legível, ou fora de forma, não é pedido', () => {
    const { desafio: _, ...semDesafio } = PEDIDO
    for (const torto of [
      null, [], 'pedido', semDesafio,
      { ...PEDIDO, desafio: '   ' },
      { ...PEDIDO, desafio: 'x'.repeat(LIMITE_DO_DESAFIO + 1) },
      { ...PEDIDO, viagemId: '' },
      { ...PEDIDO, data: '14/10/2026' },
      { ...PEDIDO, respostas: 'tudo' },
    ]) {
      expect(peloFio(torto)).toBeNull()
    }
  })
})

describe('as respostas, campo a campo', () => {
  const com = (campos: Record<string, unknown>) => respostasDoJson({ ...PEDIDO.respostas, ...campos })

  it('enum fora do conjunto é recusado', () => {
    for (const torto of [{ acomodacao: 'XYZ' }, { tipo: 1 }, { classeVeiculo: 'TANQUE' }, { naturezaVeiculo: '' }]) {
      expect(com(torto), JSON.stringify(torto)).toBeNull()
    }
  })

  it('a caixa e os espaços se normalizam como em toda fronteira do domínio (`deValor`)', () => {
    expect(com({ categoria: ' passageiro ' })?.categoria).toBe('PASSAGEIRO')
  })

  it('número que não é inteiro positivo, ou grande demais, é recusado', () => {
    for (const torto of [
      { quantidadePessoas: 0 }, { quantidadePessoas: 1.5 }, { quantidadePessoas: '2' }, { quantidadePessoas: 1e6 },
      { cilindrada: -160 }, { cilindrada: 1e9 },
    ]) {
      expect(com(torto), JSON.stringify(torto)).toBeNull()
    }
  })

  it('o cliente precisa ser texto, e caber — o nome no limite passa, um a mais não', () => {
    expect(com({ cliente: { nome: 'M'.repeat(LIMITE_DO_NOME) } })).not.toBeNull()
    for (const torto of [
      { cliente: { nome: 'M'.repeat(LIMITE_DO_NOME + 1) } },
      { cliente: { nome: { $gt: '' } } },
      { cliente: { nome: 'Maria', telefone: 91988887777 } },
      { cliente: 'Maria' },
    ]) {
      expect(com(torto), JSON.stringify(torto)).toBeNull()
    }
  })

  it('ausente continua ausente — o roteiro é quem diz o que falta', () => {
    expect(respostasDoJson({})).toEqual({})
    expect(respostasDoJson({ categoria: 'PASSAGEIRO' })).toEqual({ categoria: 'PASSAGEIRO' })
  })
})

describe('o pedido de encomenda', () => {
  const ENVIO = {
    viagemId: 'viagem-quarta-18h',
    data: '2026-10-14',
    encomenda: { ...ENCOMENDA_PARA_OUTRA, complemento: 'mantimentos' },
    desafio: 'token-do-turnstile',
  } satisfies PedidoDeReservaJson

  it('o que a seção manda passa inteiro, como pedido de encomenda', () => {
    expect(peloFio(ENVIO)).toEqual({
      caso: 'ENCOMENDA',
      ocorrencia: { viagemId: 'viagem-quarta-18h', data: data('2026-10-14') },
      encomenda: ENVIO.encomenda,
      desafio: 'token-do-turnstile',
    })
  })

  it('um pedido é de uma coisa só: com as respostas da passagem junto, não é pedido', () => {
    expect(peloFio({ ...ENVIO, respostas: PEDIDO.respostas })).toBeNull()
  })

  const com = (campos: Record<string, unknown>) => respostasDaEncomendaDoJson({ ...ENVIO.encomenda, ...campos })

  it('as listas são fechadas: tipo, faixa e retirada fora delas são recusados', () => {
    for (const torto of [{ tipoVolume: 'CONTAINER' }, { faixaPeso: 'ATE_1000' }, { retirada: 'CORREIO' }, { tipoVolume: 3 }]) {
      expect(com(torto), JSON.stringify(torto)).toBeNull()
    }
  })

  it('de 1 a 20 volumes, e o complemento até 60 caracteres', () => {
    expect(com({ quantidadeVolumes: 20, complemento: 'x'.repeat(60) })).not.toBeNull()
    for (const torto of [{ quantidadeVolumes: 0 }, { quantidadeVolumes: 21 }, { quantidadeVolumes: 2.5 }, { complemento: 'x'.repeat(61) }]) {
      expect(com(torto), JSON.stringify(torto)).toBeNull()
    }
  })

  it('o destinatário tem a forma do cliente, e o mesmo limite', () => {
    for (const torto of [{ destinatario: 'João' }, { destinatario: { nome: 'J'.repeat(101) } }, { destinatario: { nome: 'João', telefone: 96 } }]) {
      expect(com(torto), JSON.stringify(torto)).toBeNull()
    }
  })

  it('a observação e as chaves da passagem são ignoradas', () => {
    const lida = com({ observacao: 'frágil', acomodacao: 'REDE', categoria: 'PASSAGEIRO' })
    expect(lida).toEqual(ENVIO.encomenda)
  })
})
