/**
 * **O porto e a rota** — porte de `domain/porto/Porto.kt` e `domain/rota/Rota.kt` do fluviapp-kmp.
 *
 * Desde a rota geográfica (fluviapp-kmp#51, ADR-0021 de lá; PO, 2026-10-12), **a rota liga duas cidades**, e não
 * dois portos. A cidade é **a que o cliente procura**: Belém → Macapá, mesmo que o barco atraque em Santana. O cais é
 * da viagem (`Viagem.portoEmbarqueId`), e o cais de um dia, da alteração da saída. Por isso nada aqui deduz a cidade
 * da rota do município do porto (PO, 2026-10-13: "a rota é o marketing").
 *
 * A rota é o **par ordenado** de cidades, imutável: não se edita, cria-se outra e inativa-se esta. É dela que vem o
 * `tempoMedioH` que dá a chegada estimada.
 */

export interface Porto {
  readonly id: string
  readonly nome: string
  readonly localidadeId: string
  readonly ativo: boolean
}

export interface Rota {
  readonly id: string
  /** A cidade de partida — uma `Localidade`, por id. */
  readonly localidadeOrigemId: string
  /** A cidade de chegada. */
  readonly localidadeDestinoId: string
  /** Milhas náuticas. */
  readonly distanciaMn: number
  /** Horas, decimal: 2,5 é duas horas e meia. */
  readonly tempoMedioH: number
  readonly ativo: boolean
}

/** Uma rota tem sentido quando liga duas cidades **diferentes**. O `Rota.temSentido()` do Kotlin. */
export function rotaTemSentido(rota: Rota): boolean {
  return (
    rota.localidadeOrigemId.trim().length > 0 &&
    rota.localidadeDestinoId.trim().length > 0 &&
    rota.localidadeOrigemId !== rota.localidadeDestinoId
  )
}
