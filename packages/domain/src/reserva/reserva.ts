/**
 * **A `Reserva`** — o tipo próprio do [ADR-0001](../../../../docs/adr/ADR-0001-a-reserva-como-tipo-proprio.md).
 *
 * *"A reserva é um pedido; a passagem é um fato."* Elas respondem a perguntas diferentes — a passagem
 * responde *"quem viajou, pagando quanto, emitida por quem"*; a reserva responde *"quem pediu, e o
 * atendimento já tratou?"* —, e um tipo que respondesse às duas seria ambíguo nas duas.
 *
 * ### Coerente por construção, como a `Passagem`
 *
 * Não existe reserva de passageiro sem ao menos um passageiro ([PassageirosDaReserva] é uma tupla **não
 * vazia**), não existe reserva sem contato, não existe reserva sem travessia. As pendências são as da
 * `PassagemDePassageiro.pendencias()` do aplicativo — excede ocupação, pessoa repetida, tipo não admitido,
 * gratuidade sem subtipo e subtipo sem gratuidade — mais as que só a reserva tem (o contato, a validade).
 *
 * ### Cada pessoa é um `Cliente` ainda sem id
 *
 * Na Fase 1 não há pool de clientes acessível ao público, e inventar um id criaria **referência quebrada**.
 * Então a reserva guarda o que a pessoa informou — e guarda **com os nomes do `Cliente`** do aplicativo
 * (`tipoDocumento`, `numeroDocumento`, `dataNascimento`) e na forma canônica que o `ClienteDocumento` grava.
 * Na conversão, o atendente não traduz nada: a [chaveNatural] de cada pessoa é o id do documento em
 * `clientes/{chaveNatural}`, e *"tentar criar aponta para o documento certo sem lê-lo"* — o pool se resolve
 * sozinho, do jeito que já se resolve no balcão.
 *
 * ### Por que a reserva não reserva assento
 *
 * Porque não pode: contar ocupação exige **ler** a coleção de passagens, e ler é o que as Rules devem negar ao
 * público. A reserva é um pedido registrado, e o aviso permanente no topo da seção do totem — *reserva, não
 * venda* — é a forma de isso não ser uma surpresa para quem a faz.
 */
import { Acomodacao } from '../passagem/acomodacao.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import type { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import type { TipoPassagem } from '../passagem/tipo-passagem.js'
import { TipoDocumento } from '../documento/tipo-documento.js'
import { InstanteLocal, type DataCalendario } from '../primitivos/calendario.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import type { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'
import { codigoValido } from './codigo-da-reserva.js'
import { whatsappValido } from './contato.js'
import type { StatusReserva } from './status-reserva.js'

/**
 * De onde o pedido veio. Um valor só, hoje — e ele existe porque é o que a Rule fixa
 * (`origem == 'TOTEM_WEB'`): um campo que a regra confere não é um campo vazio.
 */
export const ORIGENS_DA_RESERVA = ['TOTEM_WEB'] as const

export type OrigemDaReserva = (typeof ORIGENS_DA_RESERVA)[number]

/**
 * **Quem pediu, e por onde falar com ele.** É a razão de ser da Fase 1 — formar clientela —, e por isso é
 * obrigatório: uma reserva que o atendimento não consegue alcançar não é uma reserva, é um registro.
 */
export interface ContatoDaReserva {
  readonly nome: string
  /** E.164 **sem o `+`**: `55` + DDD + 9 dígitos. É a forma que o `wa.me` exige. */
  readonly whatsapp: string
}

/** Uma pessoa, com os campos e a forma canônica do `Cliente` do aplicativo. */
export interface PessoaDaReserva {
  readonly nome: string
  readonly tipoDocumento: TipoDocumento
  /** Forma canônica de `TipoDocumento.normalizar` — sem pontuação, como o `ClienteDocumento` grava. */
  readonly numeroDocumento: string
  readonly dataNascimento: DataCalendario
}

/** Quem viaja. É uma [PessoaDaReserva]; o nome existe para o leitor, não para o compilador. */
export type PassageiroDaReserva = PessoaDaReserva

/** Pelo menos uma pessoa. A tupla não vazia é o que torna "reserva sem sujeito" inexprimível. */
export type PassageirosDaReserva = readonly [PassageiroDaReserva, ...PassageiroDaReserva[]]

/**
 * **A chave natural do pool** — `TIPO:numero`, o `Cliente.chaveNatural` do aplicativo, caractere por
 * caractere. É o id do documento em `clientes/`, e é a identidade que decide "pessoa repetida".
 */
export function chaveNatural(pessoa: PessoaDaReserva): string {
  return `${pessoa.tipoDocumento}:${[...pessoa.numeroDocumento].filter((c) => /[\p{L}\p{Nd}]/u.test(c)).join('')}`
}

/**
 * A placa como o aplicativo a guarda: só letras e dígitos, em caixa alta. O `placaCanonica` do
 * `VeiculoDocumento` — e é o id do documento em `veiculos/{placa}`.
 */
export function placaCanonica(bruta: string | null | undefined): string {
  return [...(bruta ?? '')].filter((c) => /[\p{L}\p{Nd}]/u.test(c)).join('').toUpperCase()
}

/** O veículo, como o `Veiculo` do aplicativo: só a placa é obrigatória, e a cilindrada só na moto. */
export interface VeiculoDaReserva {
  /** Canônica — [placaCanonica]. */
  readonly placa: string
  /** Opcional sempre: quando falta, o bilhete mostra a classe (`Veiculo.descricao`). */
  readonly modelo?: string
  readonly cor?: string
  /** Só moto — `ClasseVeiculo.exigeCilindrada`. */
  readonly cilindrada?: number
}

interface ReservaBase {
  /** `NVG-XXXXXX`, e **é o id do documento** — ver `codigo-da-reserva.ts`. */
  readonly codigo: string
  readonly ocorrencia: OcorrenciaViagem
  readonly contato: ContatoDaReserva
  readonly status: StatusReserva
  readonly origem: OrigemDaReserva
  readonly criadoEm: InstanteLocal
  /** Até quando o pedido vale — hoje, a partida do navio. Ver `validade-da-reserva.ts`. */
  readonly expiraEm: InstanteLocal
  /** Preenchido pelo aplicativo na conversão, junto com o status `CONVERTIDA`. Nunca pela web. */
  readonly passagemId?: string
  /**
   * **Opcional, e a tensão é declarada.** O ADR-0001 diz que uma reserva pública *"não tem agência
   * atribuída"*; o plano lista `agenciaId` entre os campos de consulta. Os dois se conciliam assim: a
   * agência **não é escolhida por quem reserva** — quando existe, é uma constante da implantação. O codec a
   * preserva e **não a exige**.
   */
  readonly agenciaId?: string
  readonly observacao?: string
}

export interface ReservaDePassageiro extends ReservaBase {
  readonly categoria: 'PASSAGEIRO'
  readonly acomodacao: Acomodacao
  readonly tipo: TipoPassagem
  /** Presente **só** quando `tipo === 'GRATUIDADE'`, e obrigatório nesse caso. */
  readonly gratuidade?: TipoGratuidade
  readonly passageiros: PassageirosDaReserva
}

export interface ReservaDeVeiculo extends ReservaBase {
  readonly categoria: 'VEICULO'
  readonly classe: ClasseVeiculo
  readonly veiculo: VeiculoDaReserva
  /**
   * Quem retira — **uma pessoa com documento**, como o `DadosDoCliente(indice = 0, opcional = true)` do
   * roteiro do aplicativo. Ausente é a forma normal: bilhete de veículo sem ninguém nomeado.
   */
  readonly responsavel?: PessoaDaReserva
}

export type Reserva = ReservaDePassageiro | ReservaDeVeiculo

/**
 * **O que pode estar incoerente numa reserva** — nomeado, para quem chama apontar o campo certo.
 *
 * Os seis do meio são as `PassagemDePassageiro.Pendencia` do aplicativo com o vocabulário daqui:
 * `EXCEDE_OCUPACAO` → `OCUPACAO_EXCEDIDA`, `CLIENTE_REPETIDO` → `PASSAGEIRO_REPETIDO`, e assim por diante.
 */
export const PENDENCIAS_DA_RESERVA = [
  'CODIGO',
  'CONTATO_NOME',
  'CONTATO_WHATSAPP',
  'TIPO_NAO_ADMITIDO',
  'GRATUIDADE_AUSENTE',
  'GRATUIDADE_INDEVIDA',
  'OCUPACAO_EXCEDIDA',
  'PASSAGEIRO_REPETIDO',
  'PASSAGEIRO_INCOMPLETO',
  'DOCUMENTO_INVALIDO',
  'NASCIMENTO',
  'PLACA',
  'CILINDRADA',
  'VALIDADE',
  'CONVERSAO',
] as const

export type PendenciaDaReserva = (typeof PENDENCIAS_DA_RESERVA)[number]

/**
 * **Esta reserva é coerente consigo mesma?** Vazio = sim.
 *
 * O alcance é o do agregado: responde-se olhando **só para ela**. A cota de gratuidade, a lotação e a
 * existência da viagem dependem do mundo e são do aplicativo, na emissão.
 *
 * É esta função que o codec chama antes de devolver um domínio, e que a montagem chama antes de gravar.
 */
export function pendenciasDaReserva(reserva: Reserva): ReadonlySet<PendenciaDaReserva> {
  const pendencias = new Set<PendenciaDaReserva>()

  if (!codigoValido(reserva.codigo)) pendencias.add('CODIGO')
  if (reserva.contato.nome.trim().length === 0) pendencias.add('CONTATO_NOME')
  if (!whatsappValido(reserva.contato.whatsapp)) pendencias.add('CONTATO_WHATSAPP')
  /* Com a validade sendo a partida, isto é "o navio já partiu": a reserva nasceria expirada, a Rule a
     aceitaria, e ela não apareceria na lista de ninguém. */
  if (reserva.expiraEm <= reserva.criadoEm) pendencias.add('VALIDADE')
  /* A conversão grava as duas coisas juntas — o status e a passagem que nasceu. Uma sem a outra é uma
     conversão pela metade. */
  if ((reserva.status === 'CONVERTIDA') !== (reserva.passagemId !== undefined)) {
    pendencias.add('CONVERSAO')
  }

  switch (reserva.categoria) {
    case 'PASSAGEIRO':
      juntar(pendencias, pendenciasDePassageiros(reserva))
      break
    case 'VEICULO':
      juntar(pendencias, pendenciasDoVeiculo(reserva))
      break
    default:
      casoImpossivel(reserva, 'pendenciasDaReserva')
  }

  return pendencias
}

function juntar(destino: Set<PendenciaDaReserva>, origem: ReadonlySet<PendenciaDaReserva>): void {
  for (const pendencia of origem) destino.add(pendencia)
}

/** O que se confere de uma pessoa, seja passageiro, seja responsável pela retirada. */
function pendenciasDaPessoa(pessoa: PessoaDaReserva, criadoEm: InstanteLocal): ReadonlySet<PendenciaDaReserva> {
  const pendencias = new Set<PendenciaDaReserva>()
  if (pessoa.nome.trim().length === 0 || pessoa.numeroDocumento.trim().length === 0) {
    pendencias.add('PASSAGEIRO_INCOMPLETO')
  }
  /* *"Todo passageiro tem documento"* e *"o número tem de ser válido para o tipo"* (ADR-0018 D4, ADR-0020
     D2) — a mesma exigência do `Cliente`. */
  if (!TipoDocumento.validar(pessoa.tipoDocumento, pessoa.numeroDocumento)) pendencias.add('DOCUMENTO_INVALIDO')
  /* Ninguém nasce depois de pedir a própria passagem — é o ano corrente digitado no lugar do de
     nascimento, e a data passa em qualquer checagem de formato. */
  if (pessoa.dataNascimento > InstanteLocal.data(criadoEm)) pendencias.add('NASCIMENTO')
  return pendencias
}

function pendenciasDePassageiros(reserva: ReservaDePassageiro): ReadonlySet<PendenciaDaReserva> {
  const pendencias = new Set<PendenciaDaReserva>()

  if (!Acomodacao.admite(reserva.acomodacao, reserva.tipo)) pendencias.add('TIPO_NAO_ADMITIDO')
  if (reserva.tipo === 'GRATUIDADE' && reserva.gratuidade === undefined) pendencias.add('GRATUIDADE_AUSENTE')
  if (reserva.tipo !== 'GRATUIDADE' && reserva.gratuidade !== undefined) pendencias.add('GRATUIDADE_INDEVIDA')
  if (reserva.passageiros.length > Acomodacao.ocupacaoMaxima(reserva.acomodacao)) {
    pendencias.add('OCUPACAO_EXCEDIDA')
  }
  /* O `CLIENTE_REPETIDO` do aplicativo, pela mesma identidade que o pool usa. A mesma pessoa duas vezes
     numa suíte é um bilhete para três com dois embarcando. */
  const chaves = reserva.passageiros.map(chaveNatural)
  if (new Set(chaves).size !== chaves.length) pendencias.add('PASSAGEIRO_REPETIDO')

  for (const passageiro of reserva.passageiros) juntar(pendencias, pendenciasDaPessoa(passageiro, reserva.criadoEm))

  return pendencias
}

function pendenciasDoVeiculo(reserva: ReservaDeVeiculo): ReadonlySet<PendenciaDaReserva> {
  const pendencias = new Set<PendenciaDaReserva>()
  const { classe, veiculo } = reserva

  /* As duas pendências do `Veiculo` do aplicativo, e só elas: placa e, na moto, cilindrada. */
  if (veiculo.placa.trim().length === 0 || veiculo.placa !== placaCanonica(veiculo.placa)) pendencias.add('PLACA')
  if (ClasseVeiculo.exigeCilindrada(classe) && (veiculo.cilindrada === undefined || veiculo.cilindrada <= 0)) {
    pendencias.add('CILINDRADA')
  }
  if (reserva.responsavel !== undefined) juntar(pendencias, pendenciasDaPessoa(reserva.responsavel, reserva.criadoEm))

  return pendencias
}

export function reservaCoerente(reserva: Reserva): boolean {
  return pendenciasDaReserva(reserva).size === 0
}

/** Quantas pessoas o pedido cobre. Uma reserva de veículo cobre **zero** passageiros — leva um veículo. */
export function pessoasDaReserva(reserva: Reserva): number {
  return reserva.categoria === 'PASSAGEIRO' ? reserva.passageiros.length : 0
}

/**
 * A reserva já passou da validade **neste instante**? O instante entra por parâmetro — e é o relógio no
 * fuso da operação, não o do navegador (`InstanteLocal.emFuso`).
 */
export function reservaExpirada(reserva: Reserva, agora: InstanteLocal): boolean {
  return reserva.expiraEm <= agora
}
