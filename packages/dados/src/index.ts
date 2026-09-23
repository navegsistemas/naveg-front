/**
 * **`@navegsistemas/dados`** — as portas do totem e os adaptadores.
 *
 * O totem depende de portas, nunca de um banco. O catálogo vem da API da agência (`catalogoHttp`); a reserva
 * ainda é gravada em memória (`ReservaEmMemoria`), até o passo 10. O caso de uso de envio e a porta de gravação
 * moram no `@navegsistemas/domain`, porque o servidor também os usa.
 */
export type { FonteDoCatalogo } from './portas.js'
export { catalogoFixo, ReservaEmMemoria } from './em-memoria.js'
export { catalogoHttp, FalhaAoCarregarOCatalogo } from './http.js'
export type { Buscar } from './http.js'
