/**
 * **O roteiro da reserva — o totem como máquina de domínio.**
 *
 * Adaptação **declarada** do `roteiroDe` do aplicativo (`ui/states/passagem/RoteiroDaEmissao.kt`, ADR-0029).
 * Lá, *"o roteiro é derivado do que se escolheu — função pura: escolhas dentro, passos fora"*. Aqui também,
 * e é isso que garante que a ilha do totem não reimplemente regra nenhuma: ela desenha o nó que recebe.
 *
 * > **Revisado contra o original em 2026-09-22.** A primeira versão seguiu o `roteiroDaEmissao` do fluviapp
 * > web, que estava atrás do aplicativo: tinha seis classes num passo só e um formulário com modelo
 * > obrigatório. O aplicativo pergunta **natureza e depois classe** (ADR-0031 D8), **pula a classe quando só
 * > há uma** naquele casco, e termina o ramo do veículo com o **responsável opcional**. Tudo isso está aqui.
 *
 * ### As diferenças em relação ao aplicativo, e todas são de domínio
 *
 * | | emissão (aplicativo) | reserva (aqui) | por quê |
 * |---|---|---|---|
 * | `Pagamento` | último passo | **não existe** | não se vende aqui |
 * | `CONTATO` | não existe | **antes da conferência** | a razão de ser da Fase 1: formar clientela |
 * | `CONFERENCIA` | tela de confirmação fora do roteiro | **último nó** | num terminal público, revisar antes de enviar é um passo, não um diálogo |
 * | casco desconhecido | `null` não recorta nada | não acontece | a travessia só é ofertada com a embarcação resolvida (`catalogo/travessias.ts`) |
 *
 * ### E uma correção: a resposta que ficou para trás
 *
 * **Uma resposta só conta se estava entre as opções que o nó ofereceu.** [respondido] confere a resposta
 * contra `no.opcoes`, e a leitura de cada valor passa pelo mesmo filtro. Assim a `'MEIA'` de uma rede
 * abandonada não vale numa suíte, e a classe escolhida para um ferry não vale num navio. No aplicativo o
 * ViewModel limpa o estado ao trocar a escolha; aqui não há ViewModel, então a garantia mora na leitura.
 */
import { Acomodacao } from '../passagem/acomodacao.js'
import type { CategoriaPassagem } from '../passagem/categoria-passagem.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import type { NaturezaVeiculo } from '../passagem/natureza-veiculo.js'
import { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import type { TipoPassagem } from '../passagem/tipo-passagem.js'
import { TIPOS_DE_DOCUMENTO, type TipoDocumento } from '../documento/tipo-documento.js'
import type { InstanteLocal } from '../primitivos/calendario.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import { TipoEmbarcacao } from '../viagem/tipo-embarcacao.js'
import type { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'

/** Os campos que o formulário do veículo tem. Todos aparecem; a classe decide quais **se exigem**. */
export const CAMPOS_DO_VEICULO = ['PLACA', 'MODELO', 'COR', 'CILINDRADA'] as const

export type CampoDoVeiculo = (typeof CAMPOS_DO_VEICULO)[number]

/**
 * Os documentos com que **uma pessoa** viaja. É `TipoDocumento` sem o CNPJ: empresa não embarca. Chega
 * dentro do nó para que o seletor da tela não tenha como oferecê-lo.
 */
export const DOCUMENTOS_DE_PESSOA: readonly TipoDocumento[] = TIPOS_DE_DOCUMENTO.filter((tipo) => tipo !== 'CNPJ')

/** A resposta explícita "ninguém retira além de quem reservou" — pular o passo opcional é uma resposta. */
export const SEM_RESPONSAVEL = 'SEM_RESPONSAVEL' as const

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
  | {
      readonly passo: 'QUEM_VIAJA'
      readonly pessoa: number
      readonly ehTitular: boolean
      readonly documentos: readonly TipoDocumento[]
    }
  | { readonly passo: 'NATUREZA_VEICULO'; readonly opcoes: readonly NaturezaVeiculo[] }
  | { readonly passo: 'CLASSE_VEICULO'; readonly natureza: NaturezaVeiculo; readonly opcoes: readonly ClasseVeiculo[] }
  | {
      readonly passo: 'DADOS_VEICULO'
      readonly classe: ClasseVeiculo
      readonly campos: readonly CampoDoVeiculo[]
      /** Os que travam o passo. Os outros aparecem e podem ficar em branco. */
      readonly exigidos: readonly CampoDoVeiculo[]
    }
  | { readonly passo: 'RESPONSAVEL'; readonly documentos: readonly TipoDocumento[] }
  | { readonly passo: 'CONTATO' }
  | { readonly passo: 'CONFERENCIA' }

export type PassoDaReserva = NoDoRoteiro['passo']

/** Uma pessoa enquanto se digita — os campos do `Cliente`, todos opcionais: é rascunho, não agregado. */
export interface RascunhoDePessoa {
  readonly nome?: string
  readonly tipoDocumento?: TipoDocumento
  readonly numeroDocumento?: string
  /** `yyyy-MM-dd`. Vira `DataCalendario` só na montagem, que recusa o que não é data. */
  readonly dataNascimento?: string
}

/** Quem viaja, enquanto se digita. */
export type RascunhoDePassageiro = RascunhoDePessoa

/** O veículo enquanto se digita. */
export interface RascunhoDoVeiculo {
  readonly placa?: string
  readonly modelo?: string
  readonly cor?: string
  readonly cilindrada?: number
}

/** Quem pede, enquanto se digita. O WhatsApp aceita qualquer grafia; a montagem normaliza. */
export interface RascunhoDoContato {
  readonly nome?: string
  readonly whatsapp?: string
}

/** **As respostas da reserva em curso.** Tudo opcional, por definição. */
export interface RespostasDaReserva {
  readonly categoria?: CategoriaPassagem
  readonly acomodacao?: Acomodacao
  readonly tipo?: TipoPassagem
  readonly gratuidade?: TipoGratuidade
  readonly quantidadePessoas?: number
  /** Uma entrada por pessoa, na ordem: o índice 0 é o titular. Buraco = aquela pessoa ainda não. */
  readonly passageiros?: readonly (RascunhoDePassageiro | undefined)[]
  /** Campo próprio, como no `VeiculoEmEdicao`: existe o estado "natureza escolhida, classe ainda não". */
  readonly naturezaVeiculo?: NaturezaVeiculo
  readonly classeVeiculo?: ClasseVeiculo
  readonly veiculo?: RascunhoDoVeiculo
  readonly responsavel?: RascunhoDePessoa | typeof SEM_RESPONSAVEL
  readonly contato?: RascunhoDoContato
  readonly observacao?: string
}

/**
 * **O contexto do pedido** — a travessia escolhida, como o catálogo a entrega (`TravessiaOfertada.contexto`).
 * O totem não o monta: ele vem pronto de `travessiasOfertadas`, com a partida calculada pelo mesmo
 * `ViagemSemana.partida` do aplicativo.
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
  return no.passo === 'QUEM_VIAJA' ? `QUEM_VIAJA#${no.pessoa}` : no.passo
}

/** As categorias que esta embarcação admite. `VEICULO` só se o casco leva. */
export function categoriasOfertadas(tipoEmbarcacao: TipoEmbarcacao): readonly CategoriaPassagem[] {
  return TipoEmbarcacao.levaVeiculo(tipoEmbarcacao) ? ['PASSAGEIRO', 'VEICULO'] : ['PASSAGEIRO']
}

/** As classes que uma natureza oferece **neste casco** — o `classesOfertaveis` do aplicativo. */
export function classesOfertadas(natureza: NaturezaVeiculo, tipoEmbarcacao: TipoEmbarcacao): readonly ClasseVeiculo[] {
  return TipoEmbarcacao.classesDa(tipoEmbarcacao, natureza)
}

/** Os campos que se **exigem** para esta classe: a placa sempre, a cilindrada só na moto. */
export function camposExigidos(classe: ClasseVeiculo): readonly CampoDoVeiculo[] {
  return CAMPOS_DO_VEICULO.filter((campo) => {
    switch (campo) {
      case 'PLACA':
        return true
      case 'MODELO':
      case 'COR':
        return false
      case 'CILINDRADA':
        return ClasseVeiculo.exigeCilindrada(classe)
      default:
        return casoImpossivel(campo, 'camposExigidos')
    }
  })
}

/** Os campos que o formulário mostra para esta classe: a cilindrada só aparece onde se exige. */
export function camposDoVeiculo(classe: ClasseVeiculo): readonly CampoDoVeiculo[] {
  return CAMPOS_DO_VEICULO.filter((campo) => campo !== 'CILINDRADA' || ClasseVeiculo.exigeCilindrada(classe))
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

/** **Quantas pessoas o bilhete cobre.** Sem escolha (rede), uma; com escolha, a resposta se na faixa. */
export function pessoasDoBilhete(respostas: RespostasDaReserva, acomodacao: Acomodacao): number {
  if (!Acomodacao.comportaAcompanhante(acomodacao)) return 1
  return escolhida(faixa(Acomodacao.ocupacaoMaxima(acomodacao)), respostas.quantidadePessoas) ?? 1
}

/**
 * **A classe em vigor** para esta natureza neste casco. Com uma só possível, é ela — *"a resposta já foi
 * dada pela natureza"*, como diz o roteiro do aplicativo, onde o ViewModel a grava no mesmo gesto. Aqui não
 * há gesto a gravar: a classe é derivada, e o roteiro e a montagem leem a mesma derivação.
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

  const pessoas = pessoasDoBilhete(respostas, acomodacao)
  for (let pessoa = 0; pessoa < pessoas; pessoa += 1) {
    nos.push({ passo: 'QUEM_VIAJA', pessoa, ehTitular: pessoa === 0, documentos: DOCUMENTOS_DE_PESSOA })
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
  if (classe === undefined) return nos

  nos.push(
    { passo: 'DADOS_VEICULO', classe, campos: camposDoVeiculo(classe), exigidos: camposExigidos(classe) },
    /* O responsável é opcional: bilhete de veículo sem ninguém nomeado é a forma normal. */
    { passo: 'RESPONSAVEL', documentos: DOCUMENTOS_DE_PESSOA },
  )
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

  /* Contato e conferência existem em qualquer caminho, e por isso entram desde o começo: o indicador
     precisa dizer "de 4" antes de o meio estar conhecido, senão ele encurta em vez de crescer. */
  nos.push({ passo: 'CONTATO' }, { passo: 'CONFERENCIA' })

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

function pessoaPreenchida(pessoa: RascunhoDePessoa | undefined, documentos: readonly TipoDocumento[]): boolean {
  return (
    pessoa !== undefined &&
    preenchido(pessoa.nome) &&
    escolhida(documentos, pessoa.tipoDocumento) !== undefined &&
    preenchido(pessoa.numeroDocumento) &&
    preenchido(pessoa.dataNascimento)
  )
}

/**
 * **Este nó já foi respondido?** Não *"o valor é válido?"* — isso é da montagem, que confere CPF e data —,
 * mas *"há resposta aqui, entre as que foram oferecidas?"*. É o que permite o roteiro avançar com um dado que
 * a conferência depois recusa **dizendo por quê**, em vez de travar em silêncio.
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
    case 'QUEM_VIAJA':
      return pessoaPreenchida(respostas.passageiros?.[no.pessoa], no.documentos)
    case 'NATUREZA_VEICULO':
      return escolhida(no.opcoes, respostas.naturezaVeiculo) !== undefined
    case 'CLASSE_VEICULO':
      return escolhida(no.opcoes, respostas.classeVeiculo) !== undefined
    case 'DADOS_VEICULO':
      return no.exigidos.every((campo) => campoDoVeiculoPreenchido(campo, respostas.veiculo))
    case 'RESPONSAVEL': {
      const responsavel = respostas.responsavel
      return responsavel === SEM_RESPONSAVEL || pessoaPreenchida(responsavel, no.documentos)
    }
    case 'CONTATO':
      return preenchido(respostas.contato?.nome) && preenchido(respostas.contato?.whatsapp)
    case 'CONFERENCIA':
      /* A conferência não se "responde": confirmá-la **é** enviar, e quem decide se pode é `montarReserva`. */
      return false
    default:
      return casoImpossivel(no, 'respondido')
  }
}

function campoDoVeiculoPreenchido(campo: CampoDoVeiculo, veiculo: RascunhoDoVeiculo | undefined): boolean {
  switch (campo) {
    case 'PLACA':
      return preenchido(veiculo?.placa)
    case 'MODELO':
      return preenchido(veiculo?.modelo)
    case 'COR':
      return preenchido(veiculo?.cor)
    case 'CILINDRADA':
      return veiculo?.cilindrada !== undefined && veiculo.cilindrada > 0
    default:
      return casoImpossivel(campo, 'campoDoVeiculoPreenchido')
  }
}

type RespostasMutaveis = { -readonly [Chave in keyof RespostasDaReserva]: RespostasDaReserva[Chave] }

function sem(respostas: RespostasDaReserva, chave: keyof RespostasDaReserva): RespostasDaReserva {
  const copia: RespostasMutaveis = { ...respostas }
  delete copia[chave]
  return copia
}

/**
 * **As respostas sem a resposta deste nó** — o inverso exato de [respondido], ao lado dele de propósito:
 * um passo novo acrescentado a um e esquecido no outro faria o "voltar" apagar o campo errado. A chave é
 * **omitida**, não posta em `undefined`.
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
    case 'QUEM_VIAJA': {
      const passageiros = [...(respostas.passageiros ?? [])]
      if (no.pessoa >= passageiros.length) return respostas
      passageiros[no.pessoa] = undefined
      return { ...respostas, passageiros }
    }
    case 'NATUREZA_VEICULO':
      return sem(respostas, 'naturezaVeiculo')
    case 'CLASSE_VEICULO':
      return sem(respostas, 'classeVeiculo')
    case 'DADOS_VEICULO':
      return sem(respostas, 'veiculo')
    case 'RESPONSAVEL':
      return sem(respostas, 'responsavel')
    case 'CONTATO':
      return sem(respostas, 'contato')
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
