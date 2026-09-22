/**
 * **O roteiro da reserva — o totem como máquina de domínio.**
 *
 * Adaptação **declarada** do `roteiroDe` do aplicativo (`ui/states/passagem/RoteiroDaEmissao.kt`, ADR-0029).
 * Lá, *"o roteiro é derivado do que se escolheu — função pura: escolhas dentro, passos fora"*. Aqui também, e
 * é isso que garante que a ilha do totem não reimplemente regra nenhuma: ela desenha o nó que recebe.
 *
 * ### As diferenças em relação ao aplicativo, e todas são de domínio
 *
 * | | emissão (aplicativo) | reserva (aqui) | por quê |
 * |---|---|---|---|
 * | `DadosDoCliente` por pessoa | um formulário por pessoa, com documento | **não existe** | o totem não exige documento (decisão de 2026-09-22): quem viaja é identificado no atendimento |
 * | `DadosDoVeiculo` | placa, modelo, cor, cilindrada | **só a cilindrada, e só na moto** | é a única informação do veículo que muda a passagem (a faixa de tarifa); o resto é identificação |
 * | responsável pela retirada | opcional | **não existe** | é pessoa, com documento — atendimento |
 * | `Pagamento` | último passo | **não existe** | não se vende aqui |
 * | `CLIENTE` | — | **antes da conferência** | nome, e um telefone opcional: quem pediu |
 * | `CONFERENCIA` | tela fora do roteiro | **último nó** | num terminal público, revisar antes de enviar é um passo |
 *
 * O que fica é **o que define a passagem**: a categoria, a acomodação, o tipo tarifário e o subtipo de
 * gratuidade, a quantidade de pessoas, a natureza e a classe do veículo — com as mesmas regras do aplicativo
 * decidindo quais perguntas existem. A natureza vem antes da classe, e a classe só é perguntada quando há
 * escolha naquele casco (num navio, nunca).
 *
 * ### A resposta que ficou para trás
 *
 * **Uma resposta só conta se estava entre as opções que o nó ofereceu.** No aplicativo, o ViewModel limpa o
 * estado ao trocar a escolha; aqui não há ViewModel, então a garantia mora na leitura. A `'MEIA'` de uma rede
 * abandonada não vale numa suíte, e a van escolhida para um ferry não vale num navio.
 */
import { Acomodacao } from '../passagem/acomodacao.js'
import type { CategoriaPassagem } from '../passagem/categoria-passagem.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import type { NaturezaVeiculo } from '../passagem/natureza-veiculo.js'
import { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import type { TipoPassagem } from '../passagem/tipo-passagem.js'
import type { InstanteLocal } from '../primitivos/calendario.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import { TipoEmbarcacao } from '../viagem/tipo-embarcacao.js'
import type { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'

/**
 * Um **nó do roteiro**: a pergunta, e o que ela oferece como resposta. As opções vêm **no nó** — um seletor
 * que recebe `opcoes` não tem como oferecer "meia numa suíte", porque a opção não chegou.
 */
export type NoDoRoteiro =
  | { readonly passo: 'CATEGORIA'; readonly opcoes: readonly CategoriaPassagem[] }
  | { readonly passo: 'ACOMODACAO'; readonly opcoes: readonly Acomodacao[] }
  | { readonly passo: 'TIPO_TARIFARIO'; readonly opcoes: readonly TipoPassagem[] }
  | { readonly passo: 'TIPO_GRATUIDADE'; readonly opcoes: readonly TipoGratuidade[] }
  | { readonly passo: 'QUANTIDADE_PESSOAS'; readonly opcoes: readonly number[] }
  | { readonly passo: 'NATUREZA_VEICULO'; readonly opcoes: readonly NaturezaVeiculo[] }
  | { readonly passo: 'CLASSE_VEICULO'; readonly natureza: NaturezaVeiculo; readonly opcoes: readonly ClasseVeiculo[] }
  /** Só para a classe que a exige — hoje, a moto. */
  | { readonly passo: 'CILINDRADA'; readonly classe: ClasseVeiculo }
  /** Nome obrigatório; telefone opcional — ver `ClienteDaReserva`. */
  | { readonly passo: 'CLIENTE' }
  | { readonly passo: 'CONFERENCIA' }

export type PassoDaReserva = NoDoRoteiro['passo']

/** Quem pede, enquanto se digita. O telefone aceita qualquer grafia; a montagem normaliza. */
export interface RascunhoDoCliente {
  readonly nome?: string
  readonly telefone?: string
}

/** **As respostas da reserva em curso.** Tudo opcional, por definição. */
export interface RespostasDaReserva {
  readonly categoria?: CategoriaPassagem
  readonly acomodacao?: Acomodacao
  readonly tipo?: TipoPassagem
  readonly gratuidade?: TipoGratuidade
  readonly quantidadePessoas?: number
  /** Campo próprio, como no `VeiculoEmEdicao`: existe o estado "natureza escolhida, classe ainda não". */
  readonly naturezaVeiculo?: NaturezaVeiculo
  readonly classeVeiculo?: ClasseVeiculo
  readonly cilindrada?: number
  readonly cliente?: RascunhoDoCliente
  readonly observacao?: string
}

/**
 * **O contexto do pedido** — a travessia escolhida, como o catálogo a entrega (`TravessiaOfertada.contexto`).
 * O totem não o monta: ele vem pronto de `travessiasOfertadas`.
 */
export interface ContextoDaReserva {
  readonly ocorrencia: OcorrenciaViagem
  /** Da embarcação da viagem — é ela que diz se veículo é escolha, e quais. */
  readonly tipoEmbarcacao: TipoEmbarcacao
  /** A partida desta ocorrência. É dela que nasce a validade da reserva. */
  readonly partida: InstanteLocal
}

export interface Roteiro {
  /** Os nós **na ordem**, como o caminho está conhecido agora. Cresce conforme as respostas chegam. */
  readonly nos: readonly NoDoRoteiro[]
  /** O nó em foco: o primeiro sem resposta. Na prática nunca é `null` — a conferência não se responde. */
  readonly atual: NoDoRoteiro | null
  /** Posição do nó em foco, base 1 — é o "passo 3 de 7" do indicador. `0` quando não há foco. */
  readonly posicaoAtual: number
  readonly total: number
  /** Todos os nós anteriores à conferência estão respondidos. */
  readonly prontoParaConferir: boolean
}

/** Identidade estável de um nó — serve de chave de lista e de rótulo de rota. */
export function chaveDoNo(no: NoDoRoteiro): string {
  return no.passo
}

/** As categorias que esta embarcação admite. `VEICULO` só se o casco leva. */
export function categoriasOfertadas(tipoEmbarcacao: TipoEmbarcacao): readonly CategoriaPassagem[] {
  return TipoEmbarcacao.levaVeiculo(tipoEmbarcacao) ? ['PASSAGEIRO', 'VEICULO'] : ['PASSAGEIRO']
}

/** As classes que uma natureza oferece **neste casco** — o `classesOfertaveis` do aplicativo. */
export function classesOfertadas(natureza: NaturezaVeiculo, tipoEmbarcacao: TipoEmbarcacao): readonly ClasseVeiculo[] {
  return TipoEmbarcacao.classesDa(tipoEmbarcacao, natureza)
}

/** A resposta, **se** ela está entre as opções. É a leitura que impede a sobra de vazar. */
function escolhida<T>(opcoes: readonly T[], valor: T | undefined): T | undefined {
  return valor !== undefined && opcoes.includes(valor) ? valor : undefined
}

function faixa(maximo: number): readonly number[] {
  return Array.from({ length: maximo }, (_, indice) => indice + 1)
}

/** **O tipo tarifário em vigor**: sem escolha, o único permitido; com escolha, a resposta se admitida. */
export function tipoEmVigor(respostas: RespostasDaReserva, acomodacao: Acomodacao): TipoPassagem | undefined {
  const permitidos = Acomodacao.tiposPermitidos(acomodacao)
  return Acomodacao.temEscolhaDeTipo(acomodacao) ? escolhida(permitidos, respostas.tipo) : permitidos[0]
}

/**
 * **Quantas pessoas o bilhete cobre.** Sem escolha (rede), uma. Com escolha, a resposta se estiver na faixa
 * — e `undefined` enquanto não houver, porque aqui a quantidade **vai para a reserva**, e não se inventa.
 */
export function pessoasEmVigor(respostas: RespostasDaReserva, acomodacao: Acomodacao): number | undefined {
  if (!Acomodacao.comportaAcompanhante(acomodacao)) return 1
  return escolhida(faixa(Acomodacao.ocupacaoMaxima(acomodacao)), respostas.quantidadePessoas)
}

/**
 * **A classe em vigor** para esta natureza neste casco. Com uma só possível, é ela — *"a resposta já foi
 * dada pela natureza"*, como diz o roteiro do aplicativo. O roteiro e a montagem leem a mesma derivação.
 */
export function classeEmVigor(
  respostas: RespostasDaReserva,
  natureza: NaturezaVeiculo,
  tipoEmbarcacao: TipoEmbarcacao,
): ClasseVeiculo | undefined {
  const opcoes = classesOfertadas(natureza, tipoEmbarcacao)
  return opcoes.length === 1 ? opcoes[0] : escolhida(opcoes, respostas.classeVeiculo)
}

function nosDePassageiro(respostas: RespostasDaReserva): readonly NoDoRoteiro[] {
  const nos: NoDoRoteiro[] = [{ passo: 'ACOMODACAO', opcoes: Acomodacao.valores }]

  const acomodacao = escolhida(Acomodacao.valores, respostas.acomodacao)
  if (acomodacao === undefined) return nos

  /* A rede vende uma pessoa e tem tipo a escolher; suíte e camarote são sempre inteira e têm quantidade. */
  if (Acomodacao.temEscolhaDeTipo(acomodacao)) {
    nos.push({ passo: 'TIPO_TARIFARIO', opcoes: Acomodacao.tiposPermitidos(acomodacao) })
  }
  /* Gratuidade sem subtipo deixa de ser estado a validar e passa a ser estado que não se alcança. */
  if (tipoEmVigor(respostas, acomodacao) === 'GRATUIDADE') {
    nos.push({ passo: 'TIPO_GRATUIDADE', opcoes: TipoGratuidade.valores })
  }
  if (Acomodacao.comportaAcompanhante(acomodacao)) {
    nos.push({ passo: 'QUANTIDADE_PESSOAS', opcoes: faixa(Acomodacao.ocupacaoMaxima(acomodacao)) })
  }
  return nos
}

function nosDeVeiculo(respostas: RespostasDaReserva, contexto: ContextoDaReserva): readonly NoDoRoteiro[] {
  const naturezas = TipoEmbarcacao.naturezasAdmitidas(contexto.tipoEmbarcacao)
  const nos: NoDoRoteiro[] = [{ passo: 'NATUREZA_VEICULO', opcoes: naturezas }]

  const natureza = escolhida(naturezas, respostas.naturezaVeiculo)
  if (natureza === undefined) return nos

  /* O subpasso só existe quando há o que perguntar — num navio, nunca. */
  const classes = classesOfertadas(natureza, contexto.tipoEmbarcacao)
  if (classes.length > 1) nos.push({ passo: 'CLASSE_VEICULO', natureza, opcoes: classes })

  const classe = classeEmVigor(respostas, natureza, contexto.tipoEmbarcacao)
  if (classe !== undefined && ClasseVeiculo.exigeCilindrada(classe)) nos.push({ passo: 'CILINDRADA', classe })
  return nos
}

/**
 * **O roteiro como está agora.** Pura: quais perguntas, em que ordem, com quais opções. Quantas cabem numa
 * tela é decisão da apresentação. O roteiro **cresce** conforme as respostas chegam.
 */
export function roteiroDaReserva(respostas: RespostasDaReserva, contexto: ContextoDaReserva): Roteiro {
  const categorias = categoriasOfertadas(contexto.tipoEmbarcacao)
  const nos: NoDoRoteiro[] = [{ passo: 'CATEGORIA', opcoes: categorias }]

  const categoria = escolhida(categorias, respostas.categoria)
  if (categoria !== undefined) {
    switch (categoria) {
      case 'PASSAGEIRO':
        nos.push(...nosDePassageiro(respostas))
        break
      case 'VEICULO':
        nos.push(...nosDeVeiculo(respostas, contexto))
        break
      default:
        casoImpossivel(categoria, 'roteiroDaReserva')
    }
  }

  /* Cliente e conferência existem em qualquer caminho, e por isso entram desde o começo: o indicador
     precisa dizer "de 3" antes de o meio estar conhecido, senão ele encurta em vez de crescer. */
  nos.push({ passo: 'CLIENTE' }, { passo: 'CONFERENCIA' })

  const indiceAtual = nos.findIndex((no) => !respondido(no, respostas))
  const conferencia = nos.length - 1

  return {
    nos,
    atual: indiceAtual === -1 ? null : (nos[indiceAtual] as NoDoRoteiro),
    posicaoAtual: indiceAtual === -1 ? 0 : indiceAtual + 1,
    total: nos.length,
    prontoParaConferir: indiceAtual === conferencia || indiceAtual === -1,
  }
}

function preenchido(texto: string | undefined): boolean {
  return texto !== undefined && texto.trim().length > 0
}

/**
 * **Este nó já foi respondido?** Não *"o valor é válido?"* — isso é da montagem, que confere o telefone —,
 * mas *"há resposta aqui, entre as que foram oferecidas?"*.
 */
export function respondido(no: NoDoRoteiro, respostas: RespostasDaReserva): boolean {
  switch (no.passo) {
    case 'CATEGORIA':
      return escolhida(no.opcoes, respostas.categoria) !== undefined
    case 'ACOMODACAO':
      return escolhida(no.opcoes, respostas.acomodacao) !== undefined
    case 'TIPO_TARIFARIO':
      return escolhida(no.opcoes, respostas.tipo) !== undefined
    case 'TIPO_GRATUIDADE':
      return escolhida(no.opcoes, respostas.gratuidade) !== undefined
    case 'QUANTIDADE_PESSOAS':
      return escolhida(no.opcoes, respostas.quantidadePessoas) !== undefined
    case 'NATUREZA_VEICULO':
      return escolhida(no.opcoes, respostas.naturezaVeiculo) !== undefined
    case 'CLASSE_VEICULO':
      return escolhida(no.opcoes, respostas.classeVeiculo) !== undefined
    case 'CILINDRADA':
      return respostas.cilindrada !== undefined && respostas.cilindrada > 0
    case 'CLIENTE':
      /* O telefone é opcional: o nó se responde com o nome. */
      return preenchido(respostas.cliente?.nome)
    case 'CONFERENCIA':
      /* A conferência não se "responde": confirmá-la **é** enviar, e quem decide se pode é `montarReserva`. */
      return false
    default:
      return casoImpossivel(no, 'respondido')
  }
}

type RespostasMutaveis = { -readonly [Chave in keyof RespostasDaReserva]: RespostasDaReserva[Chave] }

function sem(respostas: RespostasDaReserva, chave: keyof RespostasDaReserva): RespostasDaReserva {
  const copia: RespostasMutaveis = { ...respostas }
  delete copia[chave]
  return copia
}

/**
 * **As respostas sem a resposta deste nó** — o inverso exato de [respondido], ao lado dele de propósito. A
 * chave é **omitida**, não posta em `undefined`.
 */
export function semResposta(no: NoDoRoteiro, respostas: RespostasDaReserva): RespostasDaReserva {
  switch (no.passo) {
    case 'CATEGORIA':
      return sem(respostas, 'categoria')
    case 'ACOMODACAO':
      return sem(respostas, 'acomodacao')
    case 'TIPO_TARIFARIO':
      return sem(respostas, 'tipo')
    case 'TIPO_GRATUIDADE':
      return sem(respostas, 'gratuidade')
    case 'QUANTIDADE_PESSOAS':
      return sem(respostas, 'quantidadePessoas')
    case 'NATUREZA_VEICULO':
      return sem(respostas, 'naturezaVeiculo')
    case 'CLASSE_VEICULO':
      return sem(respostas, 'classeVeiculo')
    case 'CILINDRADA':
      return sem(respostas, 'cilindrada')
    case 'CLIENTE':
      return sem(respostas, 'cliente')
    case 'CONFERENCIA':
      return respostas
    default:
      return casoImpossivel(no, 'semResposta')
  }
}

/**
 * **Voltar um passo** — apaga a resposta do nó anterior ao foco. Derivado do roteiro, **sem pilha
 * paralela**: o "anterior" é o que o roteiro diz que é *agora*. No primeiro passo, nada muda.
 */
export function voltar(respostas: RespostasDaReserva, contexto: ContextoDaReserva): RespostasDaReserva {
  const { nos, posicaoAtual } = roteiroDaReserva(respostas, contexto)
  const indiceDoAnterior = (posicaoAtual === 0 ? nos.length : posicaoAtual - 1) - 1
  const anterior = nos[indiceDoAnterior]
  return anterior === undefined ? respostas : semResposta(anterior, respostas)
}
