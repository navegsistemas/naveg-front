/**
 * **Os primitivos portados** — a fronteira, o calendário, a hora e o WhatsApp.
 *
 * São poucos cenários por peça, e de propósito: o porte veio de um código já coberto no fluviapp. O que se
 * confere aqui é o que o porte poderia ter quebrado — e o que é **novo** (`emFuso`, a regra do WhatsApp
 * pelo comprimento).
 */
import { describe, expect, it } from 'vitest'

import { DataCalendario, InstanteLocal } from '../src/primitivos/calendario.js'
import { DiaSemana } from '../src/primitivos/dia-semana.js'
import { casoImpossivel, deValor, normalizarChave, rotuloDoNome } from '../src/primitivos/fronteira.js'
import { formatarWhatsapp, normalizarWhatsapp, whatsappValido } from '../src/reserva/contato.js'
import { formatarHora, horaValida, minutosDaHora } from '../src/viagem/hora-do-dia.js'
import { OcorrenciaViagem } from '../src/viagem/ocorrencia-viagem.js'
import { data, instante } from './exemplos.js'

describe('a fronteira', () => {
  const VALORES = ['A_EMITIR', 'EMITIDA'] as const

  it('tolera a grafia legada: espaço, caixa e margem', () => {
    expect(deValor(VALORES, ' a emitir ')).toBe('A_EMITIR')
    expect(deValor(VALORES, 'emitida')).toBe('EMITIDA')
  })

  it('é fail-closed: desconhecido, vazio e ausente viram null — nunca um padrão', () => {
    for (const valor of ['CANCELADA', '', '   ', null, undefined]) {
      expect(deValor(VALORES, valor), String(valor)).toBeNull()
    }
    expect(normalizarChave('   ')).toBeNull()
  })

  it('casoImpossivel lança quando o dado viola o tipo', () => {
    expect(() => casoImpossivel('X' as never, 'teste')).toThrow(/teste: caso não previsto — "X"/)
  })

  it('rotuloDoNome troca underscore por espaço', () => {
    expect(rotuloDoNome('CRIANCA_ATE_5')).toBe('CRIANCA ATE 5')
  })
})

describe('a data de calendário', () => {
  it('recusa o que casa com o formato mas não existe', () => {
    for (const texto of ['2026-02-30', '2026-13-01', '2026-00-10', '2025-02-29', '2026-1-5', '14/10/2026']) {
      expect(DataCalendario.de(texto), texto).toBeNull()
    }
    expect(DataCalendario.de('2028-02-29')).toBe('2028-02-29')
  })

  it('ordena lexicograficamente na ordem cronológica', () => {
    const datas = ['2026-12-01', '2026-02-10', '2025-12-31'].map(data)
    expect([...datas].sort(DataCalendario.comparar)).toEqual(['2025-12-31', '2026-02-10', '2026-12-01'])
  })

  it('sabe o dia da semana sem ler o fuso — 14/10/2026 é quarta', () => {
    expect(DataCalendario.diaDaSemana(data('2026-10-14'))).toBe('WEDNESDAY')
    expect(DiaSemana.rotuloCurto(DataCalendario.diaDaSemana(data('2026-10-13')))).toBe('Ter')
    expect(DataCalendario.diaDaSemana(data('2026-10-18'))).toBe('SUNDAY')
  })

  it('formata para exibição e soma dias atravessando o ano', () => {
    expect(DataCalendario.formatarBr(data('2026-10-04'))).toBe('04/10/2026')
    expect(DataCalendario.maisDias(data('2026-12-31'), 1)).toBe('2027-01-01')
  })
})

describe('o instante local', () => {
  it('normaliza com e sem segundos, e recusa hora fora do relógio', () => {
    expect(InstanteLocal.de('2026-10-01T09:05')).toBe('2026-10-01T09:05:00')
    expect(InstanteLocal.de('2026-10-01 09:05:07')).toBe('2026-10-01T09:05:07')
    expect(InstanteLocal.de('2026-10-01T24:00')).toBeNull()
    expect(InstanteLocal.de('2026-02-30T10:00')).toBeNull()
  })

  it('emFuso lê o mesmo momento no relógio do rio, não no do navegador', () => {
    /* 21:30 UTC é 18:30 em Belém (UTC−3) e 17:30 em Manaus (UTC−4) — e 22:30 em Lisboa no verão. Um
       visitante em Lisboa que usasse o próprio relógio acharia que o barco das 18:00 partiu há horas. */
    const momento = new Date('2026-10-14T21:30:00Z')
    expect(InstanteLocal.emFuso(momento, 'America/Belem')).toBe('2026-10-14T18:30:00')
    expect(InstanteLocal.emFuso(momento, 'America/Manaus')).toBe('2026-10-14T17:30:00')
    expect(InstanteLocal.emFuso(momento, 'Europe/Lisbon')).toBe('2026-10-14T22:30:00')
  })

  it('emFuso vira o dia quando o fuso atravessa a meia-noite', () => {
    expect(InstanteLocal.emFuso(new Date('2026-10-15T02:00:00Z'), 'America/Belem')).toBe('2026-10-14T23:00:00')
  })

  it('compara por texto na ordem cronológica', () => {
    expect(InstanteLocal.antesDe(instante('2026-10-01T09:00'), instante('2026-10-01T10:00'))).toBe(true)
    expect(InstanteLocal.comparar(instante('2026-10-02T00:00'), instante('2026-10-01T23:59'))).toBe(1)
  })
})

describe('a ocorrência', () => {
  it('exige viagem e data real, e vai e volta pela chave', () => {
    expect(OcorrenciaViagem.de('', '2026-10-14')).toBeNull()
    expect(OcorrenciaViagem.de('v1', '2026-02-30')).toBeNull()
    const ocorrencia = OcorrenciaViagem.de(' v1 ', '2026-10-14')
    expect(ocorrencia).toEqual({ viagemId: 'v1', data: '2026-10-14' })
    expect(OcorrenciaViagem.deChave(OcorrenciaViagem.chave(ocorrencia as OcorrenciaViagem))).toEqual(
      ocorrencia,
    )
    expect(OcorrenciaViagem.deChave('sem-arroba')).toBeNull()
  })
})

describe('a hora', () => {
  it('formata minutos como HH:mm, dando a volta no dia', () => {
    expect(formatarHora(0)).toBe('00:00')
    expect(formatarHora(18 * 60 + 5)).toBe('18:05')
    expect(formatarHora(26 * 60)).toBe('02:00')
  })

  it('lê HH:mm e recusa hora pela metade — "18:3" não é 18:03', () => {
    expect(minutosDaHora('00:00')).toBe(0)
    expect(minutosDaHora('18:30')).toBe(1110)
    for (const texto of ['18:3', '8:05', '24:00', '12:60', '1830', '']) {
      expect(minutosDaHora(texto), texto).toBeNull()
    }
  })

  it('valida minutos dentro do relógio', () => {
    expect(horaValida(0)).toBe(true)
    expect(horaValida(1439)).toBe(true)
    expect(horaValida(1440)).toBe(false)
    expect(horaValida(10.5)).toBe(false)
  })
})

describe('o WhatsApp de quem reserva', () => {
  it('todas as grafias de um mesmo celular dão o mesmo número', () => {
    for (const grafia of ['(91) 98888-7777', '91988887777', '+55 91 98888-7777', '5591988887777', '55 (91) 9 8888 7777']) {
      expect(normalizarWhatsapp(grafia), grafia).toBe('5591988887777')
    }
  })

  it('DDD 55 sem código do país é lido como nacional — decide o comprimento, não o prefixo', () => {
    /* `telefone.ts` do app decide pelo prefixo, e recusaria este número. Aqui o número é do cliente. */
    expect(normalizarWhatsapp('(55) 99999-8888')).toBe('5555999998888')
    expect(normalizarWhatsapp('+55 55 99999-8888')).toBe('5555999998888')
  })

  it('recusa fixo, número sem DDD, DDD com zero e número de outro país', () => {
    for (const grafia of ['(91) 3222-1111', '98888-7777', '(01) 98888-7777', '+1 415 555 0100', '', null]) {
      expect(normalizarWhatsapp(grafia), String(grafia)).toBeNull()
    }
  })

  it('valida estrito e formata para conferência', () => {
    expect(whatsappValido('5591988887777')).toBe(true)
    expect(whatsappValido('91988887777')).toBe(false)
    expect(formatarWhatsapp('5591988887777')).toBe('(91) 98888-7777')
    expect(formatarWhatsapp('lixo')).toBe('lixo')
  })
})
