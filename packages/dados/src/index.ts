/**
 * **`@navegsistemas/dados`** — as portas do totem e os adaptadores.
 *
 * O totem depende das portas (`ReservaRepositorio`, `FonteDoCatalogo`), nunca de um banco. No passo 8 só existem
 * os adaptadores em memória; o do Firestore entra no passo 10, e o do catálogo gerado no build, no passo 9.
 */
export type { FonteDoCatalogo, ReservaRepositorio, ResultadoDaGravacao } from './portas.js'
export { catalogoFixo, ReservaEmMemoria } from './em-memoria.js'
export { enviarReserva, TENTATIVAS_DE_CODIGO } from './enviar-reserva.js'
export type { PedidoDeEnvio, ResultadoDoEnvio } from './enviar-reserva.js'
