/**
 * **`@naveg/ui`** — as telas do totem, controladas e sem estado de aplicação.
 *
 * Cada componente recebe o que mostrar e devolve o gesto. As opções vêm dos nós do roteiro; os textos, de
 * `textos.ts`, que o compilador obriga a acompanhar o domínio. A folha de estilo é `@naveg/ui/totem.css`, e
 * só consome tokens.
 */
export { EscolhaEmCartoes } from './EscolhaEmCartoes.js'
export type { OpcaoEmCartao, PropsDaEscolha } from './EscolhaEmCartoes.js'
export { CampoDeCilindrada, FormularioDoCliente } from './Formularios.js'
export { PassoDaReserva } from './PassoDaReserva.js'
export type { PropsDoPasso } from './PassoDaReserva.js'
export { Conferencia, IndicadorDePasso, ListaDeTravessias, ReservaConcluida } from './Telas.js'
export { resumoDaReserva } from './resumo.js'
export type { LinhaDoResumo } from './resumo.js'
export { AVISO_RESERVA_NAO_VENDA, TEXTO_DA_PENDENCIA, TEXTO_DO_PASSO } from './textos.js'
export type { TextoDoPasso } from './textos.js'
