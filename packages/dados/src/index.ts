/**
 * **`@navegsistemas/dados`** — as portas do totem e os adaptadores.
 *
 * O totem depende das portas (`ReservaRepositorio`, `FonteDoCatalogo`), nunca de um banco. O catálogo vem da API
 * da agência (`catalogoHttp`, passo 9); a reserva ainda é gravada em memória, até o passo 10.
 */
export type { FonteDoCatalogo, ReservaRepositorio, ResultadoDaGravacao } from './portas.js'
export { catalogoFixo, ReservaEmMemoria } from './em-memoria.js'
export { catalogoHttp, FalhaAoCarregarOCatalogo } from './http.js'
export type { Buscar } from './http.js'
export { enviarReserva, TENTATIVAS_DE_CODIGO } from './enviar-reserva.js'
export type { PedidoDeEnvio, ResultadoDoEnvio } from './enviar-reserva.js'
