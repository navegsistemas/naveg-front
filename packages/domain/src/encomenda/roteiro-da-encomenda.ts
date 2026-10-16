/**
 * **O roteiro da encomenda** — as perguntas da seção "Envie sua encomenda", como função pura.
 *
 * É **outro roteiro**, e não um ramo do da passagem (`docs/plano-da-reserva-de-encomenda.md`, §6): as perguntas
 * não se cruzam, e misturá-las faria a reserva de passagem pagar pela de encomenda em cada cenário. O desenho é o
 * mesmo do `roteiroDaReserva`: respostas dentro, nós fora; o nó em foco é o primeiro sem resposta; o roteiro
 * **cresce** conforme as respostas chegam; voltar é derivado, sem pilha.
 *
 * ```
 * VOLUMES → PESO → REMETENTE → (DESTINATARIO, se outra pessoa retira) → CONFERENCIA
 * ```
 *
 * ### Quem retira não é mais pergunta (naveg-front#58, 2.7)
 *
 * O site deixou de perguntar "Quem retira no destino?" (PO, 2026-10-07), e o destinatário voltou como **opcional**,
 * depois de quem manda (PO, 2026-10-15). A retirada passa a ser **derivada**: com o destinatário informado, é
 * `OUTRA_PESSOA`; sem ele, fica ausente — "a definir no atendimento", como o KMP lê desde o fluviapp-kmp#43. Uma
 * `retirada` explícita ainda vale: é o que a página de antes manda, e a API nova a aceita até a página nova entrar.
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
  /** Só quando outra pessoa retira: nome e celular de quem retira, os dois obrigatórios (C5). */
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

/** O destinatário tem os dois campos — o nome e o celular. Pela metade, não é um destinatário (C5). */
export function destinatarioInformado(respostas: RespostasDaEncomenda): boolean {
  return preenchido(respostas.destinatario?.nome) && preenchido(respostas.destinatario?.telefone)
}

/**
 * **Quem retira, em vigor.** A resposta explícita, se está entre as opções (a página de antes); sem ela, `OUTRA_PESSOA`
 * quando o destinatário foi informado, e ausente quando não — o atendimento combina. O roteiro e a montagem leem a mesma
 * derivação.
 */
export function retiradaEmVigor(respostas: RespostasDaEncomenda): Retirada | undefined {
  const explicita = escolhida(Retirada.valores, respostas.retirada)
  if (explicita !== undefined) return explicita
  return destinatarioInformado(respostas) ? 'OUTRA_PESSOA' : undefined
}

export function roteiroDaEncomenda(respostas: RespostasDaEncomenda): RoteiroDaEncomenda {
  const nos: NoDaEncomenda[] = [
    { passo: 'VOLUMES', tipos: TipoVolume.valores, maximo: LIMITE_DE_VOLUMES },
    { passo: 'PESO', opcoes: FaixaPeso.valores },
  ]

  /* O celular de quem manda é obrigatório, a não ser quando outra pessoa retira: é o que o KMP confere. O site o pede
     sempre (decisão F da 2.7); a regra aqui é a do contrato, para a API aceitar o que a página de antes manda. */
  const retirada = retiradaEmVigor(respostas)
  nos.push({ passo: 'REMETENTE', telefoneObrigatorio: retirada !== 'OUTRA_PESSOA' })
  if (retirada === 'OUTRA_PESSOA') nos.push({ passo: 'DESTINATARIO' })
  nos.push({ passo: 'CONFERENCIA' })

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
    case 'DESTINATARIO':
      return destinatarioInformado(respostas)
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
    case 'DESTINATARIO':
      return sem(respostas, 'destinatario', 'retirada')
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
