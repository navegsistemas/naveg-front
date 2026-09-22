/**
 * **Onde** — porte de `domain/localidade/Uf.kt` e `Localidade.kt` do fluviapp (ADR-0016 §5, ADR-0020 D6).
 *
 * A localidade é o par UF + município como uma coisa só, e é dela que o porto tira o nome da cidade. A
 * agência a lê para escrever "Porto X · Belém/PA" no cartão da travessia, do mesmo jeito que o aplicativo.
 *
 * A UF é tipo fechado — 27 valores por constituição. O `name` é a **sigla**, e é o valor persistido.
 */
import { deValor } from '../primitivos/fronteira.js'

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export type Uf = (typeof UFS)[number]

export const Uf = {
  valores: UFS,
  de(valor: string | null | undefined): Uf | null {
    return deValor(UFS, valor)
  },
} as const

export interface Localidade {
  readonly id: string
  readonly municipio: string
  readonly uf: Uf
  readonly codigoIbge: string
  readonly ativo: boolean
}

/** "Belém/PA" — o `Localidade.rotulo` do Kotlin. */
export function rotuloDaLocalidade(localidade: Localidade): string {
  return `${localidade.municipio}/${localidade.uf}`
}
