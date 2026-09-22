/**
 * **Os quadros da vitrine.**
 *
 * O carrossel é CSS puro, e é por isso que estes cenários existem: não há script para depurar no navegador, e
 * um percentual errado não quebra nada — ele faz um slide **nunca aparecer**, numa página que continua bonita.
 *
 * O cenário que mais importa é o do quarto barco: hoje a NAVEG tem três, e o dia em que tiver quatro é o dia em
 * que uma animação escrita à mão passaria a mentir.
 */
import { describe, expect, it } from 'vitest'

import {
  EMBARCACOES,
  FRACAO_PARADA,
  SEGUNDOS_POR_EMBARCACAO,
  duracaoDaVitrine,
  quadrosDaVitrine,
} from '../src/conteudo/embarcacoes.js'

/** Os pares `percentual → deslocamento` de uma folha de quadros, na ordem em que aparecem. */
function lerQuadros(folha: string): ReadonlyArray<{ paradas: number[]; deslocamento: number }> {
  return folha
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha !== '')
    .map((linha) => {
      const percentuais = [...linha.matchAll(/(-?[\d.]+)%(?=[,\s])/g)].map((achado) =>
        Number(achado[1]),
      )
      const deslocamento = /translateX\((-?[\d.]+)%\)/.exec(linha)
      return {
        paradas: percentuais,
        deslocamento: deslocamento === null ? Number.NaN : Number(deslocamento[1]),
      }
    })
}

describe('a flotilha', () => {
  it('tem embarcações, com id único e nome não vazio', () => {
    expect(EMBARCACOES.length).toBeGreaterThan(0)

    const ids = EMBARCACOES.map((embarcacao) => embarcacao.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const embarcacao of EMBARCACOES) {
      expect(embarcacao.nome.trim(), `${embarcacao.id} sem nome`).not.toBe('')
      expect(embarcacao.descricao.trim(), `${embarcacao.id} sem descrição`).not.toBe('')
    }
  })

  it('toda embarcação com foto tem texto alternativo', () => {
    /* O contrário — `alt` sem foto — é inofensivo; é o rascunho de quem preencheu antes da imagem chegar. */
    for (const embarcacao of EMBARCACOES) {
      if (embarcacao.imagem !== null) {
        expect(embarcacao.alt?.trim(), `${embarcacao.id}: foto sem alt`).toBeTruthy()
      }
    }
  })
})

describe('os quadros da vitrine', () => {
  it('há um quadro por embarcação, mais o que fecha o laço', () => {
    const quadros = lerQuadros(quadrosDaVitrine(EMBARCACOES.length))
    expect(quadros).toHaveLength(EMBARCACOES.length + 1)
  })

  it('cada item entra no seu terço e sai deslocado de uma janela', () => {
    const quadros = lerQuadros(quadrosDaVitrine(3))

    expect(quadros.map((quadro) => quadro.deslocamento)).toEqual([0, -100, -200, -300])
    expect(quadros[0]?.paradas).toEqual([0, 26.667])
    expect(quadros[1]?.paradas).toEqual([33.333, 60])
    expect(quadros[2]?.paradas).toEqual([66.667, 93.333])
    expect(quadros[3]?.paradas).toEqual([100])
  })

  it('o último quadro aponta para a cópia do primeiro — é o que faz o laço não ter emenda', () => {
    for (const quantidade of [1, 2, 3, 4, 7]) {
      const quadros = lerQuadros(quadrosDaVitrine(quantidade))
      expect(quadros.at(-1)?.deslocamento, `com ${quantidade} itens`).toBe(-quantidade * 100)
    }
  })

  it('os percentuais só crescem, e o ciclo fecha em 100%', () => {
    /* Um percentual fora de ordem não é erro de sintaxe: o navegador reordena e o desfile anda para trás
       num dos trechos. É o tipo de defeito que só se vê olhando, e por isso está aqui. */
    for (const quantidade of [1, 3, 4, 12]) {
      const marcos = lerQuadros(quadrosDaVitrine(quantidade)).flatMap((quadro) => quadro.paradas)

      for (let i = 1; i < marcos.length; i += 1) {
        expect(marcos[i], `com ${quantidade} itens, marco ${i}`).toBeGreaterThan(marcos[i - 1] ?? 0)
      }

      expect(marcos.at(-1)).toBe(100)
      expect(marcos[0]).toBe(0)
    }
  })

  it('a fração parada é respeitada: o movimento ocupa o resto do passo', () => {
    const quadros = lerQuadros(quadrosDaVitrine(4, 0.5))
    const passo = 100 / 4

    const primeiro = quadros[0]?.paradas ?? []
    expect(primeiro[0]).toBe(0)
    expect(primeiro[1]).toBe(passo * 0.5)
  })

  it('vitrine sem embarcação é erro, não animação vazia', () => {
    expect(() => quadrosDaVitrine(0)).toThrow()
  })

  it('a duração acompanha a quantidade', () => {
    expect(duracaoDaVitrine(EMBARCACOES.length)).toBe(
      EMBARCACOES.length * SEGUNDOS_POR_EMBARCACAO,
    )
  })

  it('a fração parada deixa tempo para a transição', () => {
    /* Parada em 100% do passo não sobraria nada para o movimento, e o carrossel saltaria entre slides. */
    expect(FRACAO_PARADA).toBeGreaterThan(0)
    expect(FRACAO_PARADA).toBeLessThan(1)
  })
})
