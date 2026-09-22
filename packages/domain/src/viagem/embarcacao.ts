/**
 * **A embarcação** — porte de `domain/viagem/Embarcacao.kt` do fluviapp. Coleção `embarcacoes` (o rename de
 * `Navio` para `Embarcacao` separou gênero de espécie: *"o navio é do tipo lancha"* era a frase errada).
 *
 * O **tipo** diz o que cabe (é ele que monta o roteiro do totem); as **capacidades** dizem quanto. A agência
 * não conta ocupação — ler passagens é o que as Rules negam ao público —, então as capacidades viajam aqui
 * só para exibição e para o dia em que a lotação for publicada por outro caminho.
 */
import type { TipoEmbarcacao } from './tipo-embarcacao.js'

export interface Embarcacao {
  readonly id: string
  /** `nome` no documento; `descricaoNome` no Kotlin, por causa do `IObjetoSimplificado`. */
  readonly nome: string
  readonly tipo: TipoEmbarcacao
  readonly capacidadeVeiculo: number
  readonly capacidadeSuite2: number
  readonly capacidadeSuite3: number
  readonly capacidadeCamarote: number
  readonly empresaId: string
}
