/**
 * **Até quando a reserva vale** — a política, num lugar só.
 *
 * *"A reserva dura até o navio partir (por enquanto)"* — decisão do analista, 2026-09-22.
 *
 * O "por enquanto" é a razão de este arquivo existir: a regra é uma linha, mas ela vai mudar (uma antecedência
 * mínima para o atendimento emitir, um corte na véspera), e quando mudar deve mudar **aqui**, sem que a
 * montagem, o codec ou a tela saibam. Quem chama pergunta a validade de uma partida; como ela é calculada é
 * assunto desta função.
 *
 * O que ela já garante, pela forma: a validade vem **da partida da ocorrência**, que vem do catálogo do
 * fluviapp (`ViagemSemana.partida`) — a mesma conta que o aplicativo faz para decidir que uma saída não está
 * mais disponível. Site e balcão concordam sobre quando o pedido deixa de valer porque os dois leem o mesmo
 * instante.
 */
import type { InstanteLocal } from '../primitivos/calendario.js'

export function validadeDaReserva(partida: InstanteLocal): InstanteLocal {
  return partida
}
