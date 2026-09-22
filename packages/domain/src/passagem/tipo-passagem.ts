/**
 * **Tipo tarifário** — porte de `passagem/tipo-passagem.ts` do `@fluviapp/domain`, que porta
 * `domain/passagem/TipoPassagem.kt`.
 *
 * O valor persistido é o próprio literal (`"MEIA"`), como o `name` do enum Kotlin. `de()` converte na
 * fronteira, `rotulo` formata para exibição.
 *
 * ### O que **não** veio no porte: `tarifaDevida`
 *
 * Lá cada tipo sabe derivar a própria tarifa a partir da inteira (meia = metade, gratuidade = zero). Aqui
 * **não se vende** — a Fase 1 gera pedido, e quem emite e cobra é o aplicativo. Trazer o cálculo exigiria
 * trazer `Dinheiro` junto, e o ADR-0001 registra a consequência inversa: *"o porte do domínio para a web
 * fica menor: a reserva não precisa de `Lancamento`, de `Dinheiro` nem de `MetadadosPassagem`"*.
 *
 * Isso é uma **omissão declarada**, não um esquecimento: o tipo tarifário continua sendo escolhido e
 * gravado, porque é ele que diz ao atendente que passagem emitir. O que não atravessa é o preço.
 */
import { deValor } from '../primitivos/fronteira.js'

export const TIPOS_DE_PASSAGEM = ['INTEIRA', 'MEIA', 'GRATUIDADE'] as const

export type TipoPassagem = (typeof TIPOS_DE_PASSAGEM)[number]

const ROTULOS: Readonly<Record<TipoPassagem, string>> = {
  INTEIRA: 'Inteira',
  MEIA: 'Meia',
  GRATUIDADE: 'Gratuidade',
}

export const TipoPassagem = {
  valores: TIPOS_DE_PASSAGEM,

  rotulo(tipo: TipoPassagem): string {
    return ROTULOS[tipo]
  },

  de(valor: string | null | undefined): TipoPassagem | null {
    return deValor(TIPOS_DE_PASSAGEM, valor)
  },
} as const
