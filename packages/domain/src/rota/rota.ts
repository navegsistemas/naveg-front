/**
 * **O porto e a rota** — porte de `domain/porto/Porto.kt` e `domain/rota/Rota.kt` do fluviapp.
 *
 * A rota é o **par ordenado** de portos, imutável: não se edita, cria-se outra e inativa-se esta. É dela que
 * vem o `tempoMedioH` que dá a chegada estimada — e é o par dela que a concessão da agência confere.
 */

export interface Porto {
  readonly id: string
  readonly nome: string
  readonly localidadeId: string
  readonly ativo: boolean
}

export interface Rota {
  readonly id: string
  readonly portoOrigemId: string
  readonly portoDestinoId: string
  /** Milhas náuticas. */
  readonly distanciaMn: number
  /** Horas, decimal: 2,5 é duas horas e meia. */
  readonly tempoMedioH: number
  readonly ativo: boolean
}

/** Uma rota tem sentido quando liga dois portos **diferentes**. O `Rota.temSentido()` do Kotlin. */
export function rotaTemSentido(rota: Rota): boolean {
  return (
    rota.portoOrigemId.trim().length > 0 &&
    rota.portoDestinoId.trim().length > 0 &&
    rota.portoOrigemId !== rota.portoDestinoId
  )
}
