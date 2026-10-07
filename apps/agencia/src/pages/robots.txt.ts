/** O `robots.txt` (passo 13.3). Por que ele não proíbe nada: `conteudo/meta.ts`. */
import type { APIRoute } from 'astro'

import { robots } from '../conteudo/meta'
import { SITE } from '../conteudo/site'

export const GET: APIRoute = () =>
  new Response(robots(SITE.origem), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
