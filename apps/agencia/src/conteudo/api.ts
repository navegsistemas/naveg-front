/**
 * **De onde o totem tira o catálogo** — a API da agência, por padrão.
 *
 * Até o passo 9, o padrão era o catálogo de demonstração, e a API entrava só com `PUBLIC_URL_DA_API` definida.
 * Isso deixava o site publicado mostrando saídas fictícias a menos que alguém lembrasse de configurar a
 * variável. Desde 2026-09-23 é o contrário: **o padrão é a API**, e a demonstração é que precisa ser pedida.
 *
 * `PUBLIC_URL_DA_API`:
 *
 * - ausente ou em branco → a API de produção, `URL_DA_API_PADRAO`;
 * - `demonstracao` → o catálogo de demonstração, com a faixa dizendo que as saídas são fictícias. É o que se
 *   usa sem rede, ou para mostrar o totem sem depender do cadastro do fluviapp;
 * - uma URL `https://…` (ou `http://localhost…`) → essa API. Para apontar para outro deploy.
 *
 * Qualquer outra coisa **quebra o build**. Um endereço digitado errado não dá erro em lugar nenhum — dá um totem
 * dizendo "não foi possível carregar as saídas" para todo mundo, o dia inteiro.
 *
 * A variável é pública de propósito: é um endereço, não um segredo.
 */

export const URL_DA_API_PADRAO = 'https://naveg-api-vercel.vercel.app'

export const PEDIDO_DE_DEMONSTRACAO = 'demonstracao'

export type FonteConfigurada = { readonly tipo: 'API'; readonly url: string } | { readonly tipo: 'DEMONSTRACAO' }

export class UrlDaApiInvalida extends Error {
  constructor(valor: string) {
    super(
      `PUBLIC_URL_DA_API="${valor}" não é uma URL https (nem http://localhost) nem "${PEDIDO_DE_DEMONSTRACAO}".`,
    )
    this.name = 'UrlDaApiInvalida'
  }
}

export function fonteConfigurada(valor: string | undefined): FonteConfigurada {
  const texto = (valor ?? '').trim()
  if (texto.length === 0) return { tipo: 'API', url: URL_DA_API_PADRAO }
  if (texto === PEDIDO_DE_DEMONSTRACAO) return { tipo: 'DEMONSTRACAO' }

  let url: URL
  try {
    url = new URL(texto)
  } catch {
    throw new UrlDaApiInvalida(texto)
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) throw new UrlDaApiInvalida(texto)
  return { tipo: 'API', url: texto.replace(/\/+$/, '') }
}
