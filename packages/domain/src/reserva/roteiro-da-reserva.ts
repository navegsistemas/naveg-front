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
 * | `CLIENTE` | — | **antes da conferência** | nome e celular: quem pediu. O celular é opcional só no quiosque (2.3) |
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
import { PorteDoVeiculo } from '../passagem/porte-do-veiculo.js'
import type { RespostasDaEncomenda } from '../encomenda/roteiro-da-encomenda.js'
import { FaixaPeso, LIMITE_DE_VOLUMES, TipoVolume } from '../encomenda/volume.js'
import { OQueEmbarca } from './o-que-embarca.js'
import { LIMITE_DE_PESSOAS_DA_RESERVA } from './reserva.js'

/**
 * Um **nó do roteiro**: a pergunta, e o que ela oferece como resposta. As opções vêm **no nó** — um seletor
 * que recebe `opcoes` não tem como oferecer "meia numa suíte", porque a opção não chegou.
 */
export type NoDoRoteiro =
  | { readonly passo: 'CATEGORIA'; readonly opcoes: readonly CategoriaPassagem[] }
  /** Só no site: a primeira pergunta, antes do dia (naveg-front#66). */
  | { readonly passo: 'EMBARQUE'; readonly opcoes: readonly OQueEmbarca[] }
  /** Só no site: "Leve ou pesado?", antes de "Qual?". */
  | { readonly passo: 'PORTE_DO_VEICULO'; readonly opcoes: readonly PorteDoVeiculo[] }
  | { readonly passo: 'ACOMODACAO'; readonly opcoes: readonly Acomodacao[] }
  | { readonly passo: 'TIPO_TARIFARIO'; readonly opcoes: readonly TipoPassagem[] }
  | { readonly passo: 'TIPO_GRATUIDADE'; readonly opcoes: readonly TipoGratuidade[] }
  | { readonly passo: 'QUANTIDADE_PESSOAS'; readonly opcoes: readonly number[] }
  | { readonly passo: 'NATUREZA_VEICULO'; readonly opcoes: readonly NaturezaVeiculo[] }
  /** No quiosque, as classes da natureza neste casco; no site, as do porte, antes de o dia ser escolhido. */
  | {
      readonly passo: 'CLASSE_VEICULO'
      readonly natureza?: NaturezaVeiculo
      readonly porte?: PorteDoVeiculo
      readonly opcoes: readonly ClasseVeiculo[]
    }
  /** Só para a classe que a exige — hoje, a moto. */
  | { readonly passo: 'CILINDRADA'; readonly classe: ClasseVeiculo }
  /** Só no site, a encomenda (2.7): o tipo do volume, com "O que é" opcional na mesma tela. */
  | { readonly passo: 'TIPO_VOLUME'; readonly opcoes: readonly TipoVolume[] }
  /** Só no site, a encomenda: de 1 a 20 volumes. */
  | { readonly passo: 'QUANTIDADE_VOLUMES'; readonly opcoes: readonly number[] }
  /** Só no site, a encomenda: a estimativa do peso. */
  | { readonly passo: 'FAIXA_PESO'; readonly opcoes: readonly FaixaPeso[] }
  /**
   * Nome obrigatório; telefone opcional — ver `ClienteDaReserva`. Obrigatório na encomenda (2.7, decisão F): é por ele
   * que o atendimento fala com quem manda.
   */
  | { readonly passo: 'CLIENTE'; readonly telefoneObrigatorio?: boolean }
  /** Só no site, a encomenda: quem recebe no destino, **opcional**, depois de quem manda (PO, 2026-10-15). */
  | { readonly passo: 'DESTINATARIO' }
  | { readonly passo: 'CONFERENCIA' }

export type PassoDaReserva = NoDoRoteiro['passo']

/** Quem pede, enquanto se digita. O telefone aceita qualquer grafia; a montagem normaliza. */
export interface RascunhoDoCliente {
  readonly nome?: string
  readonly telefone?: string
}

/**
 * **Por onde o pedido vem**, e com isso que perguntas ele faz (naveg-front#65):
 *
 * - `'SITE'`: a página. Não pergunta o tipo da passagem — "quem é guardião dessas regras do negócio é o
 *   atendente" (PO, 2026-10-14) — e pergunta quantos viajam antes da acomodação, de 1 a 50, sem teto por ela;
 * - `'QUIOSQUE'`: o `/totem`, que não muda (PO, 2026-10-14): a acomodação, o tipo e a quantidade que cabe nela.
 *
 * Ausente é o quiosque: é o caminho de antes, e é o que um site antigo manda.
 */
export const CANAIS_DA_RESERVA = ['SITE', 'QUIOSQUE'] as const

export type CanalDaReserva = (typeof CANAIS_DA_RESERVA)[number]

/** **As respostas da reserva em curso.** Tudo opcional, por definição. */
export interface RespostasDaReserva {
  /**
   * Não é uma pergunta: quem desenha o roteiro o fixa no começo, e nenhum nó o apaga. Mora nas respostas porque é
   * com elas que a API remonta a reserva — e tem de remontar pelo mesmo caminho.
   */
  readonly canal?: CanalDaReserva
  /** Só no site (naveg-front#66). No quiosque, quem diz o que embarca é a `categoria`. */
  readonly embarque?: OQueEmbarca
  /** Só no site: leve ou pesado. Ausente, vale o porte da `classeVeiculo`, se houver — é o que um site antigo manda. */
  readonly porteVeiculo?: PorteDoVeiculo
  readonly categoria?: CategoriaPassagem
  readonly acomodacao?: Acomodacao
  readonly tipo?: TipoPassagem
  readonly gratuidade?: TipoGratuidade
  readonly quantidadePessoas?: number
  /** Campo próprio, como no `VeiculoEmEdicao`: existe o estado "natureza escolhida, classe ainda não". */
  readonly naturezaVeiculo?: NaturezaVeiculo
  readonly classeVeiculo?: ClasseVeiculo
  readonly cilindrada?: number
  // --- só a encomenda do site (2.7) ---
  readonly tipoVolume?: TipoVolume
  readonly complemento?: string
  readonly quantidadeVolumes?: number
  readonly faixaPeso?: FaixaPeso
  /** Quem recebe no destino, se quem manda quiser dizer. Com ele, a reserva vai como "outra pessoa retira". */
  readonly destinatario?: RascunhoDoCliente
  /** "Pular" o destinatário é uma resposta: o nó fica respondido sem ele. */
  readonly semDestinatario?: boolean
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

function peloSite(respostas: RespostasDaReserva): boolean {
  return respostas.canal === 'SITE'
}

/** No site, quantos viajam: de 1 a 50, sem teto pela acomodação — o atendimento divide o grupo. */
const PESSOAS_DO_SITE = faixa(LIMITE_DE_PESSOAS_DA_RESERVA)

/**
 * **O tipo tarifário em vigor**: sem escolha, o único permitido; com escolha, a resposta se admitida. No site, nenhum:
 * o tipo é definido no atendimento.
 */
export function tipoEmVigor(respostas: RespostasDaReserva, acomodacao: Acomodacao): TipoPassagem | undefined {
  if (peloSite(respostas)) return undefined
  const permitidos = Acomodacao.tiposPermitidos(acomodacao)
  return Acomodacao.temEscolhaDeTipo(acomodacao) ? escolhida(permitidos, respostas.tipo) : permitidos[0]
}

/**
 * **Quantas pessoas a reserva pede.** No quiosque, as que o bilhete cobre: sem escolha (rede), uma; com escolha, a
 * resposta se estiver na faixa. No site, a resposta de 1 a 50. E `undefined` enquanto não houver, porque aqui a
 * quantidade **vai para a reserva**, e não se inventa.
 */
export function pessoasEmVigor(respostas: RespostasDaReserva, acomodacao: Acomodacao): number | undefined {
  if (peloSite(respostas)) return escolhida(PESSOAS_DO_SITE, respostas.quantidadePessoas)
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

// ---------------------------------------------------------------------------------------------------------
// O site: o que vai embarcar, antes do dia (naveg-front#66)
// ---------------------------------------------------------------------------------------------------------

/**
 * **O que vai embarcar, em vigor.** A resposta, se é uma das três; sem ela, a `categoria` que o site da #65 mandava
 * (passageiro ou veículo) — é o que mantém a página antiga reservando enquanto a nova não sai.
 */
export function embarqueEmVigor(respostas: RespostasDaReserva): OQueEmbarca | undefined {
  const escolhido = escolhida(OQueEmbarca.valores, respostas.embarque)
  if (escolhido !== undefined) return escolhido
  if (respostas.categoria === 'PASSAGEIRO') return 'PASSAGEIROS'
  if (respostas.categoria === 'VEICULO') return 'VEICULO'
  return undefined
}

/** **Leve ou pesado, em vigor.** A resposta; sem ela, o porte da classe escolhida, se houver. */
export function porteEmVigor(respostas: RespostasDaReserva): PorteDoVeiculo | undefined {
  const escolhido = escolhida(PorteDoVeiculo.valores, respostas.porteVeiculo)
  if (escolhido !== undefined) return escolhido
  return respostas.classeVeiculo === undefined ? undefined : PorteDoVeiculo.daClasse(respostas.classeVeiculo)
}

/** **A classe, no site**: a resposta, se está entre as do porte. Antes do dia, não se sabe o casco. */
export function classeDoEmbarque(respostas: RespostasDaReserva): ClasseVeiculo | undefined {
  const porte = porteEmVigor(respostas)
  return porte === undefined ? undefined : escolhida(PorteDoVeiculo.classes(porte), respostas.classeVeiculo)
}

/**
 * **As perguntas do que vai embarcar**, no site. Vêm antes do dia, e por isso não dependem do casco: o veículo é
 * "Leve ou pesado?", "Qual?" e, na moto, a cilindrada; as pessoas, "Quantos viajam?" (1 a 50) e a acomodação do
 * grupo, sem o tipo (UI 2.2, decisões H a K). Com os dois, o veículo vem primeiro.
 */
export function nosDoEmbarque(respostas: RespostasDaReserva): readonly NoDoRoteiro[] {
  const nos: NoDoRoteiro[] = [{ passo: 'EMBARQUE', opcoes: OQueEmbarca.valores }]
  const embarque = embarqueEmVigor(respostas)
  if (embarque === undefined) return nos

  if (OQueEmbarca.levaVeiculo(embarque)) {
    nos.push({ passo: 'PORTE_DO_VEICULO', opcoes: PorteDoVeiculo.valores })
    const porte = porteEmVigor(respostas)
    if (porte !== undefined) {
      nos.push({ passo: 'CLASSE_VEICULO', porte, opcoes: PorteDoVeiculo.classes(porte) })
      const classe = classeDoEmbarque(respostas)
      if (classe !== undefined && ClasseVeiculo.exigeCilindrada(classe)) nos.push({ passo: 'CILINDRADA', classe })
    }
  }
  if (OQueEmbarca.levaPessoas(embarque)) {
    nos.push({ passo: 'QUANTIDADE_PESSOAS', opcoes: PESSOAS_DO_SITE }, { passo: 'ACOMODACAO', opcoes: Acomodacao.valores })
  }
  /* A encomenda (2.7, decisão D): o tipo, quantos volumes e o peso, uma pergunta por tela. */
  if (OQueEmbarca.eEncomenda(embarque)) {
    nos.push(
      { passo: 'TIPO_VOLUME', opcoes: TipoVolume.valores },
      { passo: 'QUANTIDADE_VOLUMES', opcoes: VOLUMES_DO_SITE },
      { passo: 'FAIXA_PESO', opcoes: FaixaPeso.valores },
    )
  }
  return nos
}

/** De 1 a 20 volumes — o limite da encomenda pela reserva. Mais do que isso é carga, e conversa. */
const VOLUMES_DO_SITE = faixa(LIMITE_DE_VOLUMES)

/** A reserva do site é de encomenda: ela vai à API como pedido de encomenda, com o alcance de 7 dias. */
export function encomendaPeloSite(respostas: RespostasDaReserva): boolean {
  const embarque = peloSite(respostas) ? embarqueEmVigor(respostas) : undefined
  return embarque !== undefined && OQueEmbarca.eEncomenda(embarque)
}

/**
 * **As respostas da encomenda do site, na forma do pedido de encomenda.** A página pergunta tudo no roteiro da
 * reserva; o que vai à API, e o que se monta, é a encomenda de sempre (`montarEncomenda`). O destinatário entra só se
 * foi informado e não pulado; sem ele, sem a retirada — o atendimento combina (naveg-front#58).
 */
export function respostasDaEncomendaDoSite(respostas: RespostasDaReserva): RespostasDaEncomenda {
  const { tipoVolume, quantidadeVolumes, complemento, faixaPeso, cliente, destinatario } = respostas
  return {
    ...(tipoVolume !== undefined ? { tipoVolume } : {}),
    ...(quantidadeVolumes !== undefined ? { quantidadeVolumes } : {}),
    ...(complemento !== undefined && complemento.trim().length > 0 ? { complemento } : {}),
    ...(faixaPeso !== undefined ? { faixaPeso } : {}),
    ...(cliente !== undefined ? { cliente } : {}),
    ...(destinatario !== undefined && respostas.semDestinatario !== true ? { destinatario } : {}),
  }
}

/** O que vai embarcar está todo respondido — e a página pode mostrar o calendário. */
export function embarqueRespondido(respostas: RespostasDaReserva): boolean {
  return nosDoEmbarque(respostas).every((no) => respondido(no, respostas))
}

/**
 * **Esta embarcação leva o que vai embarcar?** Passageiros, toda embarcação leva. O veículo, só o casco que admite a
 * classe: a lancha não leva veículo, e o navio só leva carro e moto. É o filtro do calendário do site, e a montagem o
 * confere de novo — a saída escolhida pode não ter vindo do calendário.
 */
export function embarcacaoLeva(respostas: RespostasDaReserva, tipoEmbarcacao: TipoEmbarcacao): boolean {
  const embarque = embarqueEmVigor(respostas)
  if (embarque === undefined || !OQueEmbarca.levaVeiculo(embarque)) return true
  const classe = classeDoEmbarque(respostas)
  return classe !== undefined && classesOfertadas(ClasseVeiculo.natureza(classe), tipoEmbarcacao).includes(classe)
}

// ---------------------------------------------------------------------------------------------------------
// O quiosque
// ---------------------------------------------------------------------------------------------------------

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
  const nos: NoDoRoteiro[] = []
  /* No site, o que vai embarcar vem antes do dia, e não depende do casco; quem confere o casco é a montagem. */
  const categorias = categoriasOfertadas(contexto.tipoEmbarcacao)
  if (peloSite(respostas)) nos.push(...nosDoEmbarque(respostas))
  else nos.push({ passo: 'CATEGORIA', opcoes: categorias })

  const categoria = peloSite(respostas) ? undefined : escolhida(categorias, respostas.categoria)
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
  /* Na encomenda do site, o celular de quem manda é obrigatório (2.7, F), e o destinatário vem depois, opcional. */
  if (encomendaPeloSite(respostas)) {
    nos.push({ passo: 'CLIENTE', telefoneObrigatorio: true }, { passo: 'DESTINATARIO' }, { passo: 'CONFERENCIA' })
  } else if (peloSite(respostas)) {
    /* Na passagem e no veículo do site também (2.3, A, PO, 2026-10-16): é pelo WhatsApp desse celular que o atendimento
       confirma a reserva. O quiosque segue opcional. */
    nos.push({ passo: 'CLIENTE', telefoneObrigatorio: true }, { passo: 'CONFERENCIA' })
  } else {
    nos.push({ passo: 'CLIENTE' }, { passo: 'CONFERENCIA' })
  }

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
    case 'EMBARQUE':
      return embarqueEmVigor(respostas) !== undefined
    case 'PORTE_DO_VEICULO':
      return porteEmVigor(respostas) !== undefined
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
      /* O telefone é opcional — a não ser na encomenda —: o nó se responde com o nome. */
      return preenchido(respostas.cliente?.nome) && (no.telefoneObrigatorio !== true || preenchido(respostas.cliente?.telefone))
    case 'TIPO_VOLUME':
      return escolhida(no.opcoes, respostas.tipoVolume) !== undefined
    case 'QUANTIDADE_VOLUMES':
      return escolhida(no.opcoes, respostas.quantidadeVolumes) !== undefined
    case 'FAIXA_PESO':
      return escolhida(no.opcoes, respostas.faixaPeso) !== undefined
    case 'DESTINATARIO':
      /* Opcional: pular é responder. Informado, são os dois campos. */
      return (
        respostas.semDestinatario === true ||
        (preenchido(respostas.destinatario?.nome) && preenchido(respostas.destinatario?.telefone))
      )
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
    /* Os dois que se derivam de outra resposta levam a outra junto: senão o nó continuaria respondido. */
    case 'EMBARQUE':
      return sem(sem(respostas, 'embarque'), 'categoria')
    case 'PORTE_DO_VEICULO':
      return sem(sem(respostas, 'porteVeiculo'), 'classeVeiculo')
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
    /* O tipo leva o "O que é" junto: os dois se respondem na mesma tela. */
    case 'TIPO_VOLUME':
      return sem(sem(respostas, 'tipoVolume'), 'complemento')
    case 'QUANTIDADE_VOLUMES':
      return sem(respostas, 'quantidadeVolumes')
    case 'FAIXA_PESO':
      return sem(respostas, 'faixaPeso')
    case 'DESTINATARIO':
      return sem(sem(respostas, 'destinatario'), 'semDestinatario')
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
