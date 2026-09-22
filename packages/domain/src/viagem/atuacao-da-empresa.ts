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
import type { Rota } from '../rota/rota.js'
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

  /** A embarcação concedida **e** os dois portos da rota na concessão. O `podeOfertar(viagem, rota)`. */
  podeOfertar(atuacao: AtuacaoDaEmpresa, viagem: Viagem, rota: Rota): boolean {
    return (
      AtuacaoDaEmpresa.concedeu(atuacao, viagem.embarcacaoId) &&
      AtuacaoDaEmpresa.operaNoPorto(atuacao, rota.portoOrigemId) &&
      AtuacaoDaEmpresa.operaNoPorto(atuacao, rota.portoDestinoId)
    )
  },
} as const
