/**
 * O alcance da reserva e a saída suspensa (fluviapp-kmp#44; PO, 2026-10-09) — os cenários do
 * `AlcanceDaReservaTest.kt`, com as mesmas datas. **23/09/2026 é uma quarta-feira**; a viagem é de terça, e as
 * terças dentro de 90 dias vão de 29/09 a 15/12 — a de 22/12 é o 90º dia depois de hoje, e já fica de fora.
 */
import { describe, expect, it } from 'vitest'

import { DataCalendario } from '../src/primitivos/calendario.js'
import {
  ALCANCE_DA_RESERVA_DIAS,
  alcanceEmDias,
  idDaSuspensao,
  reservaveisAPartirDe,
  saidaReservavel,
} from '../src/viagem/alcance-da-reserva.js'
import type { OcorrenciaViagem } from '../src/viagem/ocorrencia-viagem.js'
import { DIAS_DA_JANELA, type Viagem } from '../src/viagem/viagem.js'
import { instante } from './exemplos.js'

const meioDia = instante('2026-09-23T12:00:00')
const hoje = '2026-09-23' as DataCalendario
const terca: Viagem = { id: 'v1', rotaId: 'r1', embarcacaoId: 'b1', diaSemana: 'TUESDAY', horaMin: 18 * 60, ativo: true }

const data = (iso: string) => iso as DataCalendario
const suspensa = (iso: string, viagemId = 'v1'): OcorrenciaViagem => ({ viagemId, data: data(iso) })

describe('o alcance', () => {
  it('passageiro e veículo vão a 90 dias — encomenda fica na semana', () => {
    expect(ALCANCE_DA_RESERVA_DIAS).toBe(90)
    expect(alcanceEmDias('PASSAGEIRO')).toBe(90)
    expect(alcanceEmDias('VEICULO')).toBe(90)
    expect(alcanceEmDias('ENCOMENDA')).toBe(DIAS_DA_JANELA)
  })

  it('o site oferece as doze terças dos 90 dias ao passageiro e só a da semana à encomenda', () => {
    const passageiro = reservaveisAPartirDe([terca], meioDia, 'PASSAGEIRO', [])
    const encomenda = reservaveisAPartirDe([terca], meioDia, 'ENCOMENDA', [])

    expect(passageiro).toHaveLength(12)
    expect(passageiro[0]?.data).toBe('2026-09-29')
    expect(passageiro.at(-1)?.data).toBe('2026-12-15')
    expect(encomenda.map((o) => o.data)).toEqual(['2026-09-29'])
  })

  it('a data suspensa sai da oferta — e só ela', () => {
    const oferta = reservaveisAPartirDe([terca], meioDia, 'PASSAGEIRO', [
      suspensa('2026-10-13'),
      suspensa('2026-10-20', 'outra'),
    ])

    expect(oferta).toHaveLength(11)
    expect(oferta.some((o) => o.data === '2026-10-13')).toBe(false)
    expect(oferta.some((o) => o.data === '2026-10-20')).toBe(true)
  })

  it('o id da suspensão é o da ocorrência: viagemId@data', () => {
    expect(idDaSuspensao(suspensa('2026-10-13'))).toBe('v1@2026-10-13')
  })
})

describe('a pergunta da regra', () => {
  it('aceita a terça dentro do alcance', () => {
    expect(saidaReservavel(terca, data('2026-12-15'), 'PASSAGEIRO', hoje, [])).toBe(true)
  })

  it('recusa o último dia do alcance — o passado e o dia da semana errado também', () => {
    expect(saidaReservavel(terca, data('2026-12-22'), 'PASSAGEIRO', hoje, [])).toBe(false)
    expect(saidaReservavel(terca, data('2026-09-22'), 'PASSAGEIRO', hoje, [])).toBe(false)
    expect(saidaReservavel(terca, data('2026-09-30'), 'PASSAGEIRO', hoje, [])).toBe(false)
  })

  it('recusa a encomenda depois da semana', () => {
    expect(saidaReservavel(terca, data('2026-09-29'), 'ENCOMENDA', hoje, [])).toBe(true)
    expect(saidaReservavel(terca, data('2026-10-06'), 'ENCOMENDA', hoje, [])).toBe(false)
  })

  it('recusa viagem desativada — ausente — e data suspensa', () => {
    const d = data('2026-10-13')
    expect(saidaReservavel({ ...terca, ativo: false }, d, 'PASSAGEIRO', hoje, [])).toBe(false)
    expect(saidaReservavel(null, d, 'PASSAGEIRO', hoje, [])).toBe(false)
    expect(saidaReservavel(undefined, d, 'PASSAGEIRO', hoje, [])).toBe(false)
    expect(saidaReservavel(terca, d, 'PASSAGEIRO', hoje, [suspensa('2026-10-13')])).toBe(false)
  })

  it('a regra e a oferta concordam em cada dia dos 90', () => {
    const suspensas = [suspensa('2026-10-13')]
    const ofertadas = new Set(reservaveisAPartirDe([terca], meioDia, 'PASSAGEIRO', suspensas).map((o) => o.data))
    for (let i = -1; i <= ALCANCE_DA_RESERVA_DIAS; i++) {
      const dia = DataCalendario.maisDias(hoje, i)
      expect(saidaReservavel(terca, dia, 'PASSAGEIRO', hoje, suspensas), dia).toBe(ofertadas.has(dia))
    }
  })
})
