/**
 * **Os Termos de Uso** — o que a página `/termos` declara sobre si mesma (PO, 2026-10-16: "crie a página e finalize o
 * rodapé").
 *
 * O texto mora na página (`pages/termos.astro`), como o da política. Aqui fica o que muda junto com ele: a versão, a
 * data e **o que ainda falta**. Os termos dizem o que o site faz hoje — a reserva — e nada além; a conta e a compra
 * entram com a 7.4 e a 7.6, com o cancelamento e o reembolso (O5), cada uma mudando a versão e a data.
 */

/** Sobe a cada mudança de conteúdo; a data acompanha. */
export const VERSAO_DOS_TERMOS = '1.0'
/** ISO `yyyy-MM-dd`. */
export const DATA_DOS_TERMOS = '2026-10-16'

/** O que os termos ainda esperam. Enquanto houver, a página se declara rascunho. */
export const PENDENCIAS_DOS_TERMOS = {
  /** A mesma revisão da política (U7): um advogado, de uma vez. */
  revisaoJuridica: 'a revisão jurídica, junto com a da política de privacidade',
} as const
