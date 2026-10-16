/**
 * **O que vai embarcar** — a primeira pergunta da reserva no site (UI 2.2, decisões G e K; naveg-front#66).
 *
 * Quatro respostas, e a ordem é a da tela: o **veículo** em destaque, porque muitas vezes ele vai sozinho; **passageiros
 * e veículo**, que é uma reserva só, com um código; **passageiros**; e a **encomenda**, que entrou no mesmo caminho com a
 * 2.7 (decisão A, PO, 2026-10-15).
 *
 * Não é uma categoria do KMP. Ela decide qual reserva se monta: a de passageiros, a de veículo (com ou sem as pessoas
 * que vão junto) ou a de encomenda.
 */
import { deValor } from '../primitivos/fronteira.js'

export const EMBARQUES = ['VEICULO', 'PASSAGEIROS_E_VEICULO', 'PASSAGEIROS', 'ENCOMENDA'] as const

export type OQueEmbarca = (typeof EMBARQUES)[number]

const ROTULOS: Readonly<Record<OQueEmbarca, string>> = {
  VEICULO: 'Veículo',
  PASSAGEIROS_E_VEICULO: 'Passageiros e veículo',
  PASSAGEIROS: 'Passageiros',
  ENCOMENDA: 'Encomenda',
}

export const OQueEmbarca = {
  valores: EMBARQUES,

  rotulo(embarque: OQueEmbarca): string {
    return ROTULOS[embarque]
  },

  levaVeiculo(embarque: OQueEmbarca): boolean {
    return embarque === 'VEICULO' || embarque === 'PASSAGEIROS_E_VEICULO'
  },

  levaPessoas(embarque: OQueEmbarca): boolean {
    return embarque === 'PASSAGEIROS' || embarque === 'PASSAGEIROS_E_VEICULO'
  },

  /** A encomenda converte em encomenda, e não em passagem: outro documento no KMP, e outro alcance (7 dias). */
  eEncomenda(embarque: OQueEmbarca): boolean {
    return embarque === 'ENCOMENDA'
  },

  de(valor: string | null | undefined): OQueEmbarca | null {
    return deValor(EMBARQUES, valor)
  },
} as const
