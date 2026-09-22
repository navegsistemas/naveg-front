/**
 * **O dia da semana** — porte de `primitivos/dia-semana.ts` do `@fluviapp/domain`, que porta
 * `domain/viagem/DiaSemana.kt`.
 *
 * As três decisões daquele arquivo se mantêm, e são elas que importam:
 *
 * 1. **o nome é o valor persistido** (`"TUESDAY"`), estável, e é o que o Firestore grava. Trocar por
 *    índice numérico ou por sigla mudaria o dado; trocar por português ataria persistência a interface;
 * 2. **o texto mora aqui, não no `Intl`** — `Intl.DateTimeFormat` devolve grafias diferentes conforme o
 *    locale do aparelho e a versão do navegador, e grafia instável faria a mesma travessia aparecer com
 *    textos distintos em telas distintas. Num totem público isso é o tipo de diferença que vira dúvida
 *    no balcão;
 * 3. **a ordem é ISO-8601** — segunda a domingo. É a que o Brasil usa em horário de embarcação ("sai toda
 *    terça"), e não a de calendário começando no domingo.
 */
import { deValor } from './fronteira.js'

export const DIAS_DA_SEMANA = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

export type DiaSemana = (typeof DIAS_DA_SEMANA)[number]

const ROTULOS: Readonly<Record<DiaSemana, string>> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

/** Forma curta, para onde a linha é apertada — o cartão da travessia e a mensagem do WhatsApp. */
const ROTULOS_CURTOS: Readonly<Record<DiaSemana, string>> = {
  MONDAY: 'Seg',
  TUESDAY: 'Ter',
  WEDNESDAY: 'Qua',
  THURSDAY: 'Qui',
  FRIDAY: 'Sex',
  SATURDAY: 'Sáb',
  SUNDAY: 'Dom',
}

export const DiaSemana = {
  valores: DIAS_DA_SEMANA,

  rotulo(dia: DiaSemana): string {
    return ROTULOS[dia]
  },

  rotuloCurto(dia: DiaSemana): string {
    return ROTULOS_CURTOS[dia]
  },

  /** Fronteira do dado gravado: `"TUESDAY"` → `TUESDAY`. Fail-closed. */
  de(valor: string | null | undefined): DiaSemana | null {
    return deValor(DIAS_DA_SEMANA, valor)
  },

  /** Posição ISO: segunda = 1 … domingo = 7. É o `DayOfWeek.value` do java.time. */
  numeroIso(dia: DiaSemana): number {
    return DIAS_DA_SEMANA.indexOf(dia) + 1
  },

  /** `1..7` → dia, ou `null` fora da faixa. */
  deNumeroIso(numero: number): DiaSemana | null {
    return DIAS_DA_SEMANA[numero - 1] ?? null
  },

  /** Avança `dias`, dando a volta — o `diaSemana.plus(diasDepois)` da chegada estimada. */
  mais(dia: DiaSemana, dias: number): DiaSemana {
    const total = DIAS_DA_SEMANA.length
    return DIAS_DA_SEMANA[(((DIAS_DA_SEMANA.indexOf(dia) + dias) % total) + total) % total] as DiaSemana
  },
} as const
