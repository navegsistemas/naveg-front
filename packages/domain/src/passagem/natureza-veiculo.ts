/**
 * **A natureza do veículo** — porte de `domain/passagem/NaturezaVeiculo.kt` do fluviapp (ADR-0031 D2/D8).
 *
 * Quatro valores, e cada classe declara **uma**. Ela existe pela análise — *"quantos rebocados atravessaram
 * em agosto"* — e, no roteiro, por ergonomia: dezessete classes num seletor só não são escolha, são catálogo
 * impresso, e três delas compartilham o radical *carret-*. Por isso o totem, como o balcão, pergunta primeiro
 * a natureza e só depois a classe.
 *
 * A natureza descreve **como o veículo embarca**, não o que ele é: o jet-ski é moto aquática no nome e
 * **rebocado** na doca, porque chega sobre a carretilha (emenda da operação, 2026-09-05).
 */
import { deValor } from '../primitivos/fronteira.js'

export const NATUREZAS_DE_VEICULO = ['AUTOMOTOR', 'MOTOCICLO', 'MAQUINA', 'REBOCADO'] as const

export type NaturezaVeiculo = (typeof NATUREZAS_DE_VEICULO)[number]

const ROTULOS: Readonly<Record<NaturezaVeiculo, string>> = {
  AUTOMOTOR: 'Automotor',
  MOTOCICLO: 'Moto e similares',
  MAQUINA: 'Máquina',
  REBOCADO: 'Rebocado',
}

export const NaturezaVeiculo = {
  valores: NATUREZAS_DE_VEICULO,

  rotulo(natureza: NaturezaVeiculo): string {
    return ROTULOS[natureza]
  },

  de(valor: string | null | undefined): NaturezaVeiculo | null {
    return deValor(NATUREZAS_DE_VEICULO, valor)
  },
} as const
