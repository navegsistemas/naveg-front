/**
 * **De onde o totem tira o catálogo** — a API da agência, por padrão.
 *
 * Até o passo 9, o padrão era o catálogo de demonstração, e a API entrava só com `PUBLIC_URL_DA_API` definida.
 * Isso deixava o site publicado mostrando saídas fictícias a menos que alguém lembrasse de configurar a
 * variável. Desde 2026-09-23 é o contrário: **o padrão é a API**, e a demonstração é que precisa ser pedida.
 *
 * `PUBLIC_URL_DA_API`:
 *
 * - ausente ou em branco → `/api`, a API atrás do próprio site (`URL_DA_API_PADRAO`);
 * - `demonstracao` → o catálogo de demonstração, com a faixa dizendo que as saídas são fictícias. É o que se
 *   usa sem rede, ou para mostrar o totem sem depender do cadastro do fluviapp;
 * - um caminho do próprio site (`/api`) → a API por ele;
 * - uma URL `https://…` (ou `http://localhost…`) → essa API, direto. Para apontar para outro deploy, e para o E2E.
 *
 * Qualquer outra coisa **quebra o build**. Um endereço digitado errado não dá erro em lugar nenhum — dá um totem
 * dizendo "não foi possível carregar as saídas" para todo mundo, o dia inteiro.
 *
 * ### Por que `/api`
 *
 * A API fica atrás do site (D4, PO, 2026-10-16 e 2026-10-20): o `vercel.json` do site repassa `/api/…` para ela.
 * Para o navegador, o site e a API são o mesmo endereço, qualquer que seja ele. É o que deixa a sessão da conta ser
 * um cookie do próprio site (ADR-0003), e tira o CORS do caminho. A API continua vendo o endereço de quem acessa
 * (medido em 2026-10-21; ADR-0003).
 *
 * A variável é pública de propósito: é um endereço, não um segredo.
 */

export const URL_DA_API_PADRAO = '/api'

export const PEDIDO_DE_DEMONSTRACAO = 'demonstracao'

export type FonteConfigurada = { readonly tipo: 'API'; readonly url: string } | { readonly tipo: 'DEMONSTRACAO' }

export class UrlDaApiInvalida extends Error {
  constructor(valor: string) {
    super(
      `PUBLIC_URL_DA_API="${valor}" não é um caminho do site (/api), uma URL https (nem http://localhost) nem "${PEDIDO_DE_DEMONSTRACAO}".`,
    )
    this.name = 'UrlDaApiInvalida'
  }
}

export function fonteConfigurada(valor: string | undefined): FonteConfigurada {
  const texto = (valor ?? '').trim()
  if (texto.length === 0) return { tipo: 'API', url: URL_DA_API_PADRAO }
  if (texto === PEDIDO_DE_DEMONSTRACAO) return { tipo: 'DEMONSTRACAO' }
  /* Um caminho do próprio site: a barra do começo, letras, números e hífens. `//outro.site` seria outro endereço. */
  if (texto.startsWith('/')) {
    if (!/^(\/[a-z0-9-]+)+\/?$/.test(texto)) throw new UrlDaApiInvalida(texto)
    return { tipo: 'API', url: texto.replace(/\/+$/, '') }
  }

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

/**
 * **Para onde a reserva vai.** Só para a API quando as duas coisas estão lá: o catálogo vindo dela, e a chave
 * pública do Turnstile — sem desafio, a API recusa todo envio (`403`), e o totem passaria a falhar em vez de
 * demonstrar. Sem a chave, a reserva é montada e guardada em memória, e a faixa diz que nada é enviado.
 *
 * `PUBLIC_TURNSTILE_SITE_KEY` é pública de propósito: a Cloudflare a desenha para ir no HTML. A secreta mora
 * na API.
 */
export type EnvioConfigurado = { readonly tipo: 'API'; readonly url: string; readonly chaveDoDesafio: string } | { readonly tipo: 'MEMORIA' }

export function envioConfigurado(fonte: FonteConfigurada, chaveDoDesafio: string | undefined): EnvioConfigurado {
  const chave = (chaveDoDesafio ?? '').trim()
  return fonte.tipo === 'API' && chave.length > 0 ? { tipo: 'API', url: fonte.url, chaveDoDesafio: chave } : { tipo: 'MEMORIA' }
}
