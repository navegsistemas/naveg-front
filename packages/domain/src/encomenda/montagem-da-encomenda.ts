/**
 * **A reserva de encomenda, e o caminho das respostas até ela.**
 *
 * `ReservaDeEncomenda` tem a mesma base da reserva de passagem — código, ocorrência, quem pediu, status, origem,
 * criação e validade — e o pedido da encomenda no lugar da passagem pedida. **Ainda não é um caso de `Reserva`**:
 * ela entra na união, no codec do documento e no pedido HTTP na entrega 6 do plano, junto com as regras do KMP.
 * Antes disso, o teste de contrato acusaria chaves que o `ReservaDocumento.kt` não conhece.
 *
 * A montagem segue a da passagem: lê **os nós que o roteiro devolveu** e só o que foi perguntado é resposta. O
 * destinatário que sobrou de um "Outra pessoa" desfeito não entra numa encomenda que o próprio remetente retira.
 */
import { codigoValido } from '../reserva/codigo-da-reserva.js'
import { normalizarWhatsapp, whatsappValido } from '../reserva/contato.js'
import type { IdentidadeDaReserva } from '../reserva/montagem-da-reserva.js'
import type { ClienteDaReserva, ReservaDePassageiro } from '../reserva/reserva.js'
import type { ContextoDaReserva, RascunhoDoCliente } from '../reserva/roteiro-da-reserva.js'
import { STATUS_DA_WEB } from '../reserva/status-reserva.js'
import { validadeDaReserva } from '../reserva/validade-da-reserva.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import { retiradaEmVigor, roteiroDaEncomenda, type NoDaEncomenda, type RespostasDaEncomenda } from './roteiro-da-encomenda.js'
import { LIMITE_DE_VOLUMES, LIMITE_DO_COMPLEMENTO, type FaixaPeso, type Retirada, type TipoVolume } from './volume.js'

/** Quem retira no destino, quando não é quem manda. Os dois campos são obrigatórios (C5). */
export interface DestinatarioDaEncomenda {
  readonly nome: string
  /** Celular em E.164 sem o `+`, como o do cliente. */
  readonly telefone: string
}

type BaseDaReserva = Omit<ReservaDePassageiro, 'categoria' | 'acomodacao' | 'tipo' | 'gratuidade' | 'quantidadePessoas'>

export interface ReservaDeEncomenda extends BaseDaReserva {
  readonly categoria: 'ENCOMENDA'
  readonly tipoVolume: TipoVolume
  readonly quantidadeVolumes: number
  readonly complemento?: string
  readonly faixaPeso: FaixaPeso
  readonly retirada: Retirada
  /** Presente **só** com `retirada: 'OUTRA_PESSOA'`, e obrigatório nesse caso — como a gratuidade e o tipo. */
  readonly destinatario?: DestinatarioDaEncomenda
}

export const PENDENCIAS_DA_ENCOMENDA = [
  'CODIGO',
  'CLIENTE_NOME',
  /** O celular de quem manda veio, e não é um celular. */
  'CLIENTE_TELEFONE',
  /** Quem manda retira, e não deixou o celular por onde o destino avisa. */
  'CLIENTE_TELEFONE_AUSENTE',
  'DESTINATARIO_AUSENTE',
  /** Destinatário numa encomenda que o próprio remetente retira — sobra de uma escolha desfeita. */
  'DESTINATARIO_INDEVIDO',
  'DESTINATARIO_NOME',
  'DESTINATARIO_TELEFONE',
  'VOLUMES',
  'COMPLEMENTO',
  'VALIDADE',
] as const

export type PendenciaDaEncomenda = (typeof PENDENCIAS_DA_ENCOMENDA)[number]

/** **Esta encomenda é coerente consigo mesma?** Vazio = sim. Como a da passagem, olha só para ela. */
export function pendenciasDaEncomenda(reserva: ReservaDeEncomenda): ReadonlySet<PendenciaDaEncomenda> {
  const pendencias = new Set<PendenciaDaEncomenda>()

  if (!codigoValido(reserva.codigo)) pendencias.add('CODIGO')
  if (reserva.cliente.nome.trim().length === 0) pendencias.add('CLIENTE_NOME')
  if (reserva.cliente.telefone !== undefined && !whatsappValido(reserva.cliente.telefone)) {
    pendencias.add('CLIENTE_TELEFONE')
  }
  if (reserva.expiraEm <= reserva.criadoEm) pendencias.add('VALIDADE')

  const { quantidadeVolumes } = reserva
  if (!Number.isInteger(quantidadeVolumes) || quantidadeVolumes < 1 || quantidadeVolumes > LIMITE_DE_VOLUMES) {
    pendencias.add('VOLUMES')
  }
  if (reserva.complemento !== undefined && reserva.complemento.length > LIMITE_DO_COMPLEMENTO) pendencias.add('COMPLEMENTO')

  switch (reserva.retirada) {
    case 'REMETENTE':
      if (reserva.cliente.telefone === undefined) pendencias.add('CLIENTE_TELEFONE_AUSENTE')
      if (reserva.destinatario !== undefined) pendencias.add('DESTINATARIO_INDEVIDO')
      break
    case 'OUTRA_PESSOA': {
      const { destinatario } = reserva
      if (destinatario === undefined) {
        pendencias.add('DESTINATARIO_AUSENTE')
        break
      }
      if (destinatario.nome.trim().length === 0) pendencias.add('DESTINATARIO_NOME')
      if (!whatsappValido(destinatario.telefone)) pendencias.add('DESTINATARIO_TELEFONE')
      break
    }
    default:
      casoImpossivel(reserva.retirada, 'pendenciasDaEncomenda')
  }

  return pendencias
}

export type ResultadoDaMontagemDaEncomenda =
  | { readonly caso: 'OK'; readonly reserva: ReservaDeEncomenda }
  /** O roteiro ainda não fechou; `faltando` é o nó em foco. */
  | { readonly caso: 'INCOMPLETA'; readonly faltando: NoDaEncomenda }
  | { readonly caso: 'INCOERENTE'; readonly pendencias: ReadonlySet<PendenciaDaEncomenda> }

function aparado(texto: string | undefined): string {
  return (texto ?? '').trim()
}

/** O telefone que não normaliza entra **como foi digitado**, e a pendência o aponta — como na passagem. */
function telefoneDe(bruto: string): string {
  return normalizarWhatsapp(bruto) ?? bruto
}

function montarCliente(rascunho: RascunhoDoCliente | undefined): ClienteDaReserva {
  const nome = aparado(rascunho?.nome)
  const telefone = aparado(rascunho?.telefone)
  return telefone.length === 0 ? { nome } : { nome, telefone: telefoneDe(telefone) }
}

/**
 * **Das respostas à reserva de encomenda.** Pura: o código e o instante vêm de fora, como na passagem.
 * `contexto` é o da travessia escolhida, o mesmo `TravessiaOfertada.contexto` que o totem de passagem usa.
 */
export function montarEncomenda(
  respostas: RespostasDaEncomenda,
  contexto: ContextoDaReserva,
  identidade: IdentidadeDaReserva,
): ResultadoDaMontagemDaEncomenda {
  const roteiro = roteiroDaEncomenda(respostas)
  if (!roteiro.prontoParaConferir && roteiro.atual !== null) return { caso: 'INCOMPLETA', faltando: roteiro.atual }

  const retirada = retiradaEmVigor(respostas)
  const { tipoVolume, quantidadeVolumes, faixaPeso } = respostas
  /* O roteiro fechou, então estes existem — é o compilador pedindo a prova. */
  if (retirada === undefined || tipoVolume === undefined || quantidadeVolumes === undefined || faixaPeso === undefined) {
    return { caso: 'INCOMPLETA', faltando: roteiro.nos[0] as NoDaEncomenda }
  }

  const complemento = aparado(respostas.complemento)
  const agenciaId = aparado(identidade.agenciaId)
  /* O destinatário entra **só se o nó dele estava no caminho**. */
  const comDestinatario = roteiro.nos.some((no) => no.passo === 'DESTINATARIO')
  const destinatario = comDestinatario
    ? { nome: aparado(respostas.destinatario?.nome), telefone: telefoneDe(aparado(respostas.destinatario?.telefone)) }
    : undefined

  const reserva: ReservaDeEncomenda = {
    codigo: identidade.codigo,
    ocorrencia: contexto.ocorrencia,
    cliente: montarCliente(respostas.cliente),
    status: STATUS_DA_WEB,
    origem: 'TOTEM_WEB',
    criadoEm: identidade.criadoEm,
    expiraEm: validadeDaReserva(contexto.partida),
    ...(agenciaId.length > 0 ? { agenciaId } : {}),
    categoria: 'ENCOMENDA',
    tipoVolume,
    quantidadeVolumes,
    ...(complemento.length > 0 ? { complemento } : {}),
    faixaPeso,
    retirada,
    ...(destinatario !== undefined ? { destinatario } : {}),
  }

  const pendencias = pendenciasDaEncomenda(reserva)
  return pendencias.size > 0 ? { caso: 'INCOERENTE', pendencias } : { caso: 'OK', reserva }
}
