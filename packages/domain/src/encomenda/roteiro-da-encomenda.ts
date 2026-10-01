/**
 * **O roteiro da encomenda** — as perguntas da seção "Envie sua encomenda", como função pura.
 *
 * É **outro roteiro**, e não um ramo do da passagem (`docs/plano-da-reserva-de-encomenda.md`, §6): as perguntas
 * não se cruzam, e misturá-las faria a reserva de passagem pagar pela de encomenda em cada cenário. O desenho é o
 * mesmo do `roteiroDaReserva`: respostas dentro, nós fora; o nó em foco é o primeiro sem resposta; o roteiro
 * **cresce** conforme as respostas chegam; voltar é derivado, sem pilha.
 *
 * ```
 * VOLUMES → PESO → RETIRADA ─┬─ "Outra pessoa" → DESTINATARIO → REMETENTE (celular opcional) → CONFERENCIA
 *                            └─ "Eu mesmo" ─────────────────→ REMETENTE (celular obrigatório) → CONFERENCIA
 * ```
 *
 * A saída não é um nó, como no totem de passagem: ela é escolhida antes, na lista, e chega como o contexto.
 * Toda saída aceita encomenda por enquanto (C7 do plano), então o roteiro não pergunta nada ao casco.
 */
import { casoImpossivel } from '../primitivos/fronteira.js'
import type { RascunhoDoCliente } from '../reserva/roteiro-da-reserva.js'
import { FaixaPeso, LIMITE_DE_VOLUMES, Retirada, TipoVolume } from './volume.js'

/** Um nó do roteiro da encomenda. Como no da passagem, as opções vêm **no nó**. */
export type NoDaEncomenda =
  /** O tipo, a quantidade (1 a `maximo`) e o complemento opcional — uma tela só. */
  | { readonly passo: 'VOLUMES'; readonly tipos: readonly TipoVolume[]; readonly maximo: number }
  | { readonly passo: 'PESO'; readonly opcoes: readonly FaixaPeso[] }
  | { readonly passo: 'RETIRADA'; readonly opcoes: readonly Retirada[] }
  /** Só com "Outra pessoa": nome e celular de quem retira, os dois obrigatórios (C5). */
  | { readonly passo: 'DESTINATARIO' }
  /** Quem manda. O celular é obrigatório quando é a mesma pessoa que retira (C12) — é por ele que o destino avisa. */
  | { readonly passo: 'REMETENTE'; readonly telefoneObrigatorio: boolean }
  | { readonly passo: 'CONFERENCIA' }

export type PassoDaEncomenda = NoDaEncomenda['passo']

/** **As respostas da encomenda em curso.** Tudo opcional, por definição. */
export interface RespostasDaEncomenda {
  readonly tipoVolume?: TipoVolume
  readonly quantidadeVolumes?: number
  readonly complemento?: string
  readonly faixaPeso?: FaixaPeso
  readonly retirada?: Retirada
  readonly destinatario?: RascunhoDoCliente
  /** **Quem manda.** É o `cliente` da reserva — quem pediu —, com o nome da passagem para a emissão ler igual. */
  readonly cliente?: RascunhoDoCliente
}

export interface RoteiroDaEncomenda {
  readonly nos: readonly NoDaEncomenda[]
  readonly atual: NoDaEncomenda | null
  /** Base 1 — o "passo 3 de 6" do indicador. `0` quando não há foco. */
  readonly posicaoAtual: number
  readonly total: number
  readonly prontoParaConferir: boolean
}

function escolhida<T>(opcoes: readonly T[], valor: T | undefined): T | undefined {
  return valor !== undefined && opcoes.includes(valor) ? valor : undefined
}

function preenchido(texto: string | undefined): boolean {
  return texto !== undefined && texto.trim().length > 0
}

/** Quem retira, **se** a resposta está entre as opções. O roteiro e a montagem leem a mesma derivação. */
export function retiradaEmVigor(respostas: RespostasDaEncomenda): Retirada | undefined {
  return escolhida(Retirada.valores, respostas.retirada)
}

export function roteiroDaEncomenda(respostas: RespostasDaEncomenda): RoteiroDaEncomenda {
  const nos: NoDaEncomenda[] = [
    { passo: 'VOLUMES', tipos: TipoVolume.valores, maximo: LIMITE_DE_VOLUMES },
    { passo: 'PESO', opcoes: FaixaPeso.valores },
    { passo: 'RETIRADA', opcoes: Retirada.valores },
  ]

  const retirada = retiradaEmVigor(respostas)
  if (retirada === 'OUTRA_PESSOA') nos.push({ passo: 'DESTINATARIO' })

  /* Remetente e conferência existem em qualquer caminho, e entram desde o começo: o indicador diz "de 5"
     antes de saber quem retira, e cresce para 6 se for outra pessoa — nunca encurta. */
  nos.push({ passo: 'REMETENTE', telefoneObrigatorio: retirada === 'REMETENTE' }, { passo: 'CONFERENCIA' })

  const indiceAtual = nos.findIndex((no) => !respondidoNaEncomenda(no, respostas))
  const conferencia = nos.length - 1

  return {
    nos,
    atual: indiceAtual === -1 ? null : (nos[indiceAtual] as NoDaEncomenda),
    posicaoAtual: indiceAtual === -1 ? 0 : indiceAtual + 1,
    total: nos.length,
    prontoParaConferir: indiceAtual === conferencia || indiceAtual === -1,
  }
}

/** **Este nó já foi respondido?** Há resposta, entre as oferecidas — se ela é válida, é a montagem que diz. */
export function respondidoNaEncomenda(no: NoDaEncomenda, respostas: RespostasDaEncomenda): boolean {
  switch (no.passo) {
    case 'VOLUMES': {
      const quantidade = respostas.quantidadeVolumes
      return (
        escolhida(no.tipos, respostas.tipoVolume) !== undefined &&
        quantidade !== undefined &&
        Number.isInteger(quantidade) &&
        quantidade >= 1 &&
        quantidade <= no.maximo
      )
    }
    case 'PESO':
      return escolhida(no.opcoes, respostas.faixaPeso) !== undefined
    case 'RETIRADA':
      return escolhida(no.opcoes, respostas.retirada) !== undefined
    case 'DESTINATARIO':
      return preenchido(respostas.destinatario?.nome) && preenchido(respostas.destinatario?.telefone)
    case 'REMETENTE':
      return preenchido(respostas.cliente?.nome) && (!no.telefoneObrigatorio || preenchido(respostas.cliente?.telefone))
    case 'CONFERENCIA':
      return false
    default:
      return casoImpossivel(no, 'respondidoNaEncomenda')
  }
}

type RespostasMutaveis = { -readonly [Chave in keyof RespostasDaEncomenda]: RespostasDaEncomenda[Chave] }

function sem(respostas: RespostasDaEncomenda, ...chaves: (keyof RespostasDaEncomenda)[]): RespostasDaEncomenda {
  const copia: RespostasMutaveis = { ...respostas }
  for (const chave of chaves) delete copia[chave]
  return copia
}

/** As respostas sem a resposta deste nó — o inverso de [respondidoNaEncomenda]. As chaves são **omitidas**. */
export function semRespostaNaEncomenda(no: NoDaEncomenda, respostas: RespostasDaEncomenda): RespostasDaEncomenda {
  switch (no.passo) {
    case 'VOLUMES':
      return sem(respostas, 'tipoVolume', 'quantidadeVolumes', 'complemento')
    case 'PESO':
      return sem(respostas, 'faixaPeso')
    case 'RETIRADA':
      return sem(respostas, 'retirada')
    case 'DESTINATARIO':
      return sem(respostas, 'destinatario')
    case 'REMETENTE':
      return sem(respostas, 'cliente')
    case 'CONFERENCIA':
      return respostas
    default:
      return casoImpossivel(no, 'semRespostaNaEncomenda')
  }
}

/** **Voltar um passo** — apaga a resposta do nó anterior ao foco, como o `voltar` da passagem. */
export function voltarNaEncomenda(respostas: RespostasDaEncomenda): RespostasDaEncomenda {
  const { nos, posicaoAtual } = roteiroDaEncomenda(respostas)
  const indiceDoAnterior = (posicaoAtual === 0 ? nos.length : posicaoAtual - 1) - 1
  const anterior = nos[indiceDoAnterior]
  return anterior === undefined ? respostas : semRespostaNaEncomenda(anterior, respostas)
}
