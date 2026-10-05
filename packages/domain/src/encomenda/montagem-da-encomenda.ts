/**
 * **Das respostas à reserva de encomenda** — o caminho, e ele só se abre quando o roteiro fecha.
 *
 * A `ReservaDeEncomenda` é um caso da `Reserva` (`reserva/reserva.ts`), com a mesma base da de passagem — código,
 * ocorrência, quem pediu, status, origem, criação e validade — e o pedido de envio no lugar da passagem pedida.
 * As pendências são as do `pendenciasDaReserva`, como no KMP.
 *
 * A montagem segue a da passagem: lê **os nós que o roteiro devolveu** e só o que foi perguntado é resposta. O
 * destinatário que sobrou de um "Outra pessoa" desfeito não entra numa encomenda que o próprio remetente retira.
 */
import { normalizarWhatsapp } from '../reserva/contato.js'
import type { IdentidadeDaReserva } from '../reserva/montagem-da-reserva.js'
import {
  pendenciasDaReserva,
  type ClienteDaReserva,
  type PendenciaDaReserva,
  type ReservaDeEncomenda,
} from '../reserva/reserva.js'
import type { ContextoDaReserva, RascunhoDoCliente } from '../reserva/roteiro-da-reserva.js'
import { STATUS_DA_WEB } from '../reserva/status-reserva.js'
import { validadeDaReserva } from '../reserva/validade-da-reserva.js'
import { retiradaEmVigor, roteiroDaEncomenda, type NoDaEncomenda, type RespostasDaEncomenda } from './roteiro-da-encomenda.js'

export type ResultadoDaMontagemDaEncomenda =
  | { readonly caso: 'OK'; readonly reserva: ReservaDeEncomenda }
  /** O roteiro ainda não fechou; `faltando` é o nó em foco. */
  | { readonly caso: 'INCOMPLETA'; readonly faltando: NoDaEncomenda }
  | { readonly caso: 'INCOERENTE'; readonly pendencias: ReadonlySet<PendenciaDaReserva> }

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

  const pendencias = pendenciasDaReserva(reserva)
  return pendencias.size > 0 ? { caso: 'INCOERENTE', pendencias } : { caso: 'OK', reserva }
}
