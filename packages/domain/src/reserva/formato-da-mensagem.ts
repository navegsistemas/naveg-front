/**
 * **O formato da mensagem ao atendimento** (2.6, E, PO, 2026-10-16: "um tom mais profissional"): a saudação, um campo
 * por linha com o nome em negrito, e o fecho que pede a confirmação. Quem escreve é o cliente — a conversa sai do
 * telefone dele.
 *
 * Mora à parte da passagem (`link-de-atendimento.ts`) e da encomenda (`mensagem-da-encomenda.ts`) porque as duas o
 * usam, e uma já importa a outra: aqui não há ciclo.
 */
import type { Reserva } from './reserva.js'

/** O que a mensagem precisa da travessia — os rótulos que o catálogo já escreveu (`TravessiaOfertada.rotulos`). */
export interface RotulosDaMensagem {
  /** As cidades da rota: "Belém/PA". */
  readonly origem: string
  readonly destino: string
  readonly partida: string
  /** O cais do dia, "Porto do Grego · Santana/AP" — o atendimento confirma por ele onde a pessoa embarca. */
  readonly embarque?: string
  /** O aviso da data alterada, "Embarque alterado nesta data: …" (UI 2.2, decisão B), quando há. */
  readonly alteracao?: string | null
}

/** Uma linha da mensagem: "*Saída:* Qua, 14/10 · 18:00". O WhatsApp mostra entre asteriscos em negrito. */
export interface CampoDaMensagem {
  readonly rotulo: string
  readonly valor: string
}

export function montarMensagem(abertura: string, campos: readonly CampoDaMensagem[], fecho: string): string {
  return [abertura, '', ...campos.map(({ rotulo, valor }) => `*${rotulo}:* ${valor}`), '', fecho].join('\n')
}

/**
 * O trecho, a saída, o cais de embarque, quando se sabe, e o aviso da data alterada, quando há — o atendente vê na
 * conversa que a saída não é a de sempre.
 */
export function camposDaTravessia(rotulos: RotulosDaMensagem): CampoDaMensagem[] {
  return [
    { rotulo: 'Trecho', valor: `${rotulos.origem} → ${rotulos.destino}` },
    { rotulo: 'Saída', valor: rotulos.partida },
    ...(rotulos.embarque === undefined ? [] : [{ rotulo: 'Embarque', valor: rotulos.embarque }]),
    ...(rotulos.alteracao === undefined || rotulos.alteracao === null ? [] : [{ rotulo: 'Atenção', valor: rotulos.alteracao }]),
  ]
}

/** O fecho de toda mensagem. */
export const PEDE_A_CONFIRMACAO = 'Aguardo a confirmação.'

/** A abertura de quando o site não conseguiu enviar (2.6, B): não há código a confirmar, e o atendimento registra. */
export function aberturaSemCodigo(reserva: Reserva): string {
  return reserva.categoria === 'ENCOMENDA'
    ? 'Olá! Tentei registrar esta encomenda pelo site, mas ela não foi enviada. Podem registrá-la para mim?'
    : 'Olá! Tentei fazer esta reserva pelo site, mas ela não foi enviada. Podem registrá-la para mim?'
}
