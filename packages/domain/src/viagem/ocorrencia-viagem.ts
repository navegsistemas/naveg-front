/**
 * **A travessia concreta** para onde a reserva aponta: `(viagemId, data)`. Porte de
 * `viagem/ocorrencia-viagem.ts` do `@fluviapp/domain`, que porta `domain/viagem/OcorrenciaViagem.kt`.
 *
 * A `Viagem` é uma saída **semanal** ("terça às 18h"); a ocorrência é uma dessas saídas **numa data**. É
 * sobre a ocorrência que se vende bilhete, se numera e se conta ocupação — e é por isso que a reserva
 * aponta para ela e não para a viagem: sem a data, dois pedidos de terças diferentes seriam
 * indistinguíveis, e o atendente não saberia qual travessia emitir.
 */
import { DataCalendario } from '../primitivos/calendario.js'
import type { DataCalendario as Data } from '../primitivos/calendario.js'

const SEPARADOR = '@'

export interface OcorrenciaViagem {
  readonly viagemId: string
  readonly data: Data
}

export const OcorrenciaViagem = {
  /**
   * Fronteira texto→tipo. `null` quando falta viagem ou a data é ilegível — fail-closed, como os codecs:
   * uma ocorrência sem data não é uma ocorrência "de hoje", não é nada.
   */
  de(
    viagemId: string | null | undefined,
    dataIso: string | null | undefined,
  ): OcorrenciaViagem | null {
    if (viagemId === null || viagemId === undefined || viagemId.trim().length === 0) return null
    const data = DataCalendario.de(dataIso)
    if (data === null) return null
    return { viagemId: viagemId.trim(), data }
  },

  /** A data como a fronteira a grava e a consulta a compara (ISO-8601). */
  dataIso(ocorrencia: OcorrenciaViagem): string {
    return ocorrencia.data
  },

  /** A chave legível da ocorrência — uma coordenada em vez de dois argumentos que podem desemparelhar. */
  chave(ocorrencia: OcorrenciaViagem): string {
    return `${ocorrencia.viagemId}${SEPARADOR}${ocorrencia.data}`
  },

  /**
   * O caminho de volta da chave. Fail-closed como o [de]: chave malformada não vira ocorrência de hoje,
   * não vira nada — e o totem que a recebesse não teria travessia para reservar.
   */
  deChave(chave: string | null | undefined): OcorrenciaViagem | null {
    const partes = chave?.split(SEPARADOR)
    if (partes === undefined || partes.length !== 2) return null
    return OcorrenciaViagem.de(partes[0], partes[1])
  },

  mesma(a: OcorrenciaViagem, b: OcorrenciaViagem): boolean {
    return a.viagemId === b.viagemId && a.data === b.data
  },
} as const
