/**
 * **A viagem e as suas ocorrências** — porte de `domain/viagem/Viagem.kt` e `ViagemSemana.kt` do fluviapp
 * (ADR-0016 §7.1, ADR-0022 F8).
 *
 * A `Viagem` é a partida física, **semanal**: "terça às 18h", numa rota, numa embarcação. Uma saída = um
 * documento; "terça e sexta às 18h" são duas viagens. Imutável: inativa-se e cria-se outra, porque a
 * passagem — e agora a reserva — aponta para ela.
 *
 * A `ViagemSemana` é uma dessas saídas **numa data**, calculada e não persistida. É ela que a agência
 * oferece, e a [ViagemSemana.partida] é o instante que decide as duas coisas que importam aqui:
 *
 * 1. **se a saída ainda está disponível** — a das 06:00 de hoje não está às 18:00 de hoje;
 * 2. **até quando a reserva vale** — ela dura até o navio partir (decisão do analista, 2026-09-22, "por
 *    enquanto"). Ver `reserva/validade-da-reserva.ts`.
 *
 * É a mesma conta do aplicativo, e precisa ser: o que o site mostra como disponível tem de ser o que o
 * balcão mostra como disponível.
 */
import { DataCalendario, InstanteLocal, MINUTOS_POR_DIA } from '../primitivos/calendario.js'
import { DiaSemana } from '../primitivos/dia-semana.js'
import type { Rota } from '../rota/rota.js'
import { horaValida } from './hora-do-dia.js'
import type { OcorrenciaViagem } from './ocorrencia-viagem.js'

export interface Viagem {
  readonly id: string
  readonly rotaId: string
  readonly embarcacaoId: string
  readonly diaSemana: DiaSemana
  /** Minutos desde a meia-noite. */
  readonly horaMin: number
  readonly ativo: boolean
}

/** Partida com sentido: rota, embarcação e uma hora do relógio. O `Viagem.temSentido()` do Kotlin. */
export function viagemTemSentido(viagem: Viagem): boolean {
  return viagem.rotaId.trim().length > 0 && viagem.embarcacaoId.trim().length > 0 && horaValida(viagem.horaMin)
}

/** Quando a travessia termina — em duas partes, porque no rio ela costuma ter. */
export interface Chegada {
  readonly horaMin: number
  readonly diasDepois: number
  readonly diaSemana: DiaSemana
}

/** Saída + tempo médio da rota, arredondado ao minuto. O `Viagem.chegadaEstimada(rota)` do Kotlin. */
export function chegadaEstimada(viagem: Viagem, rota: Rota): Chegada {
  const total = viagem.horaMin + Math.round(rota.tempoMedioH * 60)
  const diasDepois = Math.floor(total / MINUTOS_POR_DIA)
  return {
    horaMin: ((total % MINUTOS_POR_DIA) + MINUTOS_POR_DIA) % MINUTOS_POR_DIA,
    diasDepois,
    diaSemana: DiaSemana.mais(viagem.diaSemana, diasDepois),
  }
}

/** Uma saída numa data. */
export interface ViagemSemana {
  readonly viagem: Viagem
  readonly data: DataCalendario
}

export const ViagemSemana = {
  /** O instante da partida — data e hora juntas, que é o que ordena e o que compara. */
  partida(ocorrencia: ViagemSemana): InstanteLocal {
    return InstanteLocal.deDataEMinutos(ocorrencia.data, ocorrencia.viagem.horaMin)
  },

  /** A chave que a reserva guarda: `(viagemId, data)`. */
  ocorrencia(ocorrencia: ViagemSemana): OcorrenciaViagem {
    return { viagemId: ocorrencia.viagem.id, data: ocorrencia.data }
  },

  /** `viagemId@yyyy-MM-dd` — o `ViagemSemana.id` do Kotlin. */
  id(ocorrencia: ViagemSemana): string {
    return `${ocorrencia.viagem.id}@${ocorrencia.data}`
  },
} as const

/**
 * Sete dias — a janela é uma semana porque a viagem é semanal: menos esconderia saídas que existem, mais
 * mostraria a mesma saída duas vezes. O `DIAS_DA_JANELA` do Kotlin.
 */
export const DIAS_DA_JANELA = 7

/**
 * **As ocorrências disponíveis a partir de um instante** — o `disponiveisAPartirDe` do Kotlin, linha a
 * linha: só as ativas, o dia da semana batendo com a data, a partida **não anterior** a `agora`, ordenadas
 * pela partida.
 *
 * `agora` é o relógio **no fuso da operação** — ver `InstanteLocal.emFuso`. Não é detalhe: é o que faz o
 * site e o balcão concordarem sobre qual barco já saiu.
 */
export function disponiveisAPartirDe(
  viagens: readonly Viagem[],
  agora: InstanteLocal,
  dias: number = DIAS_DA_JANELA,
): readonly ViagemSemana[] {
  if (dias <= 0) return []
  const hoje = InstanteLocal.data(agora)
  const datas = Array.from({ length: dias }, (_, i) => DataCalendario.maisDias(hoje, i))

  return viagens
    .filter((viagem) => viagem.ativo)
    .flatMap((viagem) => datas.map((data) => ({ viagem, data })))
    .filter((o) => o.viagem.diaSemana === DataCalendario.diaDaSemana(o.data))
    /* "não anterior", e não "posterior": a saída exatamente agora ainda está no cais — é o `isBefore`. */
    .filter((o) => !InstanteLocal.antesDe(ViagemSemana.partida(o), agora))
    .sort((a, b) => InstanteLocal.comparar(ViagemSemana.partida(a), ViagemSemana.partida(b)))
}
