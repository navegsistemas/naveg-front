/**
 * **Subtipo de gratuidade** — porte de `passagem/tipo-gratuidade.ts` do `@fluviapp/domain`, que porta
 * `domain/passagem/TipoGratuidade.kt`.
 *
 * São as quatro gratuidades **legais**: idoso, PcD, criança até 5 anos (faixa 0–5, inclui o 5) e passe
 * federal. `CORTESIA` foi aposentada lá — era redução comercial, não gratuidade.
 *
 * É este valor que a **cota** conta no aplicativo (máximo 2 por categoria por ocorrência) e que a
 * fiscalização confere. Gravar "gratuidade" sem dizer qual é um rótulo que não serve a nenhum dos dois —
 * e é por isso que o roteiro da reserva tem um passo inteiro para ele.
 *
 * ### A cota não é conferida aqui
 *
 * Contar quantas gratuidades já saíram naquela travessia exige **ler** a coleção de passagens, e ler é
 * exatamente o que as Rules negam ao público (passo 9). A reserva, então, **pede** a gratuidade; quem
 * confere a cota é o aplicativo, na emissão, onde ela já é conferida hoje. É o mesmo motivo pelo qual a
 * reserva não reserva assento.
 */
import { deValor } from '../primitivos/fronteira.js'

export const TIPOS_DE_GRATUIDADE = ['IDOSO', 'PCD', 'CRIANCA_ATE_5', 'PASSE_FEDERAL'] as const

export type TipoGratuidade = (typeof TIPOS_DE_GRATUIDADE)[number]

const ROTULOS: Readonly<Record<TipoGratuidade, string>> = {
  IDOSO: 'Idoso',
  PCD: 'PcD',
  CRIANCA_ATE_5: 'Criança até 5 anos',
  PASSE_FEDERAL: 'Passe Federal',
}

export const TipoGratuidade = {
  valores: TIPOS_DE_GRATUIDADE,

  rotulo(tipo: TipoGratuidade): string {
    return ROTULOS[tipo]
  },

  de(valor: string | null | undefined): TipoGratuidade | null {
    return deValor(TIPOS_DE_GRATUIDADE, valor)
  },
} as const
