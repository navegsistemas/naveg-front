/**
 * **O que a agência pode ofertar** — porte de `domain/viagem/AtuacaoDaEmpresa.kt` do fluviapp (ADR-0016 §4/§7).
 *
 * O pool de viagens é **compartilhado**: a saída de terça do navio X é uma só, para todas as agências. O que
 * cada empresa pode vender é recortado pela **concessão** da atuação dela — os portos onde opera e as
 * embarcações que lhe foram concedidas. No aplicativo isso é o `EscopoDoPool.Concedido`.
 *
 * A agência virtual é a NAVEG exercendo `AGENCIAMENTO`, e o documento é
 * `empresas/{empresaId}/atuacoes/AGENCIAMENTO`. **Sem este recorte, o site ofereceria o pool inteiro** —
 * inclusive viagens de embarcações que a NAVEG não tem concessão para vender, e que o atendente não
 * conseguiria emitir.
 */
import type { Viagem } from './viagem.js'

export interface AtuacaoDaEmpresa {
  readonly embarcacaoIds: ReadonlySet<string>
  readonly portoIds: ReadonlySet<string>
}

export const AtuacaoDaEmpresa = {
  concedeu(atuacao: AtuacaoDaEmpresa, embarcacaoId: string): boolean {
    return embarcacaoId.trim().length > 0 && atuacao.embarcacaoIds.has(embarcacaoId)
  },

  operaNoPorto(atuacao: AtuacaoDaEmpresa, portoId: string): boolean {
    return portoId.trim().length > 0 && atuacao.portoIds.has(portoId)
  },

  /**
   * A embarcação concedida **e** os dois cais **da viagem** na concessão. O `podeOfertar(viagem)` do Kotlin.
   *
   * Desde a rota geográfica (fluviapp-kmp#51), o cais é da viagem, e não da rota. A concessão vale para a saída
   * **planejada**: o cais de um dia alterado não tira da agência a venda daquela data (PO, 2026-10-12).
   */
  podeOfertar(atuacao: AtuacaoDaEmpresa, viagem: Viagem): boolean {
    return (
      AtuacaoDaEmpresa.concedeu(atuacao, viagem.embarcacaoId) &&
      AtuacaoDaEmpresa.operaNoPorto(atuacao, viagem.portoEmbarqueId) &&
      AtuacaoDaEmpresa.operaNoPorto(atuacao, viagem.portoDesembarqueId)
    )
  },
} as const
