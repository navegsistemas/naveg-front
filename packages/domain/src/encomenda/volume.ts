/**
 * **O que se pergunta sobre a encomenda** — o tipo do volume, a faixa de peso e quem retira.
 *
 * Os três são **listas fechadas**, por decisão do PO (2026-10-01, `docs/plano-da-reserva-de-encomenda.md`, C3,
 * C4 e C12). A razão é a mesma do pedido HTTP estrito: o público escreve aqui, e uma lista fechada é o que não
 * se abusa. O que a lista não diz, o **complemento** opcional diz, em poucas palavras.
 *
 * - **o tipo** é o que o atendente precisa para responder "cabe": uma caixa e um móvel não pedem o mesmo lugar;
 * - **a faixa de peso**, e não um número: quem manda raramente sabe o peso, e um número inventado parece mais
 *   preciso do que é. O atendente confere no porto;
 * - **quem retira** é o caso do motorista ou transportador que despacha o volume e o pega no destino: com
 *   `REMETENTE` não há destinatário, e o celular de quem manda passa a ser obrigatório.
 *
 * Os mesmos nomes do `Encomenda.kt` do fluviapp-kmp (o balcão leva a resposta da reserva sem traduzir), e o
 * teste de contrato os confere contra o Kotlin, como confere os da passagem.
 */
import { deValor } from '../primitivos/fronteira.js'

export const TIPOS_DE_VOLUME = ['CAIXA', 'SACO_FARDO', 'ELETRODOMESTICO', 'MOVEL', 'OUTRO'] as const

export type TipoVolume = (typeof TIPOS_DE_VOLUME)[number]

const ROTULOS_DO_TIPO: Readonly<Record<TipoVolume, string>> = {
  CAIXA: 'Caixa',
  SACO_FARDO: 'Saco ou fardo',
  ELETRODOMESTICO: 'Eletrodoméstico',
  MOVEL: 'Móvel',
  OUTRO: 'Outro',
}

export const TipoVolume = {
  valores: TIPOS_DE_VOLUME,

  rotulo(tipo: TipoVolume): string {
    return ROTULOS_DO_TIPO[tipo]
  },

  de(valor: string | null | undefined): TipoVolume | null {
    return deValor(TIPOS_DE_VOLUME, valor)
  },
} as const

export const FAIXAS_DE_PESO = ['ATE_5', 'DE_5_A_20', 'DE_20_A_50', 'ACIMA_DE_50'] as const

/** O peso **somado** dos volumes, em faixa. */
export type FaixaPeso = (typeof FAIXAS_DE_PESO)[number]

const ROTULOS_DA_FAIXA: Readonly<Record<FaixaPeso, string>> = {
  ATE_5: 'Até 5 kg',
  DE_5_A_20: '5 a 20 kg',
  DE_20_A_50: '20 a 50 kg',
  ACIMA_DE_50: 'Acima de 50 kg',
}

export const FaixaPeso = {
  valores: FAIXAS_DE_PESO,

  rotulo(faixa: FaixaPeso): string {
    return ROTULOS_DA_FAIXA[faixa]
  },

  de(valor: string | null | undefined): FaixaPeso | null {
    return deValor(FAIXAS_DE_PESO, valor)
  },
} as const

export const FORMAS_DE_RETIRADA = ['REMETENTE', 'OUTRA_PESSOA'] as const

/** Quem retira no destino: quem mandou, ou outra pessoa — e só nesse caso há destinatário. */
export type Retirada = (typeof FORMAS_DE_RETIRADA)[number]

const ROTULOS_DA_RETIRADA: Readonly<Record<Retirada, string>> = {
  REMETENTE: 'Eu mesmo',
  OUTRA_PESSOA: 'Outra pessoa',
}

export const Retirada = {
  valores: FORMAS_DE_RETIRADA,

  /** Como a pergunta "Quem retira no destino?" oferece a opção — na voz de quem está mandando. */
  rotulo(retirada: Retirada): string {
    return ROTULOS_DA_RETIRADA[retirada]
  },

  de(valor: string | null | undefined): Retirada | null {
    return deValor(FORMAS_DE_RETIRADA, valor)
  },
} as const

/** Uma encomenda é de 1 a 20 volumes. Mais do que isso já é carga, e conversa com o atendente. */
export const LIMITE_DE_VOLUMES = 20

/** O complemento do tipo cabe nisto. O campo da tela tem o mesmo limite. */
export const LIMITE_DO_COMPLEMENTO = 60
