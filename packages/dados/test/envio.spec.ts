/**
 * **O envio pela API** — o que o totem manda, e o que cada resposta vira.
 *
 * Três réguas: o corpo leva **só** o que a pessoa pode afirmar; o código que volta é o **do servidor**; e toda
 * resposta que não é sucesso nem recusa conhecida vira `FALHA` — nunca uma reserva inventada no navegador.
 */
import { describe, expect, it } from 'vitest'

import {
  DataCalendario,
  InstanteLocal,
  montarEncomenda,
  montarReserva,
  paraDocumento,
  type ContextoDaReserva,
  type Reserva,
  type RespostasDaEncomenda,
  type RespostasDaReserva,
  type TravessiaOfertada,
} from '@navegsistemas/domain'

import { envioHttp, envioHttpDaEncomenda, type PedidoDaEncomenda, type PedidoDoTotem } from '../src/envio.js'
import type { Buscar } from '../src/http.js'

const CONTEXTO: ContextoDaReserva = {
  ocorrencia: { viagemId: 'v1', data: DataCalendario.de('2026-10-14') as DataCalendario },
  tipoEmbarcacao: 'FERRY_BOAT',
  partida: InstanteLocal.de('2026-10-14T18:00') as InstanteLocal,
}
const RESPOSTAS: RespostasDaReserva = {
  categoria: 'PASSAGEIRO',
  acomodacao: 'REDE',
  tipo: 'INTEIRA',
  cliente: { nome: 'Maria' },
}
const PEDIDO: PedidoDoTotem = {
  travessia: { contexto: CONTEXTO } as TravessiaOfertada,
  respostas: RESPOSTAS,
  criadoEm: InstanteLocal.de('2026-10-13T09:00') as InstanteLocal,
}

/** A reserva como o servidor a montaria — com o código **dele**. */
function doServidor(codigo: string): Reserva {
  const montagem = montarReserva(RESPOSTAS, CONTEXTO, {
    codigo,
    criadoEm: InstanteLocal.de('2026-10-13T09:01') as InstanteLocal,
  })
  if (montagem.caso !== 'OK') throw new Error('exemplo incoerente')
  return montagem.reserva
}

function respondendo(status: number, corpo: unknown): { buscar: Buscar; pedidos: { url: string; init?: RequestInit }[] } {
  const pedidos: { url: string; init?: RequestInit }[] = []
  return {
    pedidos,
    buscar: async (url, init) => {
      pedidos.push(init === undefined ? { url } : { url, init })
      return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
    },
  }
}

const desafio = async () => 'token-do-turnstile'

describe('o envio pela API', () => {
  it('manda só a ocorrência, as respostas e o desafio — para /reservas', async () => {
    const { buscar, pedidos } = respondendo(201, { codigo: 'NVG-7K3QP2', reserva: paraDocumento(doServidor('NVG-7K3QP2')) })
    await envioHttp('https://api/', desafio, buscar).enviar(PEDIDO)

    expect(pedidos[0]?.url).toBe('https://api/reservas')
    expect(pedidos[0]?.init?.method).toBe('POST')
    expect(JSON.parse(String(pedidos[0]?.init?.body))).toEqual({
      viagemId: 'v1',
      data: '2026-10-14',
      respostas: RESPOSTAS,
      desafio: 'token-do-turnstile',
    })
  })

  /* 2.7: a encomenda do site vai como pedido de encomenda — é por ele que a API aplica a semana e as regras dela. */
  it('a encomenda pelo site vai como encomenda, sem o canal nem o que vai embarcar', async () => {
    const { buscar, pedidos } = respondendo(500, {})
    await envioHttp('https://api/', desafio, buscar).enviar({
      ...PEDIDO,
      respostas: {
        canal: 'SITE',
        embarque: 'ENCOMENDA',
        tipoVolume: 'CAIXA',
        quantidadeVolumes: 3,
        faixaPeso: 'DE_5_A_20',
        cliente: { nome: 'Maria', telefone: '(91) 98888-7777' },
        semDestinatario: true,
      },
    })
    expect(JSON.parse(String(pedidos[0]?.init?.body))).toEqual({
      viagemId: 'v1',
      data: '2026-10-14',
      encomenda: {
        tipoVolume: 'CAIXA',
        quantidadeVolumes: 3,
        faixaPeso: 'DE_5_A_20',
        cliente: { nome: 'Maria', telefone: '(91) 98888-7777' },
      },
      desafio: 'token-do-turnstile',
    })
  })

  it('201: a reserva é a do servidor, com o código dele', async () => {
    const { buscar } = respondendo(201, { codigo: 'NVG-SRV123', reserva: paraDocumento(doServidor('NVG-SRV123')) })
    const resultado = await envioHttp('https://api', desafio, buscar).enviar(PEDIDO)
    expect(resultado.caso === 'ENVIADA' && resultado.reserva.codigo).toBe('NVG-SRV123')
  })

  it('201 com uma reserva ilegível é falha — o totem não inventa uma', async () => {
    const { buscar } = respondendo(201, { codigo: 'NVG-SRV123', reserva: { categoria: 'NAVE' } })
    expect((await envioHttp('https://api', desafio, buscar).enviar(PEDIDO)).caso).toBe('FALHA')
  })

  it('409: a saída saiu da oferta — vira a pendência que o totem já sabe dizer', async () => {
    const { buscar } = respondendo(409, { erro: 'TRAVESSIA_INDISPONIVEL', mensagem: '' })
    const resultado = await envioHttp('https://api', desafio, buscar).enviar(PEDIDO)
    expect(resultado.caso === 'INCOERENTE' && [...resultado.pendencias]).toEqual(['VALIDADE'])
  })

  it('422: as pendências do servidor, só as que o domínio conhece', async () => {
    const { buscar } = respondendo(422, { erro: 'RESERVA_INCOERENTE', mensagem: '', pendencias: ['QUANTIDADE', 'INVENTADA'] })
    const resultado = await envioHttp('https://api', desafio, buscar).enviar(PEDIDO)
    expect(resultado.caso === 'INCOERENTE' && [...resultado.pendencias]).toEqual(['QUANTIDADE'])
  })

  it('403, 429, 500 e a rede caída são falha — "não foi possível enviar agora"', async () => {
    for (const status of [403, 429, 500, 503]) {
      const { buscar } = respondendo(status, { erro: 'X', mensagem: '' })
      expect((await envioHttp('https://api', desafio, buscar).enviar(PEDIDO)).caso, String(status)).toBe('FALHA')
    }
    const semRede: Buscar = async () => {
      throw new TypeError('Failed to fetch')
    }
    expect((await envioHttp('https://api', desafio, semRede).enviar(PEDIDO)).caso).toBe('FALHA')
  })

  /* 2.6, A (PO, 2026-10-16): o porquê da falha, para a tela dizer o que fazer. */
  it('o porquê da falha: o limite, o desafio, e o resto é a conexão', async () => {
    const porque = async (status: number, erro: string) => {
      const { buscar } = respondendo(status, { erro, mensagem: '' })
      const resultado = await envioHttp('https://api', desafio, buscar).enviar(PEDIDO)
      return resultado.caso === 'FALHA' ? resultado.porque : resultado.caso
    }
    expect(await porque(429, 'LIMITE_EXCEDIDO')).toBe('LIMITE')
    expect(await porque(403, 'DESAFIO_INVALIDO')).toBe('DESAFIO')
    expect(await porque(403, 'ORIGEM_NAO_PERMITIDA')).toBe('CONEXAO')
    expect(await porque(500, 'FALHA_INTERNA')).toBe('CONEXAO')
    const semRede: Buscar = async () => {
      throw new TypeError('Failed to fetch')
    }
    const caida = await envioHttp('https://api', desafio, semRede).enviar(PEDIDO)
    expect(caida.caso === 'FALHA' && caida.porque).toBe('CONEXAO')
    const semDesafio = await envioHttp('https://api', () => Promise.reject(new Error('fechou')), semRede).enviar(PEDIDO)
    expect(semDesafio.caso === 'FALHA' && semDesafio.porque).toBe('DESAFIO')
  })

  it('o desafio que não resolve é falha, e nada é enviado', async () => {
    const { buscar, pedidos } = respondendo(201, {})
    const resultado = await envioHttp('https://api', () => Promise.reject(new Error('fechou')), buscar).enviar(PEDIDO)
    expect(resultado.caso).toBe('FALHA')
    expect(pedidos).toEqual([])
  })
})

describe('o envio da encomenda pela API', () => {
  const ENCOMENDA: RespostasDaEncomenda = {
    tipoVolume: 'CAIXA',
    quantidadeVolumes: 3,
    faixaPeso: 'DE_5_A_20',
    retirada: 'OUTRA_PESSOA',
    destinatario: { nome: 'João Lima', telefone: '(96) 98888-7777' },
    cliente: { nome: 'Maria Souza' },
  }
  const PEDIDO_DA_ENCOMENDA: PedidoDaEncomenda = { ...PEDIDO, respostas: ENCOMENDA }

  function encomendaDoServidor(codigo: string) {
    const montagem = montarEncomenda(ENCOMENDA, CONTEXTO, { codigo, criadoEm: InstanteLocal.de('2026-10-13T09:01') as InstanteLocal })
    if (montagem.caso !== 'OK') throw new Error('exemplo incoerente')
    return montagem.reserva
  }

  it('manda a encomenda no lugar das respostas, para a mesma rota', async () => {
    const { buscar, pedidos } = respondendo(201, { codigo: 'NVG-SRV123', reserva: paraDocumento(encomendaDoServidor('NVG-SRV123')) })
    const resultado = await envioHttpDaEncomenda('https://api', desafio, buscar).enviar(PEDIDO_DA_ENCOMENDA)

    expect(pedidos[0]?.url).toBe('https://api/reservas')
    expect(JSON.parse(String(pedidos[0]?.init?.body))).toEqual({
      viagemId: 'v1',
      data: '2026-10-14',
      encomenda: ENCOMENDA,
      desafio: 'token-do-turnstile',
    })
    expect(resultado.caso === 'ENVIADA' && resultado.reserva.codigo).toBe('NVG-SRV123')
  })

  it('uma reserva de passagem de volta é falha — não é o que foi pedido', async () => {
    const { buscar } = respondendo(201, { codigo: 'NVG-SRV123', reserva: paraDocumento(doServidor('NVG-SRV123')) })
    expect((await envioHttpDaEncomenda('https://api', desafio, buscar).enviar(PEDIDO_DA_ENCOMENDA)).caso).toBe('FALHA')
  })

  it('422 com as pendências da encomenda, e 409 como a saída que partiu', async () => {
    const recusa = respondendo(422, { pendencias: ['DESTINATARIO_TELEFONE'] })
    const recusada = await envioHttpDaEncomenda('https://api', desafio, recusa.buscar).enviar(PEDIDO_DA_ENCOMENDA)
    expect(recusada.caso === 'INCOERENTE' && [...recusada.pendencias]).toEqual(['DESTINATARIO_TELEFONE'])

    const partiu = respondendo(409, {})
    const fora = await envioHttpDaEncomenda('https://api', desafio, partiu.buscar).enviar(PEDIDO_DA_ENCOMENDA)
    expect(fora.caso === 'INCOERENTE' && [...fora.pendencias]).toEqual(['VALIDADE'])
  })
})
