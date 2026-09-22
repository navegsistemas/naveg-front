/**
 * **A categoria** — porte de `passagem/categoria-passagem.ts` do `@fluviapp/domain`, que porta
 * `domain/passagem/CategoriaPassagem.kt`.
 *
 * Ela não é "mais um campo": é o que decide **qual sub-domínio** o pedido é. Antes dela, *"isto é de
 * veículo"* era uma dedução sobre a presença de um campo (`ehVeiculo = placa != null`), e daí vinham três
 * coisas ruins — estado misto representável, regra espalhada por tela, e uma categoria nova entrando **em
 * silêncio**.
 *
 * Este valor é o **vocabulário** do eixo; quem carrega a forma é a união discriminada `Reserva`. Os dois
 * existem porque a fronteira precisa de um valor gravável (o discriminador do documento) e o código
 * precisa de um tipo que o compilador saiba esgotar.
 *
 * ### Por que `CARGA` não está aqui
 *
 * A carga é o terceiro sub-domínio **previsto** no fluviapp, e declará-la agora criaria um valor sem
 * ninguém que o carregue. A prontidão para ela é o **formato** — um `switch` exaustivo que passa a acusar
 * cada lugar a decidir —, não uma linha reservada.
 */
import { deValor } from '../primitivos/fronteira.js'

export const CATEGORIAS_DE_PASSAGEM = ['PASSAGEIRO', 'VEICULO'] as const

export type CategoriaPassagem = (typeof CATEGORIAS_DE_PASSAGEM)[number]

const ROTULOS: Readonly<Record<CategoriaPassagem, string>> = {
  PASSAGEIRO: 'Passageiro',
  VEICULO: 'Veículo',
}

export const CategoriaPassagem = {
  valores: CATEGORIAS_DE_PASSAGEM,

  rotulo(categoria: CategoriaPassagem): string {
    return ROTULOS[categoria]
  },

  de(valor: string | null | undefined): CategoriaPassagem | null {
    return deValor(CATEGORIAS_DE_PASSAGEM, valor)
  },
} as const
