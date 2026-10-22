/**
 * **O cartão da saída, em texto** (UI 2.1) — o dia curto, a duração, o nome da embarcação e a chave da foto.
 */
import { describe, expect, it } from 'vitest'

import { DataCalendario } from '@navegsistemas/domain'

import { chaveDaEmbarcacao, diaCurto, nomeDaEmbarcacao, rotuloDaDuracao } from '../src/cartao-da-saida.js'

const data = (texto: string) => DataCalendario.de(texto) as DataCalendario

describe('o cartão da saída', () => {
  it('o dia vem curto, sem o "-feira": "sexta, 23/10"', () => {
    expect(diaCurto(data('2026-10-23'))).toBe('sexta, 23/10')
    expect(diaCurto(data('2026-10-24'))).toBe('sábado, 24/10')
    expect(diaCurto(data('2026-11-01'))).toBe('domingo, 01/11')
  })

  it('a duração: as 30 horas da travessia, e a de demonstração com os minutos', () => {
    expect(rotuloDaDuracao(30 * 60)).toBe('30 h')
    expect(rotuloDaDuracao(3 * 60 + 30)).toBe('3 h 30')
    expect(rotuloDaDuracao(65)).toBe('1 h 05')
    expect(rotuloDaDuracao(45)).toBe('45 min')
  })

  it('o nome que vem do casco, em caixa alta, fica capitulado; a sigla do tipo fica como está', () => {
    expect(nomeDaEmbarcacao('F/B MARIA IVANIR')).toBe('F/B Maria Ivanir')
    expect(nomeDaEmbarcacao('F/B REGIONAL')).toBe('F/B Regional')
    expect(nomeDaEmbarcacao('N/M SÃO JOÃO DA BARRA II')).toBe('N/M São João da Barra II')
  })

  it('um nome já capitulado fica como veio', () => {
    expect(nomeDaEmbarcacao('Ferry de demonstração')).toBe('Ferry de demonstração')
  })

  it('a chave casa o nome do site com o do catálogo, sem caixa nem acento', () => {
    expect(chaveDaEmbarcacao('F/B Maria Ivanir')).toBe(chaveDaEmbarcacao('F/B MARIA IVANIR'))
    expect(chaveDaEmbarcacao('F/B  Conceição ')).toBe('f/b conceicao')
  })
})
