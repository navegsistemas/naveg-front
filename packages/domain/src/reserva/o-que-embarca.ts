/**
 * **O que vai embarcar** — a primeira pergunta da reserva no site (UI 2.2, decisões G e K; naveg-front#66).
 *
 * Três respostas, e a ordem é a da tela: o **veículo** em destaque, porque muitas vezes ele vai sozinho; **passageiros e
 * veículo**, que é uma reserva só, com um código; e **passageiros**. A encomenda não está aqui: ela tem a seção dela, e
 * a primeira pergunta só aponta para lá (até a 2.7).
 *
 * Não é uma categoria do KMP. Ela decide qual reserva se monta: a de passageiros, ou a de veículo, com ou sem as pessoas
 * que vão junto.
 */
import { deValor } from '../primitivos/fronteira.js'

export const EMBARQUES = ['VEICULO', 'PASSAGEIROS_E_VEICULO', 'PASSAGEIROS'] as const

export type OQueEmbarca = (typeof EMBARQUES)[number]

const ROTULOS: Readonly<Record<OQueEmbarca, string>> = {
  VEICULO: 'Veículo',
  PASSAGEIROS_E_VEICULO: 'Passageiros e veículo',
  PASSAGEIROS: 'Passageiros',
}

export const OQueEmbarca = {
  valores: EMBARQUES,

  rotulo(embarque: OQueEmbarca): string {
    return ROTULOS[embarque]
  },

  levaVeiculo(embarque: OQueEmbarca): boolean {
    return embarque !== 'PASSAGEIROS'
  },

  levaPessoas(embarque: OQueEmbarca): boolean {
    return embarque !== 'VEICULO'
  },

  de(valor: string | null | undefined): OQueEmbarca | null {
    return deValor(EMBARQUES, valor)
  },
} as const
