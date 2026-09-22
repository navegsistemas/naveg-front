/**
 * **Enviar a reserva** — a ordem e a nova tentativa. Quem decide se há reserva é o domínio; aqui se confere
 * que o caso de uso não perde nem inventa nada no caminho até a porta.
 */
import { describe, expect, it } from 'vitest'

import { DataCalendario, InstanteLocal, type ContextoDaReserva, type RespostasDaReserva } from '@naveg/domain'

import { ReservaEmMemoria } from '../src/em-memoria.js'
import { enviarReserva, TENTATIVAS_DE_CODIGO } from '../src/enviar-reserva.js'
import type { ReservaRepositorio } from '../src/portas.js'

const CONTEXTO: ContextoDaReserva = {
  ocorrencia: { viagemId: 'v1', data: DataCalendario.de('2026-10-14') as DataCalendario },
  tipoEmbarcacao: 'FERRY_BOAT',
  partida: InstanteLocal.de('2026-10-14T18:00') as InstanteLocal,
}
const CRIADO_EM = InstanteLocal.de('2026-10-13T09:00') as InstanteLocal
const RESPOSTAS: RespostasDaReserva = {
  categoria: 'PASSAGEIRO',
  acomodacao: 'REDE',
  tipo: 'INTEIRA',
  cliente: { nome: 'Maria' },
}

function sequencia(...codigos: string[]): () => string {
  let i = 0
  return () => codigos[i++] ?? 'NVG-ZZZZZZ'
}

describe('enviar a reserva', () => {
  it('monta, grava o documento e devolve a reserva com o código', async () => {
    const repositorio = new ReservaEmMemoria()
    const resultado = await enviarReserva({
      respostas: RESPOSTAS,
      contexto: CONTEXTO,
      criadoEm: CRIADO_EM,
      repositorio,
      gerarCodigo: sequencia('NVG-7K3QP2'),
    })
    expect(resultado.caso === 'ENVIADA' && resultado.reserva.codigo).toBe('NVG-7K3QP2')
    /* O repositório guarda o documento — passou pelo codec, como no Firestore. */
    expect(repositorio.documento('NVG-7K3QP2')).toMatchObject({ status: 'RESERVADA', cliente: { nome: 'Maria' } })
  })

  it('código em uso: gera outro e monta de novo — nunca sobrescreve', async () => {
    const repositorio = new ReservaEmMemoria(['NVG-AAAAAA', 'NVG-BBBBBB'])
    const resultado = await enviarReserva({
      respostas: RESPOSTAS,
      contexto: CONTEXTO,
      criadoEm: CRIADO_EM,
      repositorio,
      gerarCodigo: sequencia('NVG-AAAAAA', 'NVG-BBBBBB', 'NVG-CCCCCC'),
    })
    expect(resultado.caso === 'ENVIADA' && resultado.reserva.codigo).toBe('NVG-CCCCCC')
  })

  it('desiste depois de tentativas demais, dizendo por quê', async () => {
    const ocupados = Array.from({ length: TENTATIVAS_DE_CODIGO }, (_, i) => `NVG-00000${i}`)
    const resultado = await enviarReserva({
      respostas: RESPOSTAS,
      contexto: CONTEXTO,
      criadoEm: CRIADO_EM,
      repositorio: new ReservaEmMemoria(ocupados),
      gerarCodigo: sequencia(...ocupados),
    })
    expect(resultado).toEqual({ caso: 'FALHA', motivo: `${TENTATIVAS_DE_CODIGO} códigos seguidos já estavam em uso` })
  })

  it('o que o domínio recusa não chega à porta', async () => {
    let chamadas = 0
    const repositorio: ReservaRepositorio = {
      criar: async () => {
        chamadas += 1
        return { caso: 'GRAVADA' }
      },
    }
    const partiu = await enviarReserva({
      respostas: RESPOSTAS,
      contexto: CONTEXTO,
      criadoEm: InstanteLocal.de('2026-10-14T18:30') as InstanteLocal,
      repositorio,
    })
    expect(partiu.caso).toBe('INCOERENTE')
    const incompleta = await enviarReserva({ respostas: {}, contexto: CONTEXTO, criadoEm: CRIADO_EM, repositorio })
    expect(incompleta.caso).toBe('INCOMPLETA')
    expect(chamadas).toBe(0)
  })

  it('falha da porta chega como falha, sem nova tentativa', async () => {
    const repositorio: ReservaRepositorio = { criar: async () => ({ caso: 'FALHA', motivo: 'sem rede' }) }
    expect(
      await enviarReserva({ respostas: RESPOSTAS, contexto: CONTEXTO, criadoEm: CRIADO_EM, repositorio }),
    ).toEqual({ caso: 'FALHA', motivo: 'sem rede' })
  })
})
