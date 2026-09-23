/**
 * **O evento** — a forma que a Rule do fluviapp-kmp confere. Divergir aqui não dá erro no código: dá
 * `PERMISSION_DENIED` no lote, e a reserva não é gravada.
 */
import { describe, expect, it } from 'vitest'

import { CAMPOS_DO_EVENTO, eventoDaReservaCriada, idDoEvento, paraDoTipo, TIPOS_DE_EVENTO } from '../src/evento/evento.js'
import type { ReservaDePassageiro } from '../src/reserva/reserva.js'
import { instante, OCORRENCIA } from './exemplos.js'

const RESERVA: ReservaDePassageiro = {
  codigo: 'NVG-7K3QP2',
  ocorrencia: OCORRENCIA,
  cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
  status: 'RESERVADA',
  origem: 'TOTEM_WEB',
  criadoEm: instante('2026-10-01T23:30:00'),
  expiraEm: instante('2026-10-14T18:00:00'),
  agenciaId: 'naveg',
  categoria: 'PASSAGEIRO',
  acomodacao: 'REDE',
  tipo: 'INTEIRA',
  quantidadePessoas: 1,
}

describe('o evento da reserva criada', () => {
  it('deriva tudo da reserva — o instante e a agência são os dela', () => {
    expect(eventoDaReservaCriada(RESERVA, 'naveg-api')).toEqual({
      tipo: 'reserva.criada',
      entidade: { colecao: 'reservas', id: 'NVG-7K3QP2' },
      agenciaId: 'naveg',
      origem: 'api-agencia',
      severidade: 'INFO',
      porId: 'naveg-api',
      em: '2026-10-01T23:30:00',
      dados: { de: '', para: 'RESERVADA' },
    })
  })

  it('reserva sem agência vira agência vazia, e nunca undefined nem null', () => {
    const { agenciaId: _semAgencia, ...semAgencia } = RESERVA
    const evento = eventoDaReservaCriada(semAgencia, 'naveg-api')
    expect(evento.agenciaId).toBe('')
    expect(JSON.stringify(evento)).not.toContain('null')
  })

  it('não leva dado pessoal — nem nome, nem telefone', () => {
    const texto = JSON.stringify(eventoDaReservaCriada(RESERVA, 'naveg-api'))
    expect(texto).not.toContain('Maria')
    expect(texto).not.toContain('5591988887777')
  })

  it('as chaves são exatamente as de CAMPOS_DO_EVENTO', () => {
    expect(Object.keys(eventoDaReservaCriada(RESERVA, 'naveg-api'))).toEqual([...CAMPOS_DO_EVENTO])
  })

  it('o id é tipo e entidade', () => {
    expect(idDoEvento('reserva.criada', 'NVG-7K3QP2')).toBe('reserva.criada:NVG-7K3QP2')
  })

  it('cada tipo leva a reserva ao estado que a Rule confere', () => {
    expect(TIPOS_DE_EVENTO.map(paraDoTipo)).toEqual(['RESERVADA', 'CANCELADA', 'CONVERTIDA'])
  })
})
