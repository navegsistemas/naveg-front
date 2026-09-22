/**
 * **A acomodação** — o espaço pedido para um passageiro. Porte de `passagem/acomodacao.ts` do
 * `@fluviapp/domain`, que porta `domain/passagem/Acomodacao.kt`.
 *
 * ### O tipo tarifário é limitado pela acomodação, e a regra mora aqui
 *
 * *"Inteira (suíte ou camarote), meia ou gratuidade (rede)"* — palavra do analista. Suíte e camarote são
 * sempre **inteira**; meia e gratuidade existem **só na rede**. Ter isso como propriedade da acomodação é
 * o que impede a tela de esconder um seletor por `if`: fora da rede o seletor **não existe**, e *meia numa
 * suíte* deixa de ser escrevível.
 *
 * É também de onde o roteiro da reserva deriva um passo inteiro — ver `reserva/roteiro-da-reserva.ts`: o
 * passo do tipo tarifário só existe quando [Acomodacao.temEscolhaDeTipo] é verdadeiro. O passo não é uma
 * regra de tela; é uma consequência desta tabela.
 *
 * ### A ocupação é limite, não fato
 *
 * Suíte e camarote são vendidos para uma, duas ou três pessoas; a rede é **uma por bilhete**. Aqui mora o
 * **máximo**; quem diz quantas pessoas há é a **lista de passageiros** da reserva. Um campo de ocupação ao
 * lado da lista poderia discordar dela — e "suíte para três com dois passageiros" é exatamente o estado
 * que o agregado não deve admitir.
 */
import { deValor } from '../primitivos/fronteira.js'
import type { TipoPassagem } from './tipo-passagem.js'

export const ACOMODACOES = ['REDE', 'SUITE', 'CAMAROTE'] as const

export type Acomodacao = (typeof ACOMODACOES)[number]

export interface PropriedadesDaAcomodacao {
  readonly rotulo: string
  /** Quantas pessoas cabem num bilhete desta acomodação. */
  readonly ocupacaoMaxima: number
  /** Tipos tarifários que esta acomodação admite. */
  readonly tiposPermitidos: readonly TipoPassagem[]
}

const PROPRIEDADES: Readonly<Record<Acomodacao, PropriedadesDaAcomodacao>> = {
  REDE: { rotulo: 'Rede', ocupacaoMaxima: 1, tiposPermitidos: ['INTEIRA', 'MEIA', 'GRATUIDADE'] },
  SUITE: { rotulo: 'Suíte', ocupacaoMaxima: 3, tiposPermitidos: ['INTEIRA'] },
  CAMAROTE: { rotulo: 'Camarote', ocupacaoMaxima: 3, tiposPermitidos: ['INTEIRA'] },
}

export const Acomodacao = {
  valores: ACOMODACOES,
  propriedades: PROPRIEDADES,

  rotulo(acomodacao: Acomodacao): string {
    return PROPRIEDADES[acomodacao].rotulo
  },

  ocupacaoMaxima(acomodacao: Acomodacao): number {
    return PROPRIEDADES[acomodacao].ocupacaoMaxima
  },

  tiposPermitidos(acomodacao: Acomodacao): readonly TipoPassagem[] {
    return PROPRIEDADES[acomodacao].tiposPermitidos
  },

  /** Regra pura: esta acomodação admite este tipo tarifário? */
  admite(acomodacao: Acomodacao, tipo: TipoPassagem | null | undefined): boolean {
    return (
      tipo !== null && tipo !== undefined && PROPRIEDADES[acomodacao].tiposPermitidos.includes(tipo)
    )
  },

  /** `true` quando há escolha de tipo a fazer — hoje, só a rede. */
  temEscolhaDeTipo(acomodacao: Acomodacao): boolean {
    return PROPRIEDADES[acomodacao].tiposPermitidos.length > 1
  },

  /** `true` quando cabe mais de uma pessoa — é o que faz o passo da quantidade existir. */
  comportaAcompanhante(acomodacao: Acomodacao): boolean {
    return PROPRIEDADES[acomodacao].ocupacaoMaxima > 1
  },

  /** Fronteira do dado gravado (o nome canônico). Fail-closed. */
  de(valor: string | null | undefined): Acomodacao | null {
    return deValor(ACOMODACOES, valor)
  },
} as const
