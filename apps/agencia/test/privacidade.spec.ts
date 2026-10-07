/**
 * **A política de privacidade** (passo 13.4) — a versão, o prazo, e os links que levam a ela e saem dela.
 */
import { describe, expect, it } from 'vitest'

import { PAGINAS_DO_MAPA } from '../src/conteudo/meta'
import { DATA_DA_POLITICA, DIAS_DE_GUARDA_DA_RESERVA, dataPorExtenso } from '../src/conteudo/privacidade'
import { LINKS_LEGAIS } from '../src/conteudo/rodape'
import { ID_DO_RODAPE, ancoraVistaDe } from '../src/conteudo/secoes'

describe('a política de privacidade', () => {
  it('escreve a data por extenso, como se lê no topo', () => {
    expect(dataPorExtenso('2026-10-07')).toBe('7 de outubro de 2026')
    expect(dataPorExtenso('2027-01-31')).toBe('31 de janeiro de 2027')
    expect(() => dataPorExtenso('2026-13-01')).toThrow()
  })

  it('tem uma data válida, e o prazo de guarda em semanas inteiras (PO: duas)', () => {
    expect(DATA_DA_POLITICA).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(DIAS_DE_GUARDA_DA_RESERVA).toBe(14)
  })

  it('o rodapé leva a ela, e ela está no mapa do site', () => {
    expect(LINKS_LEGAIS.find((link) => link.id === 'privacidade')?.href).toBe('/privacidade/')
    expect(PAGINAS_DO_MAPA).toContain('/privacidade/')
  })
})

describe('as âncoras vistas de outra página', () => {
  it('na página inicial, ficam como estão', () => {
    expect(ancoraVistaDe('/', '#totem')).toBe('#totem')
  })

  it('em outra página, voltam para a inicial', () => {
    expect(ancoraVistaDe('/privacidade/', '#totem')).toBe('/#totem')
  })

  it('o rodapé existe em toda página, e o "Contato" aponta para o dela', () => {
    expect(ancoraVistaDe('/privacidade/', `#${ID_DO_RODAPE}`)).toBe(`#${ID_DO_RODAPE}`)
  })
})
