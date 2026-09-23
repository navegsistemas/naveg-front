/**
 * **A `Reserva`** — o tipo próprio do [ADR-0001](../../../../docs/adr/ADR-0001-a-reserva-como-tipo-proprio.md).
 *
 * *"A reserva é um pedido; a passagem é um fato."* A passagem responde *"quem viajou, pagando quanto,
 * emitida por quem"*; a reserva responde *"o que foi pedido, por quem, e o atendimento já tratou?"*.
 *
 * ### O que a reserva guarda: a passagem pedida e quem pediu — e nada que identifique
 *
 * Decisão do analista (2026-09-22): **o totem não exige documento.** Ele recolhe as informações da passagem
 * — a travessia, a categoria, a acomodação, o tipo tarifário, quantas pessoas, a classe do veículo — e o
 * **cliente**, com nome e um contato **opcional**. A finalização leva ao atendimento pessoal pelo WhatsApp, e
 * é **lá** que documento, nascimento e placa são recolhidos e conferidos, na emissão, como o balcão já faz.
 * Autenticação e cadastro ficam para a Fase 2.
 *
 * Duas consequências que valem mais do que a simplicidade:
 *
 * - **o totem trata o mínimo de dado pessoal** (LGPD): um nome e, se a pessoa quiser, um telefone. Nenhum
 *   identificador — nada que, vazado, sirva para abrir conta em nome de alguém;
 * - **a reserva não tem como estar errada sobre quem viaja**, porque não afirma quem viaja. Documento digitado
 *   num terminal público, sem ninguém para conferir, é o dado mais propenso a erro do sistema; ele passa a ser
 *   recolhido por quem pode conferir.
 *
 * ### Coerente por construção, como a `Passagem`
 *
 * As pendências que sobram são as da `PassagemDePassageiro.pendencias()` do aplicativo que não dependem de
 * pessoa — excede ocupação, tipo não admitido, gratuidade sem subtipo e subtipo sem gratuidade — mais as que
 * só a reserva tem (o cliente, a validade, a conversão).
 *
 * ### Por que a reserva não reserva assento
 *
 * Contar ocupação exige **ler** a coleção de passagens, e ler é o que o público não faz. A reserva é um pedido
 * registrado — *reserva, não venda* —, e vale até o navio partir.
 */
import { Acomodacao } from '../passagem/acomodacao.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import type { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import type { TipoPassagem } from '../passagem/tipo-passagem.js'
import type { InstanteLocal } from '../primitivos/calendario.js'
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
 * **Quem pediu.** O nome é obrigatório — é como o atendente chama a pessoa quando a conversa abre. O telefone
 * é **opcional**: a finalização redireciona para o WhatsApp, e a conversa já chega com o número de quem a
 * iniciou. Quando informado, ele serve para o atendimento procurar quem não chegou a mandar a mensagem.
 *
 * Os nomes das chaves são os do `Cliente` do aplicativo (`nome`, `telefone`), para que a emissão possa
 * pré-preencher o cadastro sem tradução.
 */
export interface ClienteDaReserva {
  readonly nome: string
  /** Celular em E.164 **sem o `+`** (`55` + DDD + 9 dígitos) — o atendimento é pelo WhatsApp. */
  readonly telefone?: string
}

interface ReservaBase {
  /** `NVG-XXXXXX`, e **é o id do documento** — ver `codigo-da-reserva.ts`. */
  readonly codigo: string
  readonly ocorrencia: OcorrenciaViagem
  readonly cliente: ClienteDaReserva
  readonly status: StatusReserva
  readonly origem: OrigemDaReserva
  readonly criadoEm: InstanteLocal
  /** Até quando o pedido vale — hoje, a partida do navio. Ver `validade-da-reserva.ts`. */
  readonly expiraEm: InstanteLocal
  /** Preenchido pelo aplicativo na conversão, junto com o status `CONVERTIDA`. Nunca pela web. */
  readonly passagemId?: string
  /**
   * **Opcional, e a tensão é declarada.** O ADR-0001 diz que uma reserva pública *"não tem agência
   * atribuída"*; o plano lista `agenciaId` entre os campos de consulta. A agência **não é escolhida por
   * quem reserva** — quando existe, é uma constante da implantação. O codec a preserva e **não a exige**.
   */
  readonly agenciaId?: string
  readonly observacao?: string
  /**
   * Quem cancelou ou converteu, e quando — **gravado pelo fluviapp**, nunca pela web. Ausente enquanto
   * ninguém tratou. É o carimbo `{porId, em}` do ADR-0011 do `fluviapp-kmp`.
   */
  readonly tratamento?: Tratamento
}

/**
 * O carimbo de quem tratou a reserva: o `uid` de quem cancelou ou converteu, e o instante. Autoria e
 * instante andam juntos — pela metade, o codec o lê como ausente.
 */
export interface Tratamento {
  readonly porId: string
  readonly em: InstanteLocal
}

export interface ReservaDePassageiro extends ReservaBase {
  readonly categoria: 'PASSAGEIRO'
  readonly acomodacao: Acomodacao
  readonly tipo: TipoPassagem
  /** Presente **só** quando `tipo === 'GRATUIDADE'`, e obrigatório nesse caso. */
  readonly gratuidade?: TipoGratuidade
  /** Quantas pessoas o bilhete cobre — 1 na rede, 1 a 3 em suíte e camarote. */
  readonly quantidadePessoas: number
}

export interface ReservaDeVeiculo extends ReservaBase {
  readonly categoria: 'VEICULO'
  readonly classe: ClasseVeiculo
  /**
   * Só a moto: é o que decide a faixa de tarifa, e por isso é informação **da passagem**, não do veículo. A
   * placa, o modelo e a cor são identificação — recolhidos no atendimento, como o documento das pessoas.
   */
  readonly cilindrada?: number
}

export type Reserva = ReservaDePassageiro | ReservaDeVeiculo

/** O que pode estar incoerente numa reserva — nomeado, para quem chama apontar o campo certo. */
export const PENDENCIAS_DA_RESERVA = [
  'CODIGO',
  'CLIENTE_NOME',
  'CLIENTE_TELEFONE',
  'TIPO_NAO_ADMITIDO',
  'GRATUIDADE_AUSENTE',
  'GRATUIDADE_INDEVIDA',
  'QUANTIDADE',
  'CILINDRADA',
  'VALIDADE',
  'CONVERSAO',
] as const

export type PendenciaDaReserva = (typeof PENDENCIAS_DA_RESERVA)[number]

/**
 * **Esta reserva é coerente consigo mesma?** Vazio = sim. Olha só para ela: a cota de gratuidade, a lotação
 * e a existência da viagem dependem do mundo e são do aplicativo, na emissão.
 *
 * É esta função que o codec chama antes de devolver um domínio, e que a montagem chama antes de gravar.
 */
export function pendenciasDaReserva(reserva: Reserva): ReadonlySet<PendenciaDaReserva> {
  const pendencias = new Set<PendenciaDaReserva>()

  if (!codigoValido(reserva.codigo)) pendencias.add('CODIGO')
  if (reserva.cliente.nome.trim().length === 0) pendencias.add('CLIENTE_NOME')
  /* Opcional, mas se veio, é um celular de verdade: número errado não dá erro em lugar nenhum — dá um
     atendente ligando para ninguém. */
  if (reserva.cliente.telefone !== undefined && !whatsappValido(reserva.cliente.telefone)) {
    pendencias.add('CLIENTE_TELEFONE')
  }
  /* Com a validade sendo a partida, isto é "o navio já partiu". */
  if (reserva.expiraEm <= reserva.criadoEm) pendencias.add('VALIDADE')
  /* A conversão grava as duas coisas juntas — o status e a passagem que nasceu. */
  if ((reserva.status === 'CONVERTIDA') !== (reserva.passagemId !== undefined)) pendencias.add('CONVERSAO')

  switch (reserva.categoria) {
    case 'PASSAGEIRO': {
      if (!Acomodacao.admite(reserva.acomodacao, reserva.tipo)) pendencias.add('TIPO_NAO_ADMITIDO')
      if (reserva.tipo === 'GRATUIDADE' && reserva.gratuidade === undefined) pendencias.add('GRATUIDADE_AUSENTE')
      if (reserva.tipo !== 'GRATUIDADE' && reserva.gratuidade !== undefined) pendencias.add('GRATUIDADE_INDEVIDA')
      const { quantidadePessoas } = reserva
      if (
        !Number.isInteger(quantidadePessoas) ||
        quantidadePessoas < 1 ||
        quantidadePessoas > Acomodacao.ocupacaoMaxima(reserva.acomodacao)
      ) {
        pendencias.add('QUANTIDADE')
      }
      break
    }
    case 'VEICULO': {
      const { cilindrada } = reserva
      const exige = ClasseVeiculo.exigeCilindrada(reserva.classe)
      if (exige && (cilindrada === undefined || !Number.isInteger(cilindrada) || cilindrada <= 0)) {
        pendencias.add('CILINDRADA')
      }
      /* Cilindrada pendurada num carro é sobra de uma escolha desfeita — como o subtipo sem gratuidade. */
      if (!exige && cilindrada !== undefined) pendencias.add('CILINDRADA')
      break
    }
    default:
      casoImpossivel(reserva, 'pendenciasDaReserva')
  }

  return pendencias
}

export function reservaCoerente(reserva: Reserva): boolean {
  return pendenciasDaReserva(reserva).size === 0
}

/** Quantas pessoas o pedido cobre. Uma reserva de veículo cobre **zero** passageiros — leva um veículo. */
export function pessoasDaReserva(reserva: Reserva): number {
  return reserva.categoria === 'PASSAGEIRO' ? reserva.quantidadePessoas : 0
}

/**
 * A reserva já passou da validade **neste instante**? O instante entra por parâmetro — e é o relógio no fuso
 * da operação, não o do navegador (`InstanteLocal.emFuso`).
 */
export function reservaExpirada(reserva: Reserva, agora: InstanteLocal): boolean {
  return reserva.expiraEm <= agora
}
