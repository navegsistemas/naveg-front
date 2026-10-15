/**
 * **Leve ou pesado** — a divisão das 17 classes que o site pergunta (UI 2.2, decisão H; naveg-front#66).
 *
 * Se uma classe nova chegar do KMP e ninguém a puser num porte, ela some do site: é isto que o primeiro cenário segura.
 */
import { describe, expect, it } from 'vitest'

import { CLASSES_DE_VEICULO } from '../src/passagem/classe-veiculo.js'
import { CLASSES_DOS_PORTES, PorteDoVeiculo } from '../src/passagem/porte-do-veiculo.js'

describe('o porte do veículo', () => {
  it('toda classe do KMP está num porte, e só num', () => {
    expect([...CLASSES_DOS_PORTES].sort()).toEqual([...CLASSES_DE_VEICULO].sort())
    expect(new Set(CLASSES_DOS_PORTES).size).toBe(CLASSES_DOS_PORTES.length)
  })

  it('a divisão da ficha 2.2: sete leves, dez pesados', () => {
    expect(PorteDoVeiculo.classes('LEVE')).toEqual(['CARRO', 'SUV', 'VAN', 'MOTO', 'QUADRICICLO', 'CARRETILHA', 'JET_SKI'])
    expect(PorteDoVeiculo.classes('PESADO')).toHaveLength(10)
  })

  it('o porte de cada classe é o da lista em que ela está', () => {
    for (const porte of PorteDoVeiculo.valores) {
      for (const classe of PorteDoVeiculo.classes(porte)) expect(PorteDoVeiculo.daClasse(classe), classe).toBe(porte)
    }
  })
})
