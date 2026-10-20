/**
 * **Enviar a reserva, do ponto de vista do totem** — a porta, e as duas formas de atravessá-la.
 *
 * O totem não sabe se a reserva é montada ali mesmo ou num servidor. Ele entrega a travessia e as respostas, e
 * recebe de volta o resultado — a reserva enviada, as pendências, ou a falha.
 *
 * - **`envioLocal`** — o `enviarReserva` do domínio, com um repositório qualquer (em memória, na demonstração e
 *   nos cenários). O código e o instante nascem no navegador.
 * - **`envioHttp`** — o `POST /reservas` da API. O navegador manda **só o que a pessoa pode afirmar** (a
 *   ocorrência, as respostas e o desafio), e o servidor monta a reserva com o código e o relógio dele. O que
 *   volta é a reserva **como foi gravada**, lida pelo mesmo codec que o aplicativo usa (`paraDominio`) — o
 *   código que o totem mostra é o do documento, nunca um gerado aqui.
 *
 * A seção de encomenda tem os mesmos dois, com as respostas dela: `envioLocalDaEncomenda` e
 * `envioHttpDaEncomenda`. A rota é a mesma — o corpo leva `encomenda` no lugar de `respostas` —, e as respostas
 * da API viram o mesmo resultado.
 *
 * ### O que cada resposta da API vira
 *
 * | resposta | resultado |
 * |---|---|
 * | `201` | `ENVIADA`, com a reserva do servidor |
 * | `409` (a travessia saiu da oferta: partiu, foi inativada, saiu da concessão) | `INCOERENTE`, com `VALIDADE` — o totem já sabe dizer "escolha outra saída" |
 * | `422` com pendências | `INCOERENTE`, com elas |
 * | `429` (`LIMITE_EXCEDIDO`) | `FALHA` por `LIMITE` — envios demais deste aparelho (2.6) |
 * | `403` com `DESAFIO_INVALIDO`, ou o desafio que não se resolve | `FALHA` por `DESAFIO` |
 * | o desafio que não se resolve por falta de rede (`DesafioSemConexao`) | `FALHA` por `CONEXAO` |
 * | qualquer outra, ou a rede | `FALHA` por `CONEXAO` — "não foi possível enviar agora" |
 */
import {
  type MotivoDaFalha,
  enviarEncomenda,
  enviarReserva,
  encomendaPeloSite,
  respostasDaEncomendaDoSite,
  PENDENCIAS_DA_RESERVA,
  paraDominio,
  type InstanteLocal,
  type PedidoDeEncomendaJson,
  type PedidoDePassagemJson,
  type PendenciaDaReserva,
  type Reserva,
  type ReservaRepositorio,
  type RespostasDaEncomenda,
  type RespostasDaReserva,
  type ResultadoDoEnvio,
  type ResultadoDoEnvioDaEncomenda,
  type TravessiaOfertada,
} from '@navegsistemas/domain'

import type { Buscar } from './http.js'

export interface PedidoDoTotem {
  readonly travessia: TravessiaOfertada
  readonly respostas: RespostasDaReserva
  /** O relógio no fuso da operação. O envio local o usa; o HTTP o ignora — o servidor usa o dele. */
  readonly criadoEm: InstanteLocal
}

export interface EnvioDaReserva {
  enviar(pedido: PedidoDoTotem): Promise<ResultadoDoEnvio>
}

/** O pedido da seção de encomenda: a travessia, as respostas dela e o relógio. */
export interface PedidoDaEncomenda {
  readonly travessia: TravessiaOfertada
  readonly respostas: RespostasDaEncomenda
  readonly criadoEm: InstanteLocal
}

export interface EnvioDaEncomenda {
  enviar(pedido: PedidoDaEncomenda): Promise<ResultadoDoEnvioDaEncomenda>
}

/** O envio que monta e grava ali mesmo, pelo repositório dado. */
export function envioLocal(repositorio: ReservaRepositorio): EnvioDaReserva {
  return {
    enviar: ({ travessia, respostas, criadoEm }) =>
      enviarReserva({ respostas, contexto: travessia.contexto, criadoEm, repositorio }),
  }
}

/** O mesmo, para a encomenda. */
export function envioLocalDaEncomenda(repositorio: ReservaRepositorio): EnvioDaEncomenda {
  return {
    enviar: ({ travessia, respostas, criadoEm }) =>
      enviarEncomenda({ respostas, contexto: travessia.contexto, criadoEm, repositorio }),
  }
}

/** Quem entrega o token do desafio (o Turnstile, na página). Um token por envio: eles não se reaproveitam. */
export type ObterDesafio = () => Promise<string>

/**
 * **O desafio que não resolveu porque a internet caiu**, e não porque a Cloudflare desconfiou. Quem obtém o desafio
 * rejeita com este erro quando sabe que foi a rede (o script não carregou, ou o aparelho está fora da rede), e o
 * envio responde como a conexão: "a internet pode ter caído…", com o **Tentar de novo**. Sem ele, o modo avião dava
 * "a verificação contra robô não passou" (aceite do roteiro 3, PO, 2026-10-20).
 */
export class DesafioSemConexao extends Error {
  override readonly name = 'DesafioSemConexao'
}

/** O que a API pode responder, já lido: a reserva gravada, as pendências, ou a falha. */
type RespostaDaApi =
  | { readonly caso: 'ENVIADA'; readonly reserva: Reserva }
  | { readonly caso: 'INCOERENTE'; readonly pendencias: ReadonlySet<PendenciaDaReserva> }
  | { readonly caso: 'FALHA'; readonly motivo: string; readonly porque: MotivoDaFalha }

/** A falha, com o porquê que a tela usa (2.6, A). Na dúvida, a conexão: é o que a pessoa pode resolver tentando de novo. */
const falha = (motivo: string, porque: MotivoDaFalha = 'CONEXAO') => ({ caso: 'FALHA', motivo, porque }) as const

function pendenciasDoCorpo(corpo: unknown): PendenciaDaReserva[] {
  const lista = (corpo as { pendencias?: unknown } | null)?.pendencias
  if (!Array.isArray(lista)) return []
  return lista.filter((p): p is PendenciaDaReserva => (PENDENCIAS_DA_RESERVA as readonly unknown[]).includes(p))
}

async function lerJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json()
  } catch {
    return null
  }
}

/**
 * **O `POST /reservas`, de um pedido qualquer.** O corpo chega sem o desafio — ele é pedido aqui, um por envio —,
 * e a resposta volta lida pelo codec.
 */
async function postar(
  endereco: string,
  obterDesafio: ObterDesafio,
  buscar: Buscar,
  corpoSemDesafio: Omit<PedidoDePassagemJson, 'desafio'> | Omit<PedidoDeEncomendaJson, 'desafio'>,
): Promise<RespostaDaApi> {
  let desafio: string
  try {
    desafio = await obterDesafio()
  } catch (erro) {
    return erro instanceof DesafioSemConexao
      ? falha('o desafio não foi resolvido: sem conexão')
      : falha('o desafio não foi resolvido', 'DESAFIO')
  }

  let resposta: Response
  try {
    resposta = await buscar(endereco, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...corpoSemDesafio, desafio }),
    })
  } catch {
    return falha('sem conexão com a API')
  }

  const dado = await lerJson(resposta)
  switch (resposta.status) {
    case 201: {
      const { codigo, reserva } = (dado ?? {}) as { codigo?: unknown; reserva?: unknown }
      const lida = typeof codigo === 'string' ? paraDominio(codigo, reserva) : null
      return lida === null ? falha('a API respondeu uma reserva ilegível') : { caso: 'ENVIADA', reserva: lida }
    }
    case 409:
      return { caso: 'INCOERENTE', pendencias: new Set<PendenciaDaReserva>(['VALIDADE']) }
    /* Envios demais deste endereço (20 em 10 minutos): tentar de novo agora falha de novo. */
    case 429:
      return falha('HTTP 429', 'LIMITE')
    case 403:
      return falha('HTTP 403', (dado as { erro?: unknown } | null)?.erro === 'DESAFIO_INVALIDO' ? 'DESAFIO' : 'CONEXAO')
    case 422: {
      const pendencias = pendenciasDoCorpo(dado)
      return pendencias.length > 0 ? { caso: 'INCOERENTE', pendencias: new Set(pendencias) } : falha('HTTP 422')
    }
    default:
      return falha(`HTTP ${resposta.status}`)
  }
}

function enderecoDasReservas(urlDaApi: string): string {
  return `${urlDaApi.replace(/\/+$/, '')}/reservas`
}

const fetchDoNavegador: Buscar = (url, init) => fetch(url, init)

export function envioHttp(urlDaApi: string, obterDesafio: ObterDesafio, buscar: Buscar = fetchDoNavegador): EnvioDaReserva {
  const endereco = enderecoDasReservas(urlDaApi)
  return {
    /* A encomenda do site (2.7) vai como pedido de encomenda: é por ele que a API aplica a semana da encomenda e monta
       com as regras dela. O resto vai como sempre, com as respostas. */
    enviar: ({ travessia, respostas }) =>
      postar(endereco, obterDesafio, buscar, {
        viagemId: travessia.contexto.ocorrencia.viagemId,
        data: travessia.contexto.ocorrencia.data,
        ...(encomendaPeloSite(respostas) ? { encomenda: respostasDaEncomendaDoSite(respostas) } : { respostas }),
      }),
  }
}

export function envioHttpDaEncomenda(
  urlDaApi: string,
  obterDesafio: ObterDesafio,
  buscar: Buscar = fetchDoNavegador,
): EnvioDaEncomenda {
  const endereco = enderecoDasReservas(urlDaApi)
  return {
    async enviar({ travessia, respostas }) {
      const resultado = await postar(endereco, obterDesafio, buscar, {
        viagemId: travessia.contexto.ocorrencia.viagemId,
        data: travessia.contexto.ocorrencia.data,
        encomenda: respostas,
      })
      if (resultado.caso !== 'ENVIADA') return resultado
      /* A API gravou o que lhe foi pedido; uma reserva de passagem de volta seria outra API. */
      const { reserva } = resultado
      return reserva.categoria === 'ENCOMENDA'
        ? { caso: 'ENVIADA', reserva }
        : falha('a API respondeu uma reserva que não é de encomenda')
    },
  }
}
