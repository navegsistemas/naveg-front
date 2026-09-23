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
 * ### O que cada resposta da API vira
 *
 * | resposta | resultado |
 * |---|---|
 * | `201` | `ENVIADA`, com a reserva do servidor |
 * | `409` (a travessia saiu da oferta: partiu, foi inativada, saiu da concessão) | `INCOERENTE`, com `VALIDADE` — o totem já sabe dizer "escolha outra saída" |
 * | `422` com pendências | `INCOERENTE`, com elas |
 * | qualquer outra, ou a rede | `FALHA` — "não foi possível enviar agora" |
 */
import {
  enviarReserva,
  PENDENCIAS_DA_RESERVA,
  paraDominio,
  type InstanteLocal,
  type PedidoDeReservaJson,
  type PendenciaDaReserva,
  type ReservaRepositorio,
  type RespostasDaReserva,
  type ResultadoDoEnvio,
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

/** O envio que monta e grava ali mesmo, pelo repositório dado. */
export function envioLocal(repositorio: ReservaRepositorio): EnvioDaReserva {
  return {
    enviar: ({ travessia, respostas, criadoEm }) =>
      enviarReserva({ respostas, contexto: travessia.contexto, criadoEm, repositorio }),
  }
}

/** Quem entrega o token do desafio (o Turnstile, na página). Um token por envio: eles não se reaproveitam. */
export type ObterDesafio = () => Promise<string>

const falha = (motivo: string): ResultadoDoEnvio => ({ caso: 'FALHA', motivo })

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

export function envioHttp(
  urlDaApi: string,
  obterDesafio: ObterDesafio,
  buscar: Buscar = (url, init) => fetch(url, init),
): EnvioDaReserva {
  const endereco = `${urlDaApi.replace(/\/+$/, '')}/reservas`

  return {
    async enviar({ travessia, respostas }) {
      let desafio: string
      try {
        desafio = await obterDesafio()
      } catch {
        return falha('o desafio não foi resolvido')
      }

      const corpo: PedidoDeReservaJson = {
        viagemId: travessia.contexto.ocorrencia.viagemId,
        data: travessia.contexto.ocorrencia.data,
        respostas,
        desafio,
      }

      let resposta: Response
      try {
        resposta = await buscar(endereco, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(corpo),
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
        case 422: {
          const pendencias = pendenciasDoCorpo(dado)
          return pendencias.length > 0 ? { caso: 'INCOERENTE', pendencias: new Set(pendencias) } : falha('HTTP 422')
        }
        default:
          return falha(`HTTP ${resposta.status}`)
      }
    },
  }
}
