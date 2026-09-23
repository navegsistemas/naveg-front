/**
 * **Os eventos da plataforma** — a coleção `eventos` do fluviapp, o canal entre as aplicações (ADR-0013 do
 * `fluviapp-kmp`). Quem quer reagir a uma mudança ouve `eventos`, e não precisa saber quem a fez.
 *
 * A fonte deste contrato é o `EventoDocumento.kt` e o `TipoDeEvento` do `fluviapp-kmp`, e a Rule de lá o
 * confere chave por chave: um nome divergente aqui não dá erro no código — dá `PERMISSION_DENIED` no lote
 * inteiro, e a reserva não é gravada.
 *
 * ### O evento anda com a mudança que narra
 *
 * A Rule exige os dois no mesmo lote, nos dois sentidos: a reserva não nasce sem o `reserva.criada`, e o
 * evento não passa se a reserva, depois do lote, não disser o que ele diz. Por isso [eventoDaReservaCriada]
 * deriva tudo da própria reserva — o instante é o `criadoEm` dela, a agência é a dela.
 *
 * ### Sem dado pessoal
 *
 * O evento conta, o documento prova: nem nome, nem telefone. `dados` leva só a aresta.
 */
import { casoImpossivel } from '../primitivos/fronteira.js'
import type { Reserva } from '../reserva/reserva.js'
import type { StatusReserva } from '../reserva/status-reserva.js'

/** Os tipos que a Rule aceita — a lista fechada de `paraDoTipo`, em `firestore.rules` do fluviapp-kmp. */
export const TIPOS_DE_EVENTO = ['reserva.criada', 'reserva.cancelada', 'reserva.convertida'] as const
export type TipoDeEvento = (typeof TIPOS_DE_EVENTO)[number]

/** Quem escreveu. A API escreve `api-agencia`; o painel do fluviapp, `centralizador`. */
export const ORIGENS_DO_EVENTO = ['centralizador', 'api-agencia'] as const
export type OrigemDoEvento = (typeof ORIGENS_DO_EVENTO)[number]

/** As arestas da reserva são `INFO`. `AVISO` e `ERRO` estão previstos, e a Rule ainda não os aceita. */
export const SEVERIDADES = ['INFO', 'AVISO', 'ERRO'] as const
export type Severidade = (typeof SEVERIDADES)[number]

/** A forma gravada — **toda chave sempre presente**, e o vazio é `''` (a Rule compara, e `null` não é `''`). */
export interface EventoDocumento {
  readonly tipo: TipoDeEvento
  readonly entidade: { readonly colecao: 'reservas'; readonly id: string }
  /** A agência da reserva narrada; `''` quando ela não tem. */
  readonly agenciaId: string
  readonly origem: OrigemDoEvento
  readonly severidade: Severidade
  /** O `uid` de quem escreveu — a Rule exige que seja o autenticado. */
  readonly porId: string
  /** ISO `yyyy-MM-ddTHH:mm:ss`, no fuso da operação. */
  readonly em: string
  readonly dados: { readonly de: StatusReserva | ''; readonly para: StatusReserva }
}

/** As chaves, na ordem do `EventoDocumento.kt`. `satisfies` faz esquecer uma virar erro de compilação. */
export const CAMPOS_DO_EVENTO = [
  'tipo',
  'entidade',
  'agenciaId',
  'origem',
  'severidade',
  'porId',
  'em',
  'dados',
] as const satisfies readonly (keyof EventoDocumento)[]

type ChavesNaoListadas = Exclude<keyof EventoDocumento, (typeof CAMPOS_DO_EVENTO)[number]>
const _todasAsChavesListadas: ChavesNaoListadas extends never ? true : never = true
void _todasAsChavesListadas

/** O estado em que a reserva tem de estar **depois** do lote — é o que a Rule confere com `getAfter`. */
export function paraDoTipo(tipo: TipoDeEvento): StatusReserva {
  switch (tipo) {
    case 'reserva.criada':
      return 'RESERVADA'
    case 'reserva.cancelada':
      return 'CANCELADA'
    case 'reserva.convertida':
      return 'CONVERTIDA'
    default:
      return casoImpossivel(tipo, 'paraDoTipo')
  }
}

/**
 * **O id é `{tipo}:{id da entidade}`** — `reserva.criada:NVG-7K3QP2`. É o que deixa a Rule exigir o evento
 * pelo nome, e o que torna a narração idempotente: a mesma aresta não se conta duas vezes.
 */
export function idDoEvento(tipo: TipoDeEvento, entidadeId: string): string {
  return `${tipo}:${entidadeId}`
}

/**
 * O `reserva.criada` que acompanha a gravação da reserva. [porId] é o `uid` com que a API está autenticada
 * — o do token de serviço.
 */
export function eventoDaReservaCriada(reserva: Reserva, porId: string): EventoDocumento {
  return {
    tipo: 'reserva.criada',
    entidade: { colecao: 'reservas', id: reserva.codigo },
    agenciaId: reserva.agenciaId ?? '',
    origem: 'api-agencia',
    severidade: 'INFO',
    porId,
    em: reserva.criadoEm,
    dados: { de: '', para: paraDoTipo('reserva.criada') },
  }
}
