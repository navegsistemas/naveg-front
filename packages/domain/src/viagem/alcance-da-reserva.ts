/**
 * **Até onde se pode reservar, e a saída suspensa** — porte de `domain/viagem/AlcanceDaReserva.kt` e
 * `SaidaSuspensa.kt` do fluviapp-kmp (fluviapp-kmp#44, ADR-0019 de lá; PO, 2026-10-09).
 *
 * São dois números e uma exceção:
 *
 * - [DIAS_DA_JANELA] (7) continua sendo **o que o balcão vê** — a semana de trabalho;
 * - [ALCANCE_DA_RESERVA_DIAS] (90) é **o que se pode pedir** pelo site: hoje e os 89 dias seguintes, para
 *   passageiro e veículo. A encomenda fica na semana: ninguém despacha volume com meses de antecedência;
 * - a **saída suspensa** é a data em que a viagem não sai (feriado, docagem). Ela é gravada em
 *   `suspensoes/{viagemId}@{data}`, e a data deixa de ser oferecida. Nada é cancelado sozinho.
 *
 * **A regra do servidor repete estes números** (`firestore.rules`, `saidaReservavel`). Se o Kotlin, a regra e
 * este pacote divergirem, o site oferece uma data que a gravação recusa — o contrato confere o 90 e o 7.
 *
 * ### Uma divergência deliberada
 *
 * No Kotlin, as funções recebem a `SaidaSuspensa` inteira (motivo, quem suspendeu, quando). Aqui recebem só a
 * **ocorrência** suspensa: é tudo o que a conta usa, e é tudo o que deixa o servidor. O motivo e o `uid` de quem
 * suspendeu são da transportadora, não do público.
 */
import { DataCalendario, type InstanteLocal } from '../primitivos/calendario.js'
import type { CategoriaReserva } from '../reserva/reserva.js'
import type { OcorrenciaViagem } from './ocorrencia-viagem.js'
import { DIAS_DA_JANELA, disponiveisAPartirDe, type Viagem, type ViagemSemana } from './viagem.js'

/** Hoje e os 89 dias seguintes. O `ALCANCE_DA_RESERVA_DIAS` do Kotlin. */
export const ALCANCE_DA_RESERVA_DIAS = 90

/** O alcance de cada pedido: a encomenda na semana, passageiro e veículo em 90 dias. O `alcanceEmDias` do Kotlin. */
export function alcanceEmDias(categoria: CategoriaReserva): number {
  return categoria === 'ENCOMENDA' ? DIAS_DA_JANELA : ALCANCE_DA_RESERVA_DIAS
}

/** `viagemId@yyyy-MM-dd` — o id do documento em `suspensoes`, a mesma chave da `ViagemSemana.id`. */
export function idDaSuspensao(ocorrencia: OcorrenciaViagem): string {
  return `${ocorrencia.viagemId}@${ocorrencia.data}`
}

function suspensa(suspensas: readonly OcorrenciaViagem[], viagemId: string, data: DataCalendario): boolean {
  return suspensas.some((s) => s.viagemId === viagemId && s.data === data)
}

/**
 * **As saídas que o site pode oferecer** para um pedido: as disponíveis dentro do alcance da categoria, menos as
 * suspensas. O `reservaveisAPartirDe` do Kotlin.
 */
export function reservaveisAPartirDe(
  viagens: readonly Viagem[],
  agora: InstanteLocal,
  categoria: CategoriaReserva,
  suspensas: readonly OcorrenciaViagem[],
): readonly ViagemSemana[] {
  return disponiveisAPartirDe(viagens, agora, alcanceEmDias(categoria)).filter(
    (o) => !suspensa(suspensas, o.viagem.id, o.data),
  )
}

/**
 * **A pergunta que a regra do servidor faz** ao gravar: a viagem existe e está ativa, a data cai no dia da semana
 * dela, entre hoje e o fim do alcance, e não está suspensa. O `saidaReservavel` do Kotlin.
 *
 * A hora fica de fora, como lá: a regra não a lê, e a saída que já partiu é recusada antes, pela oferta
 * ([reservaveisAPartirDe]). É o piso que vale mesmo com a API errada — e é o que a API confere antes de gravar,
 * para responder com uma mensagem, e não com a recusa da regra.
 */
export function saidaReservavel(
  viagem: Viagem | null | undefined,
  data: DataCalendario,
  categoria: CategoriaReserva,
  hoje: DataCalendario,
  suspensas: readonly OcorrenciaViagem[],
): boolean {
  if (viagem === null || viagem === undefined || !viagem.ativo) return false
  if (DataCalendario.diaDaSemana(data) !== viagem.diaSemana) return false
  if (DataCalendario.comparar(data, hoje) < 0) return false
  if (DataCalendario.comparar(data, DataCalendario.maisDias(hoje, alcanceEmDias(categoria))) >= 0) return false
  return !suspensa(suspensas, viagem.id, data)
}
