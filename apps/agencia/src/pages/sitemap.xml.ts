/** O mapa do site para os buscadores (passo 13.3). O que entra nele: `conteudo/meta.ts`. */
import type { APIRoute } from 'astro'

import { sitemap } from '../conteudo/meta'
import { SITE } from '../conteudo/site'

export const GET: APIRoute = () =>
  new Response(sitemap(SITE.origem), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
