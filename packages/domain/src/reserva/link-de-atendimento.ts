/**
 * **O handoff para o WhatsApp** — a reserva vira uma conversa com o atendimento, já com o código.
 *
 * O totem grava a reserva; quem a transforma em passagem é uma pessoa, no centralizador. Este arquivo é a ponte:
 * o link `https://wa.me/<número>?text=<mensagem>` que abre a conversa com a mensagem escrita. O atendente acha a
 * reserva pelo **código**, que por isso vai na primeira linha — o resto da mensagem é para ele conferir de
 * relance, sem abrir nada.
 *
 * ### O que não vai na mensagem
 *
 * Documento nenhum, e o telefone também não: a conversa já é **do** telefone de quem manda. O nome vai porque o
 * atendente cumprimenta a pessoa por ele.
 *
 * E a linha "Abrir no app: https://…/r/{codigo}" do plano **fica de fora até existir o domínio de produção**
 * (decisão de 2026-09-25): hoje o endereço seria o da homologação, atrás do login da Vercel, e o cliente
 * receberia um link que não abre. O código na primeira linha basta ao atendente.
 *
 * ### O número passa pela regra do domínio
 *
 * `wa.me` só aceita dígitos com o código do país. O número do atendimento é escrito como se lê —
 * `(91) 98888-7777` — e passa por [normalizarWhatsapp]. Um número que não é celular **lança**: ele é conteúdo
 * do site, escrito uma vez, e deve quebrar o build de quem o digitou, não virar um link que não abre.
 */
import { casoImpossivel } from '../primitivos/fronteira.js'
import { Acomodacao } from '../passagem/acomodacao.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import { normalizarWhatsapp } from './contato.js'
import type { Reserva } from './reserva.js'

/** O que a mensagem precisa da travessia — os rótulos que o catálogo já escreveu (`TravessiaOfertada.rotulos`). */
export interface RotulosDaMensagem {
  readonly origem: string
  readonly destino: string
  readonly partida: string
}

/**
 * O link para abrir a conversa, opcionalmente já com a mensagem escrita.
 *
 * A mensagem passa por `encodeURIComponent` inteira — acento, quebra de linha e `&` incluídos. Sem isso, um
 * `&` no texto vira outro parâmetro e a mensagem chega cortada no ponto exato em que alguém escreveu "rede &
 * suíte".
 *
 * @throws quando o número não é um celular brasileiro.
 */
export function linkDeWhatsApp(telefone: string, mensagem?: string): string {
  const numero = normalizarWhatsapp(telefone)
  if (numero === null) {
    throw new Error(`Celular inválido: "${telefone}" não é 55 + DDD + 9 dígitos começando com 9.`)
  }

  const base = `https://wa.me/${numero}`
  if (mensagem === undefined || mensagem.trim() === '') return base
  return `${base}?text=${encodeURIComponent(mensagem)}`
}

function pessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

/** "Rede · 1 pessoa" ou "Moto · 160 cc". */
function aPassagem(reserva: Reserva): string {
  switch (reserva.categoria) {
    case 'PASSAGEIRO':
      return `${Acomodacao.rotulo(reserva.acomodacao)} · ${pessoas(reserva.quantidadePessoas)}`
    case 'VEICULO':
      return reserva.cilindrada === undefined
        ? ClasseVeiculo.rotulo(reserva.classe)
        : `${ClasseVeiculo.rotulo(reserva.classe)} · ${reserva.cilindrada} cc`
    default:
      return casoImpossivel(reserva, 'aPassagem')
  }
}

/**
 * A mensagem que o cliente manda ao atendimento:
 *
 * ```
 * Reserva NVG-7K3QP2
 * Porto do Sal · Belém/PA → Porto de Camará · Salvaterra/PA · Qua, 14/10 · 18:00
 * Rede · 1 pessoa · Maria Souza
 * Vale até a partida.
 * ```
 */
export function mensagemDaReserva(reserva: Reserva, rotulos: RotulosDaMensagem): string {
  return [
    `Reserva ${reserva.codigo}`,
    `${rotulos.origem} → ${rotulos.destino} · ${rotulos.partida}`,
    `${aPassagem(reserva)} · ${reserva.cliente.nome}`,
    'Vale até a partida.',
  ].join('\n')
}

/** O link de atendimento **desta** reserva: a conversa com o atendimento, com a mensagem pronta. */
export function linkDaReserva(telefoneDoAtendimento: string, reserva: Reserva, rotulos: RotulosDaMensagem): string {
  return linkDeWhatsApp(telefoneDoAtendimento, mensagemDaReserva(reserva, rotulos))
}
