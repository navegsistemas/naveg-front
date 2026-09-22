/**
 * **Data de calendário e instante local** — porte de `primitivos/calendario.ts` do `@fluviapp/domain`. O
 * par substitui `java.time.LocalDate` e `java.time.LocalDateTime`, e a razão de eles serem tipos está
 * escrita em `OcorrenciaViagem.kt`:
 *
 * > *`yyyy-MM-dd` ordena lexicograficamente na mesma ordem em que ordena cronologicamente, compara por
 * > igualdade **sem normalização** (data de viagem é calendário, não instante) e **serve de id de
 * > documento** — que é o que um `Timestamp` não pode ser.*
 *
 * ### Por que texto marcado, e não `Date`
 *
 * O `Date` do JavaScript é um instante em UTC com o fuso do ambiente pendurado na leitura. Usá-lo para
 * *data de viagem* faria a mesma data comparar diferente conforme o fuso de quem abre a página, e
 * `2026-08-18` viraria `2026-08-17` a oeste. **Num totem público isso não é hipótese**: a página é aberta
 * de qualquer lugar, e reservar a travessia do dia anterior é um erro que ninguém percebe até o embarque.
 * Data de calendário não tem hora e não tem fuso — o texto ISO **é** a sua identidade.
 *
 * O tipo marcado (*branded*) dá o que o `LocalDate` dava: uma `string` qualquer não entra onde se espera
 * data, e a única porta de entrada é [DataCalendario.de], que é total e fail-closed.
 *
 * ### Sobre o `InstanteLocal`
 *
 * É o `LocalDateTime` do aplicativo: a `ViagemSemana.partida` é um, e é contra ela que se decide se uma
 * saída ainda está disponível e até quando a reserva vale. `criadoEm` e `expiraEm` da `Reserva` também.
 */
import { DiaSemana } from './dia-semana.js'

declare const marcaData: unique symbol
declare const marcaInstante: unique symbol

/** `yyyy-MM-dd`. Um dia no calendário — sem hora, sem fuso. */
export type DataCalendario = string & { readonly [marcaData]: 'yyyy-MM-dd' }

/** `yyyy-MM-ddTHH:mm:ss`. Data e hora locais juntas — o que ordena e o que compara. */
export type InstanteLocal = string & { readonly [marcaInstante]: 'yyyy-MM-ddTHH:mm:ss' }

export interface PartesDaData {
  readonly ano: number
  readonly mes: number
  readonly dia: number
}

const PADRAO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/
const PADRAO_INSTANTE = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/

export const MINUTOS_POR_DIA = 24 * 60

const MILISSEGUNDOS_POR_DIA = 86_400_000

function doisDigitos(valor: number): string {
  return valor.toString().padStart(2, '0')
}

/** Dias desde a época, por aritmética de calendário pura — `Date.UTC` não lê relógio nenhum. */
function diasDaEpoca(partes: PartesDaData): number {
  return Date.UTC(partes.ano, partes.mes - 1, partes.dia) / MILISSEGUNDOS_POR_DIA
}

function daEpoca(dias: number): DataCalendario {
  const data = new Date(dias * MILISSEGUNDOS_POR_DIA)
  return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}-${doisDigitos(
    data.getUTCDate(),
  )}` as DataCalendario
}

export const DataCalendario = {
  /**
   * Fronteira texto→tipo. `null` quando não é uma data — e a checagem é de **calendário**, não de
   * formato: `2026-02-30` casa com a expressão regular e não existe, então é recusada. Fail-closed como
   * os codecs do domínio: uma data ilegível não é "hoje", não é nada.
   */
  de(texto: string | null | undefined): DataCalendario | null {
    const bruto = texto?.trim()
    if (bruto === undefined) return null
    const casamento = PADRAO_DATA.exec(bruto)
    if (casamento === null) return null

    const partes: PartesDaData = {
      ano: Number(casamento[1]),
      mes: Number(casamento[2]),
      dia: Number(casamento[3]),
    }
    if (partes.mes < 1 || partes.mes > 12 || partes.dia < 1 || partes.dia > 31) return null
    /* O ida-e-volta é o que rejeita 30 de fevereiro: se o dia normalizado não é o dia pedido, a data
       não existe no calendário. */
    return daEpoca(diasDaEpoca(partes)) === bruto ? (bruto as DataCalendario) : null
  },

  deAnoMesDia(ano: number, mes: number, dia: number): DataCalendario | null {
    return DataCalendario.de(`${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`)
  },

  partes(data: DataCalendario): PartesDaData {
    const casamento = PADRAO_DATA.exec(data) as RegExpExecArray
    return {
      ano: Number(casamento[1]),
      mes: Number(casamento[2]),
      dia: Number(casamento[3]),
    }
  },

  diaDaSemana(data: DataCalendario): DiaSemana {
    const domingoZero = new Date(
      diasDaEpoca(DataCalendario.partes(data)) * MILISSEGUNDOS_POR_DIA,
    ).getUTCDay()
    /* `getUTCDay` conta do domingo; a ordem do domínio é ISO, da segunda. */
    return DiaSemana.deNumeroIso(domingoZero === 0 ? 7 : domingoZero) as DiaSemana
  },

  maisDias(data: DataCalendario, dias: number): DataCalendario {
    return daEpoca(diasDaEpoca(DataCalendario.partes(data)) + dias)
  },

  /** Lexicográfico **é** cronológico — é a propriedade que o formato ISO compra. */
  comparar(a: DataCalendario, b: DataCalendario): number {
    return a < b ? -1 : a > b ? 1 : 0
  },

  /** Exibição `dd/MM/yyyy`. Fronteira: nada aqui dentro lê data nesse formato. */
  formatarBr(data: DataCalendario): string {
    const { ano, mes, dia } = DataCalendario.partes(data)
    return `${doisDigitos(dia)}/${doisDigitos(mes)}/${ano}`
  },
} as const

export const InstanteLocal = {
  /** Fronteira texto→tipo. Aceita com e sem segundos; normaliza para `yyyy-MM-ddTHH:mm:ss`. */
  de(texto: string | null | undefined): InstanteLocal | null {
    const bruto = texto?.trim()
    if (bruto === undefined) return null
    const casamento = PADRAO_INSTANTE.exec(bruto)
    if (casamento === null) return null

    const data = DataCalendario.de(casamento[1])
    if (data === null) return null
    const hora = Number(casamento[2])
    const minuto = Number(casamento[3])
    const segundo = casamento[4] === undefined ? 0 : Number(casamento[4])
    if (hora > 23 || minuto > 59 || segundo > 59) return null

    return `${data}T${doisDigitos(hora)}:${doisDigitos(minuto)}:${doisDigitos(
      segundo,
    )}` as InstanteLocal
  },

  /**
   * Data + minutos desde a meia-noite → instante, **rolando o dia** quando os minutos passam de um dia.
   * É o que a chegada estimada de uma travessia longa produz, e é a base de [maisHoras].
   */
  deDataEMinutos(data: DataCalendario, minutos: number): InstanteLocal {
    const diasAdiante = Math.floor(minutos / MINUTOS_POR_DIA)
    const doDia = ((minutos % MINUTOS_POR_DIA) + MINUTOS_POR_DIA) % MINUTOS_POR_DIA
    const dataFinal = diasAdiante === 0 ? data : DataCalendario.maisDias(data, diasAdiante)
    return `${dataFinal}T${doisDigitos(Math.floor(doDia / 60))}:${doisDigitos(
      doDia % 60,
    )}:00` as InstanteLocal
  },

  data(instante: InstanteLocal): DataCalendario {
    return instante.slice(0, 10) as DataCalendario
  },

  /** Minutos desde a meia-noite daquele dia. */
  horaMin(instante: InstanteLocal): number {
    return Number(instante.slice(11, 13)) * 60 + Number(instante.slice(14, 16))
  },

  /**
   * **Um momento do relógio lido num fuso** — a única ponte entre `Date` e o domínio.
   *
   * O aplicativo compara a partida com `LocalDateTime.now()` do aparelho, e o aparelho está no porto: o
   * fuso é implícito e certo. Na web não é — quem abre a página em Lisboa, ou num notebook com o fuso
   * errado, tem um relógio local que não é o do rio. Comparar a partida das 18:00 com esse relógio daria
   * como partida uma saída que ainda não saiu (ou o contrário), e a reserva seria recusada ou aceita
   * horas fora do lugar.
   *
   * Então quem chama passa o momento **e o fuso da operação** (`'America/Belem'`, `'America/Manaus'` —
   * a Amazônia tem mais de um). A função não lê relógio nenhum: o `Date` vem de fora.
   */
  emFuso(momento: Date, fuso: string): InstanteLocal {
    const partes = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: fuso,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(momento)
        .map((parte) => [parte.type, parte.value]),
    )
    return `${partes['year']}-${partes['month']}-${partes['day']}T${partes['hour']}:${partes['minute']}:${
      partes['second']
    }` as InstanteLocal
  },

  /** Comprimento fixo + ISO ⇒ comparar texto é comparar cronologia. */
  comparar(a: InstanteLocal, b: InstanteLocal): number {
    return a < b ? -1 : a > b ? 1 : 0
  },

  antesDe(a: InstanteLocal, b: InstanteLocal): boolean {
    return a < b
  },
} as const
