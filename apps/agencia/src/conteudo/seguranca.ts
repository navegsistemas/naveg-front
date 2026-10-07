/**
 * **O que cada página pode carregar** — a `Content-Security-Policy`, por rota (passo 13.1,
 * `docs/plano-da-venda-online.md`).
 *
 * ### A base é a mais estrita, e cada página soma o que usa
 *
 * Todo o site parte de "só o próprio site": scripts, estilos, imagens e fontes vêm daqui, e o navegador só
 * conversa com a API. Quadro só do próprio site, nada de `<object>`, nenhum formulário mandando para outro
 * lugar. Uma página que precise de mais **declara** o acréscimo no próprio arquivo — hoje, as duas que têm o
 * totem somam o Turnstile; amanhã, a de pagamento soma o Mercado Pago, e só ela.
 *
 * Os scripts e estilos que o Astro escreve dentro da página (o carregador das ilhas, os quadros da vitrine)
 * entram por *hash*, calculado no build: nada de `'unsafe-inline'`. Quem gera a política no HTML é o próprio
 * Astro (`security.csp` em `astro.config.mjs`), numa `<meta http-equiv>`. `npm run conferir:build` confere
 * que toda página saiu com ela, e que todo trecho escrito na página tem o hash certo.
 *
 * ### O que a `<meta>` não alcança vai no cabeçalho
 *
 * `frame-ancestors` (ninguém põe o site num quadro) não vale em `<meta>` — só em cabeçalho HTTP. Ele e os
 * outros cabeçalhos de segurança estão em `apps/agencia/vercel.json`. As duas políticas valem juntas: o
 * navegador exige as duas. Lá, a `Permissions-Policy` desliga câmera, microfone, localização e pagamento pelo
 * navegador; a página de pagamento revê a linha do `payment` quando a U1 decidir como o cliente paga.
 */
import { createHash } from 'node:crypto'

import type { AstroGlobal } from 'astro'

import type { FonteConfigurada } from './api'

/** A política de uma página, como o Astro a entrega (`Astro.csp`). */
export type PoliticaDaPagina = NonNullable<AstroGlobal['csp']>
type Diretiva = Parameters<PoliticaDaPagina['insertDirective']>[0]

/** De onde o Turnstile carrega o script e o quadro do desafio. */
export const ORIGEM_DO_TURNSTILE = 'https://challenges.cloudflare.com'

/**
 * As diretivas do site inteiro, menos `script-src` e `style-src`, que o Astro monta com os *hashes*. A única
 * origem de fora é a da API, e só para conversa (`connect-src`): é de onde vem o catálogo e para onde vai a
 * reserva. Sem API (a demonstração), nem ela.
 */
export function diretivasDoSite(fonte: FonteConfigurada): Diretiva[] {
  const api = fonte.tipo === 'API' ? ` ${new URL(fonte.url).origin}` : ''
  return [
    "default-src 'self'",
    `connect-src 'self'${api}`,
    "img-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
}

/**
 * A política da página, para somar a ela. Sem política (`security.csp` desligado no `astro.config.mjs`), o
 * build quebra aqui — em vez de publicar o site sem nenhuma, em silêncio.
 */
export function politicaDaPagina(csp: AstroGlobal['csp']): PoliticaDaPagina {
  if (csp === undefined) throw new Error('A Content-Security-Policy está desligada: ligue security.csp no astro.config.mjs')
  return csp
}

/** O que uma página que usa o Turnstile soma: o script dele e o quadro do desafio. */
export function somarOTurnstile(politica: PoliticaDaPagina): void {
  politica.insertScriptResource(ORIGEM_DO_TURNSTILE)
  politica.insertDirective(`frame-src ${ORIGEM_DO_TURNSTILE}`)
}

/**
 * O *hash* com que a política aceita um `<style>` ou `<script>` escrito dentro da página. O Astro calcula o dos
 * que estão escritos no arquivo; o de um texto gerado (`set:html`) a página declara com isto — senão a política
 * leva o hash do vazio, e o navegador barra o de verdade. Só roda no build.
 */
export function hashDoTrecho(texto: string): `sha256-${string}` {
  return `sha256-${createHash('sha256').update(texto).digest('base64')}`
}
