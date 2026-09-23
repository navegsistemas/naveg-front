/**
 * **O catálogo pela API da agência** — a `FonteDoCatalogo` de verdade, a partir do passo 9.
 *
 * O navegador não fala com o Firestore: pede `GET /catalogo` à `naveg-api-vercel`, que já responde o catálogo
 * recortado pela concessão. O que chega passa por `catalogoDoJson`, que lê cada item com os mesmos
 * decodificadores que leem o banco — a API é nossa, mas a resposta atravessou a rede.
 *
 * **Toda falha rejeita.** Resposta que não é 2xx, corpo que não é JSON, JSON que não é catálogo: o totem trata
 * tudo como "não foi possível carregar as saídas". Nenhuma delas vira um catálogo vazio, que o totem mostraria
 * como um dia sem saídas — a mentira mais convincente que uma tela pode contar.
 */
import { catalogoDoJson } from '@navegsistemas/domain'

import type { FonteDoCatalogo } from './portas.js'

export class FalhaAoCarregarOCatalogo extends Error {
  constructor(motivo: string) {
    super(`O catálogo não carregou: ${motivo}`)
    this.name = 'FalhaAoCarregarOCatalogo'
  }
}

/** O `fetch` que a fonte usa. Parâmetro para que os cenários não precisem de rede. */
export type Buscar = (url: string, init?: RequestInit) => Promise<Response>

/**
 * @param urlDaApi a raiz da API, com ou sem barra no fim (`https://api.exemplo.com.br`).
 */
export function catalogoHttp(urlDaApi: string, buscar: Buscar = (url, init) => fetch(url, init)): FonteDoCatalogo {
  const endereco = `${urlDaApi.replace(/\/+$/, '')}/catalogo`

  return {
    async carregar() {
      const resposta = await buscar(endereco, { headers: { Accept: 'application/json' } })
      if (!resposta.ok) throw new FalhaAoCarregarOCatalogo(`HTTP ${resposta.status}`)

      let corpo: unknown
      try {
        corpo = await resposta.json()
      } catch {
        throw new FalhaAoCarregarOCatalogo('a resposta não é JSON')
      }

      const catalogo = catalogoDoJson(corpo)
      if (catalogo === null) throw new FalhaAoCarregarOCatalogo('a resposta não tem a forma de um catálogo')
      return catalogo
    },
  }
}
