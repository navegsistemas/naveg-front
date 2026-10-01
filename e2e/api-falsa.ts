/**
 * **A API, de mentira, dentro do navegador** — o `GET /catalogo` e o `POST /reservas` respondidos pelo
 * Playwright, sem rede e sem Firestore.
 *
 * O build do E2E aponta o totem para `http://localhost:4599`, onde nada escuta: toda chamada para lá é
 * interceptada aqui. O que volta tem a forma do que a `naveg-api-vercel` devolve, e é montado **com o mesmo
 * domínio** que ela usa — o catálogo pelo `catalogoParaJson`, a reserva pelo `montarReserva` e pelo
 * `paraDocumento`. Assim o teste confere o caminho do navegador (o Turnstile, o `fetch`, o CORS, a leitura da
 * resposta, o link), e não uma resposta escrita à mão que pode divergir da real sem ninguém ver.
 *
 * O que a API de verdade faz além disso — conferir o token na Cloudflare, gravar sob as Rules, o limite por
 * IP — é dos cenários de lá (`emulador` e `fumaca`).
 */
import type { Page, Route } from '@playwright/test'

import {
  catalogoParaJson,
  InstanteLocal,
  montarReserva,
  paraDocumento,
  pedidoDeReservaDoJson,
  travessiasOfertadas,
  type PedidoDeReservaJson,
  type ReservaCriadaJson,
} from '@navegsistemas/domain'

import { CATALOGO_DE_DEMONSTRACAO } from '../apps/agencia/src/conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO } from '../apps/agencia/src/conteudo/operacao'

/** Para onde o build do E2E aponta o totem. Nada escuta aí: é tudo interceptado. */
export const URL_DA_API_FALSA = 'http://localhost:4599'

/** O código que a API de mentira dá a toda reserva — válido pelo alfabeto, e fácil de reconhecer. */
export const CODIGO_DO_SERVIDOR = 'NVG-E2E7K3'

/** O token que o widget do Turnstile entrega com a chave pública de teste (a que sempre passa). */
export const TOKEN_DE_TESTE_DO_TURNSTILE = 'XXXX.DUMMY.TOKEN.XXXX'

/** Como a API responde o envio. `'NORMAL'` é o caminho de quem reserva; os outros são as falhas que o totem trata. */
export type Comportamento = 'NORMAL' | 'PARTIU' | 'FORA_DO_AR'

export interface ApiFalsa {
  /** Os corpos do `POST /reservas`, na ordem em que chegaram. */
  readonly pedidos: PedidoDeReservaJson[]
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function json(route: Route, status: number, corpo: unknown) {
  return route.fulfill({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(corpo) })
}

export async function servirApiFalsa(
  page: Page,
  opcoes: { readonly catalogo?: 'NORMAL' | 'FORA_DO_AR'; readonly envio?: Comportamento } = {},
): Promise<ApiFalsa> {
  const api: ApiFalsa = { pedidos: [] }

  await page.route(`${URL_DA_API_FALSA}/**`, async (route) => {
    const pedido = route.request()
    const caminho = new URL(pedido.url()).pathname

    if (pedido.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })

    if (caminho === '/catalogo' && pedido.method() === 'GET') {
      if (opcoes.catalogo === 'FORA_DO_AR') return json(route, 503, { erro: 'indisponivel' })
      return json(route, 200, catalogoParaJson(CATALOGO_DE_DEMONSTRACAO))
    }

    if (caminho === '/reservas' && pedido.method() === 'POST') {
      const corpo = pedido.postDataJSON() as PedidoDeReservaJson
      api.pedidos.push(corpo)

      if (opcoes.envio === 'FORA_DO_AR') return json(route, 503, { erro: 'indisponivel' })
      if (opcoes.envio === 'PARTIU') return json(route, 409, { erro: 'travessia-fora-da-oferta' })

      /* O que a API faz: lê o pedido estrito, acha a travessia no catálogo ao vivo, e monta com o relógio dela. */
      const lido = pedidoDeReservaDoJson(corpo)
      if (lido === null) return json(route, 400, { erro: 'pedido-invalido' })
      const agora = InstanteLocal.emFuso(new Date(), FUSO_DA_OPERACAO)
      const travessia = travessiasOfertadas(CATALOGO_DE_DEMONSTRACAO, agora).find(
        (t) => t.contexto.ocorrencia.viagemId === lido.ocorrencia.viagemId && t.contexto.ocorrencia.data === lido.ocorrencia.data,
      )
      if (travessia === undefined) return json(route, 409, { erro: 'travessia-fora-da-oferta' })

      const montagem = montarReserva(lido.respostas, travessia.contexto, { codigo: CODIGO_DO_SERVIDOR, criadoEm: agora })
      if (montagem.caso !== 'OK') return json(route, 422, { pendencias: montagem.caso === 'INCOERENTE' ? [...montagem.pendencias] : [] })

      const criada: ReservaCriadaJson = { codigo: CODIGO_DO_SERVIDOR, reserva: paraDocumento(montagem.reserva) }
      return json(route, 201, criada)
    }

    return json(route, 404, { erro: 'rota-desconhecida' })
  })

  return api
}
