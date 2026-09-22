/**
 * **A FSM da reserva** — pequena, e própria. `RESERVADA → CONVERTIDA | EXPIRADA | CANCELADA`.
 */
import { describe, expect, it } from 'vitest'

import { STATUS_DA_WEB, STATUS_DE_RESERVA, StatusReserva } from '../src/reserva/status-reserva.js'
import { pessoasDaReserva, reservaExpirada, type Reserva } from '../src/reserva/reserva.js'
import { montarReserva } from '../src/reserva/montagem-da-reserva.js'
import { contexto, IDENTIDADE, instante, REDE_COMPLETA } from './exemplos.js'

describe('a FSM', () => {
  it('a web só escreve RESERVADA — e é o estado inicial', () => {
    expect(STATUS_DA_WEB).toBe('RESERVADA')
    expect(StatusReserva.inicial).toBe('RESERVADA')
  })

  it('RESERVADA vai para qualquer um dos três terminais', () => {
    expect(StatusReserva.destinos('RESERVADA')).toEqual(['CONVERTIDA', 'EXPIRADA', 'CANCELADA'])
    for (const destino of ['CONVERTIDA', 'EXPIRADA', 'CANCELADA'] as const) {
      expect(StatusReserva.transicaoValida('RESERVADA', destino), destino).toBe(true)
    }
  })

  it('os três terminais não saem para lugar nenhum — nem de volta', () => {
    for (const terminal of ['CONVERTIDA', 'EXPIRADA', 'CANCELADA'] as const) {
      expect(StatusReserva.terminal(terminal), terminal).toBe(true)
      for (const destino of STATUS_DE_RESERVA) {
        expect(StatusReserva.transicaoValida(terminal, destino), `${terminal}→${destino}`).toBe(false)
      }
    }
  })

  it('RESERVADA não transita para si mesma, e é o único estado em aberto', () => {
    expect(StatusReserva.transicaoValida('RESERVADA', 'RESERVADA')).toBe(false)
    expect(STATUS_DE_RESERVA.filter(StatusReserva.emAberto)).toEqual(['RESERVADA'])
  })

  it('não compartilha vocabulário com a passagem — A_EMITIR não é status de reserva', () => {
    expect(StatusReserva.de('A_EMITIR')).toBeNull()
    expect(StatusReserva.de('EMITIDA')).toBeNull()
    expect(StatusReserva.de(' reservada ')).toBe('RESERVADA')
  })

  it('tem rótulo para cada status', () => {
    for (const status of STATUS_DE_RESERVA) {
      expect(StatusReserva.rotulo(status).length, status).toBeGreaterThan(0)
    }
  })
})

describe('o tempo da reserva', () => {
  const reserva = (() => {
    const resultado = montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE)
    if (resultado.caso !== 'OK') throw new Error('exemplo quebrado')
    return resultado.reserva
  })() satisfies Reserva

  it('expira quando o navio parte — nem um segundo antes', () => {
    expect(reservaExpirada(reserva, instante('2026-10-14T17:59:59'))).toBe(false)
    expect(reservaExpirada(reserva, instante('2026-10-14T18:00:00'))).toBe(true)
  })

  it('conta as pessoas do pedido', () => {
    expect(pessoasDaReserva(reserva)).toBe(1)
  })
})
