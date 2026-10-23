/**
 * **A API, de mentira, dentro do navegador** — o `GET /catalogo` e o `POST /reservas` respondidos pelo
 * Playwright, sem rede e sem Firestore.
 *
 * O build do E2E aponta o totem para `http://localhost:4599`, onde nada escuta: toda chamada para lá é
 * interceptada aqui. O que volta tem a forma do que a `naveg-api-vercel` devolve, e é montado **com o mesmo
 * domínio** que ela usa — o catálogo pelo `catalogoParaJson`, a reserva pelo `montarReserva` (ou pelo `montarEncomenda`) e pelo
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
  montarEncomenda,
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
  /** Os corpos do `POST /conta` (3.1), na ordem em que chegaram. */
  readonly cadastros: Record<string, unknown>[]
  /** Os e-mails do "Reenviar" (3.2). */
  readonly reenvios: string[]
  /** Alguém entrou (3.3): o que o `GET /conta/sessao` responde. */
  dentro: boolean
}

/** A senha que entra na API de mentira (3.3); qualquer outra "não confere". */
export const SENHA_QUE_ENTRA = 'rio e maré cheia'

/** Os códigos dos links de confirmação (3.2): um que confirma, um vencido; os outros não valem. */
export const CODIGO_QUE_CONFIRMA = 'c'.repeat(43)
export const CODIGO_VENCIDO = 'v'.repeat(43)

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
  const api: ApiFalsa = { pedidos: [], cadastros: [], reenvios: [], dentro: false }

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

      const identidade = { codigo: CODIGO_DO_SERVIDOR, criadoEm: agora }
      const montagem =
        lido.caso === 'ENCOMENDA'
          ? montarEncomenda(lido.encomenda, travessia.contexto, identidade)
          : montarReserva(lido.respostas, travessia.contexto, identidade)
      if (montagem.caso !== 'OK') return json(route, 422, { pendencias: montagem.caso === 'INCOERENTE' ? [...montagem.pendencias] : [] })

      const criada: ReservaCriadaJson = { codigo: CODIGO_DO_SERVIDOR, reserva: paraDocumento(montagem.reserva) }
      return json(route, 201, criada)
    }

    /* O cadastro (3.1): a API confere os campos com o domínio e responde sempre "Confira seu e-mail" (não revela se o
       e-mail já tem conta). A conferência dos campos é dos cenários de lá; aqui, o caminho do navegador. */
    if (caminho === '/conta' && pedido.method() === 'POST') {
      api.cadastros.push(pedido.postDataJSON() as Record<string, unknown>)
      if (opcoes.envio === 'FORA_DO_AR') return json(route, 503, { erro: 'CADASTRO_INDISPONIVEL' })
      return json(route, 202, { situacao: 'CONFIRA_O_EMAIL' })
    }

    /* O "Reenviar" (3.2): sempre 202, como a API. */
    if (caminho === '/conta/confirmacao/reenvio' && pedido.method() === 'POST') {
      api.reenvios.push((pedido.postDataJSON() as { email: string }).email)
      return json(route, 202, { situacao: 'CONFIRA_O_EMAIL' })
    }

    /* O link de confirmação (3.2): o código que o cenário escolheu confirma; o vencido, vence; o resto não vale. */
    if (caminho === '/conta/confirmacao' && pedido.method() === 'POST') {
      const { codigo } = pedido.postDataJSON() as { contaId: string; codigo: string }
      if (codigo === CODIGO_QUE_CONFIRMA) return json(route, 200, { situacao: 'EMAIL_CONFIRMADO' })
      if (codigo === CODIGO_VENCIDO) return json(route, 410, { erro: 'LINK_VENCIDO', mensagem: 'Este link venceu' })
      return json(route, 410, { erro: 'LINK_INVALIDO', mensagem: 'Este link não vale' })
    }

    /* Entrar, a sessão e o sair (3.3). A sessão é do cenário (`api.dentro`): o cookie de verdade é da API. */
    if (caminho === '/conta/sessao' && pedido.method() === 'GET') {
      return api.dentro
        ? json(route, 200, { situacao: 'DENTRO', confirmada: true })
        : json(route, 401, { erro: 'SEM_SESSAO', mensagem: 'Ninguém entrou neste aparelho' })
    }
    if (caminho === '/conta/entrar' && pedido.method() === 'POST') {
      const { senha } = pedido.postDataJSON() as { senha: string }
      if (senha !== SENHA_QUE_ENTRA) return json(route, 401, { erro: 'CREDENCIAIS_INVALIDAS', mensagem: 'E-mail ou senha não conferem' })
      api.dentro = true
      return json(route, 200, { situacao: 'DENTRO', confirmada: true })
    }
    /* Esqueci a senha (3.4): o pedido é sempre 202; a senha nova vale com o código que confirma. */
    if (caminho === '/conta/senha/esqueci' && pedido.method() === 'POST') {
      api.reenvios.push((pedido.postDataJSON() as { email: string }).email)
      return json(route, 202, { situacao: 'CONFIRA_O_EMAIL' })
    }
    if (caminho === '/conta/senha/nova' && pedido.method() === 'POST') {
      const { codigo } = pedido.postDataJSON() as { codigo: string }
      if (codigo !== CODIGO_QUE_CONFIRMA) return json(route, 410, { erro: 'LINK_INVALIDO', mensagem: 'Este link não vale' })
      api.dentro = true
      return json(route, 200, { situacao: 'DENTRO', confirmada: true })
    }
    if (caminho === '/conta/sair' && pedido.method() === 'POST') {
      api.dentro = false
      return route.fulfill({ status: 204, headers: CORS })
    }

    return json(route, 404, { erro: 'rota-desconhecida' })
  })

  return api
}
