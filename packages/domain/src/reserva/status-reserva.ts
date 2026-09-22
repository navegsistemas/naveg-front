/**
 * **A FSM da reserva** — própria e pequena, e a decisão de ela ser própria está no
 * [ADR-0001](../../../../docs/adr/ADR-0001-a-reserva-como-tipo-proprio.md).
 *
 * ```
 * RESERVADA → CONVERTIDA | EXPIRADA | CANCELADA        (as três terminais)
 * ```
 *
 * `StatusPassagem` **não muda**. Uma reserva pública é incompleta por definição — sem documento conferido,
 * sem pagamento, sem funcionário emissor —, e encaixá-la na FSM da passagem obrigaria a tornar opcional
 * tudo o que hoje é obrigatório lá.
 *
 * ### A web só escreve `RESERVADA`
 *
 * É a única constante deste arquivo que aparece numa linha de Firestore Rules (passo 9):
 *
 * ```
 * allow create: if ... request.resource.data.status == 'RESERVADA' ...
 * ```
 *
 * Toda transição a partir daí é do aplicativo autenticado. Por isso [STATUS_DA_WEB] é exportada em vez de
 * o literal ser escrito duas vezes: o dia em que o valor mudar, ele muda no domínio, na Rule e no cenário
 * ao mesmo tempo — e se não mudar nos três, o build acusa.
 *
 * ### E por que [transicaoValida] existe se a web não transita
 *
 * Porque a **leitura** transita: a página de fallback do deeplink (`/r/{codigo}`, passo 11) mostra uma
 * reserva que já pode ter virado `CONVERTIDA`, e o codec precisa saber que isso é um estado legítimo e não
 * um dado corrompido. A tabela é a mesma nas duas pontas; quem tem permissão de *gravá-la* é outra
 * conversa, e essa mora nas Rules.
 */
import { deValor, rotuloDoNome } from '../primitivos/fronteira.js'

export const STATUS_DE_RESERVA = ['RESERVADA', 'CONVERTIDA', 'EXPIRADA', 'CANCELADA'] as const

export type StatusReserva = (typeof STATUS_DE_RESERVA)[number]

/** O único status que esta aplicação tem permissão de escrever. Ver o cabeçalho. */
export const STATUS_DA_WEB = 'RESERVADA' as const satisfies StatusReserva

const ROTULOS: Readonly<Record<StatusReserva, string>> = {
  RESERVADA: 'Reservada',
  CONVERTIDA: 'Convertida em passagem',
  EXPIRADA: 'Expirada',
  CANCELADA: 'Cancelada',
}

/**
 * As transições que a FSM admite. `RESERVADA` é o único estado com saída; os outros três são terminais —
 * uma reserva convertida não volta a ser pedido, e uma expirada não ressuscita (faz-se outra).
 */
const TRANSICOES: Readonly<Record<StatusReserva, readonly StatusReserva[]>> = {
  RESERVADA: ['CONVERTIDA', 'EXPIRADA', 'CANCELADA'],
  CONVERTIDA: [],
  EXPIRADA: [],
  CANCELADA: [],
}

export const StatusReserva = {
  valores: STATUS_DE_RESERVA,
  inicial: STATUS_DA_WEB,

  rotulo(status: StatusReserva): string {
    return ROTULOS[status]
  },

  /** O nome cru, com underscore virando espaço — o `rotulo()` genérico dos enums do Kotlin. */
  nome(status: StatusReserva): string {
    return rotuloDoNome(status)
  },

  de(valor: string | null | undefined): StatusReserva | null {
    return deValor(STATUS_DE_RESERVA, valor)
  },

  destinos(status: StatusReserva): readonly StatusReserva[] {
    return TRANSICOES[status]
  },

  terminal(status: StatusReserva): boolean {
    return TRANSICOES[status].length === 0
  },

  transicaoValida(de: StatusReserva, para: StatusReserva): boolean {
    return TRANSICOES[de].includes(para)
  },

  /** A reserva ainda espera o atendimento? É o que a página de fallback do deeplink pergunta. */
  emAberto(status: StatusReserva): boolean {
    return status === 'RESERVADA'
  },
} as const
