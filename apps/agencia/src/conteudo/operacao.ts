/**
 * **Constantes da operação** — o que o totem precisa saber do mundo e que não é regra de domínio.
 */

/**
 * O fuso em que as partidas são escritas — o relógio do rio (decisão de 2026-09-22). O aplicativo compara a
 * partida com o relógio do aparelho, que está no porto; o site não pode usar o relógio do navegador, que pode
 * estar em qualquer lugar. Quando Manaus entrar, o fuso deixa de ser constante e passa a ser do porto.
 */
export const FUSO_DA_OPERACAO = 'America/Belem'

/**
 * Quanto tempo parado o totem físico espera antes de zerar tudo. Noventa segundos é mais do que alguém leva
 * pensando num passo, e menos do que o próximo da fila leva para chegar ao terminal.
 *
 * Só vale no **quiosque** (`/totem`). No celular de quem abre a página, o aparelho é da pessoa — zerar o que ela
 * preencheu porque foi atender o telefone seria punição sem motivo.
 */
export const INATIVIDADE_DO_QUIOSQUE_MS = 90_000

/**
 * Quantos dias o calendário da reserva mostra na página, contando hoje (UI 1.3, decisão do PO em 2026-10-09).
 *
 * É o teto das ocorrências que o centralizador vai aceitar (o arcabouço em andamento no fluviapp-kmp). Hoje só a
 * janela do domínio (`DIAS_DA_JANELA`, sete dias) se reserva; os dias seguintes aparecem e mandam para o
 * atendimento, e se acendem sozinhos quando a janela crescer.
 */
export const ALCANCE_DO_CALENDARIO_DIAS = 90
