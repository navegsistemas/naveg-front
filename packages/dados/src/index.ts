/**
 * **`@navegsistemas/dados`** — as portas do totem e os adaptadores.
 *
 * O totem depende de portas, nunca de um banco: o catálogo vem da API (`catalogoHttp`), e a reserva é enviada
 * a ela (`envioHttp`) — ou montada e guardada em memória (`envioLocal` + `ReservaEmMemoria`), na demonstração e
 * nos cenários. O caso de uso e a porta de gravação moram no `@navegsistemas/domain`, porque o servidor também os
 * usa.
 */
export type { FonteDoCatalogo } from './portas.js'
export { catalogoFixo, ReservaEmMemoria } from './em-memoria.js'
export { catalogoHttp, FalhaAoCarregarOCatalogo } from './http.js'
export type { Buscar } from './http.js'
export { envioHttp, envioLocal } from './envio.js'
export type { EnvioDaReserva, ObterDesafio, PedidoDoTotem } from './envio.js'
