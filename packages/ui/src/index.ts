/**
 * **`@navegsistemas/ui`** — as telas do totem, controladas e sem estado de aplicação.
 *
 * Cada componente recebe o que mostrar e devolve o gesto. As opções vêm dos nós do roteiro; os textos, de
 * `textos.ts`, que o compilador obriga a acompanhar o domínio. A folha de estilo é `@navegsistemas/ui/totem.css`, e
 * só consome tokens.
 */
export { EscolhaEmCartoes } from './EscolhaEmCartoes.js'
export type { OpcaoEmCartao, PropsDaEscolha } from './EscolhaEmCartoes.js'
export { CampoDeCilindrada, FormularioDoCliente, FormularioDoVolume } from './Formularios.js'
export type { RespostaDoVolume } from './Formularios.js'
export { PassoDaReserva } from './PassoDaReserva.js'
export type { PropsDoPasso } from './PassoDaReserva.js'
export { PassoDaEncomenda } from './PassoDaEncomenda.js'
export type { PropsDoPassoDaEncomenda } from './PassoDaEncomenda.js'
export { Conferencia, IndicadorDePasso, ListaDeTravessias, ReservaConcluida } from './Telas.js'
export { resumoDaEncomenda, resumoDaReserva } from './resumo.js'
export type { LinhaDoResumo } from './resumo.js'
export {
  AJUDA_DO_REMETENTE,
  AVISO_ENCOMENDA_NAO_VENDA,
  AVISO_RESERVA_NAO_VENDA,
  TEXTO_DA_PENDENCIA,
  TEXTO_DO_PASSO,
  TEXTO_DO_PASSO_DA_ENCOMENDA,
} from './textos.js'
export type { TextoDoPasso } from './textos.js'
