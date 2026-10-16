/**
 * **`@navegsistemas/ui`** — as telas do totem, controladas e sem estado de aplicação.
 *
 * Cada componente recebe o que mostrar e devolve o gesto. As opções vêm dos nós do roteiro; os textos, de
 * `textos.ts`, que o compilador obriga a acompanhar o domínio. A folha de estilo é `@navegsistemas/ui/totem.css`, e
 * só consome tokens.
 */
export { CalendarioDeSaidas } from './CalendarioDeSaidas.js'
export type { PropsDoCalendario } from './CalendarioDeSaidas.js'
export {
  NOMES_DOS_MESES,
  mesesDoCalendario,
  origensDaOferta,
  primeiroDiaReservavel,
  rotuloDoDia,
  saidasDoDia,
} from './calendario.js'
export type {
  DiaDoCalendario,
  EntradaDoCalendario,
  MesDoCalendario,
  OrigemDaOferta,
  SituacaoDoDia,
} from './calendario.js'
export { EscolhaEmCartoes } from './EscolhaEmCartoes.js'
export type { OpcaoEmCartao, PropsDaEscolha } from './EscolhaEmCartoes.js'
export { CampoDeCilindrada, FormularioDoCliente, FormularioDoTipoDoVolume } from './Formularios.js'
export type { RespostaDoTipoDoVolume } from './Formularios.js'
export { OQueVaiEmbarcar } from './OQueVaiEmbarcar.js'
export type { FotoDoCartao, PropsDoQueVaiEmbarcar } from './OQueVaiEmbarcar.js'
export { PassoDaReserva } from './PassoDaReserva.js'
export { QuantidadeDePessoas } from './QuantidadeDePessoas.js'
export { PESSOAS, VOLUMES } from './QuantidadeDePessoas.js'
export type { PropsDaQuantidade, UnidadeDaQuantidade } from './QuantidadeDePessoas.js'
export type { PropsDoPasso } from './PassoDaReserva.js'
export {
  BlocosDoResumo,
  Conferencia,
  EmbarqueEscolhido,
  ETAPAS_DA_RESERVA,
  EtapasDaReserva,
  IndicadorDePasso,
  ListaDeTravessias,
  RecomecarComConfirmacao,
  ReservaConcluida,
  SaidaEscolhida,
} from './Telas.js'
export type { EtapaDaReserva } from './Telas.js'
export { blocosDaReserva, resumoDaEncomenda, resumoDaReserva, resumoDoEmbarque } from './resumo.js'
export type { AlvoDoBloco, BlocoDoResumo, LinhaDoBloco, LinhaDoResumo } from './resumo.js'
export {
  TRACEJADOS_DA_ENCOMENDA,
  TRACEJADOS_DA_RESERVA,
  type TextoDosTracejados,
  AVISO_RESERVA_NAO_VENDA,
  RETIRADA_A_COMBINAR,
  TEXTO_DE_QUEM_MANDA,
  TEXTO_DA_PENDENCIA,
  TEXTO_DO_PASSO,
  TEXTO_DO_PASSO_NO_SITE,
} from './textos.js'
export type { TextoDoPasso } from './textos.js'
