/**
 * **A conta do cliente, do ponto de vista do site** — a porta, e as duas formas de atravessá-la (3.1 em diante).
 *
 * - **`contaHttp`** — as rotas `/conta` da API, atrás do próprio site (`/api`, ADR-0003). A sessão é um cookie do site,
 *   que o navegador manda e guarda sozinho: o site nunca o lê.
 * - **`contaEmMemoria`** — a demonstração (as prévias dos PRs e o site sem API): o domínio confere os campos como a
 *   API conferiria, e nada sai do navegador.
 *
 * Esta versão tem **o cadastro** (3.1). As seções seguintes acrescentam a confirmação (3.2), entrar e sair (3.3), a
 * senha esquecida (3.4) e Meus dados (4.2).
 *
 * ### O que cada resposta do `POST /conta` vira
 *
 * | resposta | resultado |
 * |---|---|
 * | `202` | `CONFIRA_O_EMAIL` — com conta nova ou com o e-mail que já tem conta: a API não revela (PO, 2026-10-21) |
 * | `422 CADASTRO_INVALIDO` | `INVALIDO`, com as pendências do domínio, campo por campo |
 * | `422 SENHA_FRACA` | `SENHA_FRACA`, com o motivo: `SENHA_COMUM` ou `SENHA_VAZADA` |
 * | `429` | `FALHA` por `LIMITE` |
 * | `403 DESAFIO_INVALIDO`, ou o desafio que não resolve | `FALHA` por `DESAFIO` |
 * | o desafio sem rede, a rede, ou qualquer outra | `FALHA` por `CONEXAO` |
 */
import {
  PENDENCIAS_DO_CADASTRO,
  pendenciasDoCadastro,
  type CadastroDaConta,
  type DataCalendario,
  type MotivoDaFalha,
  type PendenciaDoCadastro,
} from '@navegsistemas/domain'

import { DesafioSemConexao, type ObterDesafio } from './envio.js'
import type { Buscar } from './http.js'

/** Por que a senha foi recusada (3.1, C). A curta é pendência do domínio, conferida antes. */
export type MotivoDaSenhaFraca = 'SENHA_COMUM' | 'SENHA_VAZADA'

export type ResultadoDoCadastroNoSite =
  | { readonly caso: 'CONFIRA_O_EMAIL' }
  | { readonly caso: 'INVALIDO'; readonly pendencias: ReadonlySet<PendenciaDoCadastro> }
  | { readonly caso: 'SENHA_FRACA'; readonly motivo: MotivoDaSenhaFraca }
  | { readonly caso: 'FALHA'; readonly porque: MotivoDaFalha }

export interface ContaDoSite {
  /** Cria a conta. O desafio é pedido aqui, um por envio, como na reserva. */
  criar(cadastro: CadastroDaConta): Promise<ResultadoDoCadastroNoSite>
}

const falha = (porque: MotivoDaFalha = 'CONEXAO') => ({ caso: 'FALHA', porque }) as const

async function lerJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json()
  } catch {
    return null
  }
}

function listaDoCorpo(corpo: unknown): readonly unknown[] {
  const lista = (corpo as { pendencias?: unknown } | null)?.pendencias
  return Array.isArray(lista) ? lista : []
}

const fetchDoNavegador: Buscar = (url, init) => fetch(url, init)

export function contaHttp(urlDaApi: string, obterDesafio: ObterDesafio, buscar: Buscar = fetchDoNavegador): ContaDoSite {
  const raiz = `${urlDaApi.replace(/\/+$/, '')}/conta`
  return {
    async criar(cadastro) {
      let desafio: string
      try {
        desafio = await obterDesafio()
      } catch (erro) {
        return falha(erro instanceof DesafioSemConexao ? 'CONEXAO' : 'DESAFIO')
      }

      let resposta: Response
      try {
        resposta = await buscar(raiz, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...cadastro, desafio }),
        })
      } catch {
        return falha()
      }

      const dado = await lerJson(resposta)
      const codigo = (dado as { erro?: unknown } | null)?.erro
      switch (resposta.status) {
        case 202:
          return { caso: 'CONFIRA_O_EMAIL' }
        case 422: {
          const lista = listaDoCorpo(dado)
          if (codigo === 'SENHA_FRACA') {
            if (lista.includes('SENHA_VAZADA')) return { caso: 'SENHA_FRACA', motivo: 'SENHA_VAZADA' }
            if (lista.includes('SENHA_COMUM')) return { caso: 'SENHA_FRACA', motivo: 'SENHA_COMUM' }
          }
          const pendencias = lista.filter((p): p is PendenciaDoCadastro =>
            (PENDENCIAS_DO_CADASTRO as readonly unknown[]).includes(p),
          )
          return pendencias.length > 0 ? { caso: 'INVALIDO', pendencias: new Set(pendencias) } : falha()
        }
        case 429:
          return falha('LIMITE')
        case 403:
          return falha(codigo === 'DESAFIO_INVALIDO' ? 'DESAFIO' : 'CONEXAO')
        default:
          return falha()
      }
    },
  }
}

/**
 * **A conta da demonstração**: confere os campos pelo domínio, como a API, e responde como ela. Os cadastros ficam
 * na memória da aba, para os cenários conferirem; nenhum e-mail sai.
 */
export class ContaEmMemoria implements ContaDoSite {
  readonly cadastros: CadastroDaConta[] = []

  constructor(private readonly hoje: () => DataCalendario) {}

  async criar(cadastro: CadastroDaConta): Promise<ResultadoDoCadastroNoSite> {
    const pendencias = pendenciasDoCadastro(cadastro, this.hoje())
    if (pendencias.size > 0) return { caso: 'INVALIDO', pendencias }
    this.cadastros.push(cadastro)
    return { caso: 'CONFIRA_O_EMAIL' }
  }
}
