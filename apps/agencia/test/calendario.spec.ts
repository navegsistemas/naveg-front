/**
 * **O calendário das saídas, a conta** (UI 1.3) — com o catálogo de demonstração e o relógio de terça-feira,
 * 13/10/2026, 08:00 em Belém, o mesmo dos cenários do totem. A tela está em `totem.spec.tsx`.
 */
import { describe, expect, it } from 'vitest'

import { DataCalendario, InstanteLocal, travessiasOfertadas, type TravessiaOfertada } from '@navegsistemas/domain'
import { mesesDoCalendario, origensDaOferta, primeiroDiaReservavel, rotuloDoDia, saidasDoDia } from '@navegsistemas/ui'

import { CATALOGO_DE_DEMONSTRACAO } from '../src/conteudo/catalogo-de-demonstracao'

const AGORA = InstanteLocal.de('2026-10-13T08:00') as InstanteLocal
const HOJE = InstanteLocal.data(AGORA)
const data = (texto: string) => DataCalendario.de(texto) as DataCalendario

const reservaveis = travessiasOfertadas(CATALOGO_DE_DEMONSTRACAO, AGORA)
const previstas = travessiasOfertadas(CATALOGO_DE_DEMONSTRACAO, AGORA, 90)
const origens = origensDaOferta(previstas, CATALOGO_DE_DEMONSTRACAO.localidades)

function meses(origemEscolhida: string | null = null) {
  return mesesDoCalendario({ hoje: HOJE, alcanceDias: 90, reservaveis, previstas, origens, origemEscolhida })
}

function diaDe(texto: string, origemEscolhida: string | null = null) {
  for (const mes of meses(origemEscolhida)) for (const dia of mes.dias) if (dia.data === texto) return dia
  throw new Error(`o dia ${texto} não está no calendário`)
}

/** O mínimo de uma travessia que `origensDaOferta` lê: o porto de origem. */
function saindoDe(localidadeId: string, porto: string): TravessiaOfertada {
  return { origem: { id: porto, nome: porto, localidadeId, ativo: true } } as unknown as TravessiaOfertada
}

describe('as cidades de origem', () => {
  it('três letras, sem acento, em ordem alfabética', () => {
    const lidas = origensDaOferta(
      [saindoDe('santana', 'Porto do Grego'), saindoDe('belem', 'Porto Brilhante'), saindoDe('belem', 'Porto Brilhante')],
      [
        { id: 'belem', municipio: 'Belém', uf: 'PA', codigoIbge: '1501402', ativo: true },
        { id: 'santana', municipio: 'Santana', uf: 'AP', codigoIbge: '1600600', ativo: true },
      ],
    )
    expect(lidas).toEqual([
      { id: 'belem', cidade: 'Belém', sigla: 'BEL' },
      { id: 'santana', cidade: 'Santana', sigla: 'SAN' },
    ])
  })

  it('quando as três letras empatam, as iniciais', () => {
    expect(origens.map((origem) => origem.sigla)).toEqual(['CEA', 'CEB'])
  })

  it('sem a localidade, o nome do porto', () => {
    expect(origensDaOferta([saindoDe('sumiu', 'Porto Velho do Rio')], [])).toEqual([
      { id: 'sumiu', cidade: 'Porto Velho do Rio', sigla: 'POR' },
    ])
  })
})

describe('os meses', () => {
  it('de outubro de 2026 a janeiro de 2027, com a semana começando no domingo', () => {
    const lidos = meses()
    expect(lidos.map((mes) => `${mes.mes}/${mes.ano}`)).toEqual(['10/2026', '11/2026', '12/2026', '1/2027'])
    /* 1º de outubro de 2026 é quinta-feira: quatro casas vazias antes. */
    expect(lidos[0]?.deslocamento).toBe(4)
    expect(lidos[0]?.dias).toHaveLength(31)
  })

  it('cada dia na sua situação', () => {
    expect(diaDe('2026-10-12').situacao).toBe('PASSADO')
    expect(diaDe('2026-10-13').situacao).toBe('RESERVAVEL')
    expect(diaDe('2026-10-19').situacao).toBe('RESERVAVEL')
    expect(diaDe('2026-10-20').situacao).toBe('ALEM_DO_ALCANCE')
    expect(diaDe('2027-01-10').situacao).toBe('ALEM_DO_ALCANCE')
    expect(diaDe('2027-01-11').situacao).toBe('FORA_DO_CALENDARIO')
  })

  it('o filtro tira do dia a cidade que não foi escolhida', () => {
    expect(diaDe('2026-10-14').origens.map((origem) => origem.sigla)).toEqual(['CEA', 'CEB'])
    expect(diaDe('2026-10-14', 'demo-cidade-b').origens.map((origem) => origem.sigla)).toEqual(['CEB'])
  })

  it('o dia sem saída da cidade escolhida fica sem saída', () => {
    const soDeA = mesesDoCalendario({
      hoje: HOJE,
      alcanceDias: 90,
      reservaveis: reservaveis.filter((t) => t.origem.localidadeId === 'demo-cidade-a'),
      previstas: previstas.filter((t) => t.origem.localidadeId === 'demo-cidade-a'),
      origens,
      origemEscolhida: 'demo-cidade-b',
    })
    expect(soDeA[0]?.dias.find((dia) => dia.data === '2026-10-14')?.situacao).toBe('SEM_SAIDA')
    expect(primeiroDiaReservavel(soDeA)).toBeNull()
  })

  it('sem alcance, não há mês', () => {
    expect(mesesDoCalendario({ hoje: HOJE, alcanceDias: 0, reservaveis, previstas, origens, origemEscolhida: null })).toEqual([])
  })
})

describe('o dia escolhido', () => {
  it('o primeiro que se reserva é hoje, quando ainda há saída hoje', () => {
    expect(primeiroDiaReservavel(meses())).toBe(HOJE)
  })

  it('as saídas do dia vêm na ordem da partida, e o filtro vale para elas', () => {
    const doDia = saidasDoDia(reservaveis, data('2026-10-14'), null)
    expect(doDia.length).toBeGreaterThan(0)
    expect(doDia.every((t) => t.ocorrencia.data === '2026-10-14')).toBe(true)
    const partidas = doDia.map((t) => t.partida)
    expect([...partidas].sort()).toEqual(partidas)
    expect(saidasDoDia(reservaveis, data('2026-10-14'), 'demo-cidade-a').every((t) => t.origem.localidadeId === 'demo-cidade-a')).toBe(true)
  })

  it('o rótulo é o que o leitor de tela e o título da lista dizem', () => {
    expect(rotuloDoDia(data('2026-10-13'))).toBe('terça-feira, 13 de outubro')
    expect(rotuloDoDia(data('2027-01-01'))).toBe('sexta-feira, 1 de janeiro')
  })
})
