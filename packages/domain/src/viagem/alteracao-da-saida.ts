/**
 * **Uma data em que a viagem sai de outro jeito** — outro cais, outra hora. Porte de `domain/viagem/AlteracaoDaSaida.kt`
 * do fluviapp-kmp (fluviapp-kmp#52, ADR-0021 de lá; PO, 2026-10-12).
 *
 * O cais de embarque e o de desembarque mudam sem planejamento, e com frequência maior que rara. A viagem semanal diz
 * "toda terça, do cais X às 18h"; a alteração diz **"esta terça, do cais Y às 19h"**, e só ela. É o molde da saída
 * suspensa: um documento por `(viagemId, data)`, em `alteracoes/{viagemId}@{yyyy-MM-dd}`, com os **três valores
 * daquela data** — e não só o que mudou.
 *
 * O que vale para o site:
 *
 * - a saída daquela data mostra o cais e a hora dela, e um aviso com o motivo;
 * - **a data continua à venda**, mesmo que o cais novo não esteja na concessão da agência: a concessão vale para a
 *   saída planejada;
 * - **a suspensão vence**: a data suspensa não sai, de cais nenhum.
 *
 * ### Uma divergência deliberada
 *
 * No Kotlin a alteração leva também a empresa, o `uid` de quem alterou e quando. Aqui não: é o que deixa o servidor, e
 * quem alterou é da transportadora, não do público. O motivo fica — é a frase do aviso.
 */
import type { OcorrenciaViagem } from './ocorrencia-viagem.js'
import type { Viagem } from './viagem.js'

export interface AlteracaoDaSaida {
  readonly ocorrencia: OcorrenciaViagem
  readonly portoEmbarqueId: string
  readonly portoDesembarqueId: string
  /** Minutos desde a meia-noite, como a `Viagem.horaMin`. */
  readonly horaMin: number
  /** "Cais em obra" — cabe numa linha (80 caracteres no KMP). */
  readonly motivo: string
}

/** O que de fato mudou em relação à viagem. O `MudancaNaSaida` do Kotlin, na mesma ordem. */
export const MUDANCAS_NA_SAIDA = ['EMBARQUE', 'DESEMBARQUE', 'HORA'] as const
export type MudancaNaSaida = (typeof MUDANCAS_NA_SAIDA)[number]

/** `viagemId@yyyy-MM-dd` — o id do documento, a mesma chave da suspensão e da `ViagemSemana.id`. */
export function idDaAlteracao(ocorrencia: OcorrenciaViagem): string {
  return `${ocorrencia.viagemId}@${ocorrencia.data}`
}

/** O `AlteracaoDaSaida.mudancasSobre(viagem)` do Kotlin. */
export function mudancasSobre(alteracao: AlteracaoDaSaida, viagem: Viagem): readonly MudancaNaSaida[] {
  return MUDANCAS_NA_SAIDA.filter((mudanca) => {
    switch (mudanca) {
      case 'EMBARQUE':
        return alteracao.portoEmbarqueId !== viagem.portoEmbarqueId
      case 'DESEMBARQUE':
        return alteracao.portoDesembarqueId !== viagem.portoDesembarqueId
      case 'HORA':
        return alteracao.horaMin !== viagem.horaMin
    }
  })
}

/** **A saída daquela data, como ela sai.** O `SaidaDoDia` do Kotlin. */
export interface SaidaDoDia {
  readonly portoEmbarqueId: string
  readonly portoDesembarqueId: string
  readonly horaMin: number
  /** A alteração, quando há — para o aviso e o motivo. */
  readonly alteracao: AlteracaoDaSaida | null
}

/**
 * O cais e a hora da alteração, quando há; senão, os da viagem. O `Viagem.saidaEm(data, alteracoes)` do Kotlin, com
 * as alterações indexadas pelo [idDaAlteracao].
 */
export function saidaEm(
  viagem: Viagem,
  ocorrencia: OcorrenciaViagem,
  alteracoes: ReadonlyMap<string, AlteracaoDaSaida>,
): SaidaDoDia {
  const alteracao = alteracoes.get(idDaAlteracao(ocorrencia)) ?? null
  return {
    portoEmbarqueId: alteracao?.portoEmbarqueId ?? viagem.portoEmbarqueId,
    portoDesembarqueId: alteracao?.portoDesembarqueId ?? viagem.portoDesembarqueId,
    horaMin: alteracao?.horaMin ?? viagem.horaMin,
    alteracao,
  }
}

/** As alterações pela chave, como `saidaEm` e `disponiveisAPartirDe` as consultam. */
export function alteracoesPorId(alteracoes: readonly AlteracaoDaSaida[]): ReadonlyMap<string, AlteracaoDaSaida> {
  return new Map(alteracoes.map((alteracao) => [idDaAlteracao(alteracao.ocorrencia), alteracao]))
}
