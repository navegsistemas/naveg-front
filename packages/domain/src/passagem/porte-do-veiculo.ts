/**
 * **Leve ou pesado** — o agrupamento das classes de veículo que o site pergunta antes de "Qual?" (UI 2.2, decisão H;
 * naveg-front#66).
 *
 * Existe **só no site**, para a pergunta ficar curta: com ele, cada lista tem 7 a 10 classes, e não 17. O que vai na
 * reserva continua sendo a `classe`, que é o que a tarifa usa; o KMP não conhece o porte, e não precisa.
 *
 * A divisão é a da ficha 2.2, confirmada pelo PO em 2026-10-14. Toda classe está em um porte, e só em um: o
 * `satisfies` e o cenário garantem as duas coisas.
 */
import { deValor } from '../primitivos/fronteira.js'
import type { ClasseVeiculo } from './classe-veiculo.js'

export const PORTES_DE_VEICULO = ['LEVE', 'PESADO'] as const

export type PorteDoVeiculo = (typeof PORTES_DE_VEICULO)[number]

interface PropriedadesDoPorte {
  readonly rotulo: string
  /** Exemplos para a opção, na língua de quem embarca. */
  readonly exemplos: string
  readonly classes: readonly ClasseVeiculo[]
}

const PROPRIEDADES = {
  LEVE: {
    rotulo: 'Leve',
    exemplos: 'Carro, SUV, van, moto, quadriciclo, carretilha, jet ski',
    classes: ['CARRO', 'SUV', 'VAN', 'MOTO', 'QUADRICICLO', 'CARRETILHA', 'JET_SKI'],
  },
  PESADO: {
    rotulo: 'Pesado',
    exemplos: 'Caminhão, ônibus, carreta, trailer, motorhome, lancha, máquinas',
    classes: [
      'CAMINHAO',
      'ONIBUS',
      'MOTORHOME',
      'CARRETA_CAVALINHO',
      'CARRETA',
      'TRAILER',
      'LANCHA',
      'TRATOR',
      'EMPILHADEIRA',
      'RETROESCAVADEIRA',
    ],
  },
} as const satisfies Readonly<Record<PorteDoVeiculo, PropriedadesDoPorte>>

export const PorteDoVeiculo = {
  valores: PORTES_DE_VEICULO,

  rotulo(porte: PorteDoVeiculo): string {
    return PROPRIEDADES[porte].rotulo
  },

  exemplos(porte: PorteDoVeiculo): string {
    return PROPRIEDADES[porte].exemplos
  },

  /** As classes deste porte, na ordem da pergunta. */
  classes(porte: PorteDoVeiculo): readonly ClasseVeiculo[] {
    return PROPRIEDADES[porte].classes
  },

  /** O porte de uma classe. Toda classe tem um — o cenário confere contra `CLASSES_DE_VEICULO`. */
  daClasse(classe: ClasseVeiculo): PorteDoVeiculo {
    return (PROPRIEDADES.LEVE.classes as readonly ClasseVeiculo[]).includes(classe) ? 'LEVE' : 'PESADO'
  },

  de(valor: string | null | undefined): PorteDoVeiculo | null {
    return deValor(PORTES_DE_VEICULO, valor)
  },
} as const

/** As classes dos dois portes, juntas. O cenário confere que são exatamente as `CLASSES_DE_VEICULO`, sem repetir. */
export const CLASSES_DOS_PORTES: readonly ClasseVeiculo[] = [...PROPRIEDADES.LEVE.classes, ...PROPRIEDADES.PESADO.classes]
