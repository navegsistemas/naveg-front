/**
 * **O catálogo pela API** — o que o adaptador faz com cada resposta possível.
 *
 * A régua é uma só: o catálogo que chega é o que a API mandou, e **toda falha rejeita**. Nenhuma resposta ruim
 * vira catálogo vazio, porque o totem mostraria um catálogo vazio como "não há saídas".
 */
import { describe, expect, it } from 'vitest'

import { catalogoParaJson, type CatalogoDoFluviapp } from '@navegsistemas/domain'

import { catalogoHttp, FalhaAoCarregarOCatalogo, type Buscar } from '../src/http.js'

const CATALOGO: CatalogoDoFluviapp = {
  localidades: [{ id: 'bel', municipio: 'Belém', uf: 'PA', codigoIbge: '1501402', ativo: true }],
  portos: [
    { id: 'p-a', nome: 'Terminal', localidadeId: 'bel', ativo: true },
    { id: 'p-b', nome: 'Cais', localidadeId: 'bel', ativo: true },
  ],
  rotas: [{ id: 'r', portoOrigemId: 'p-a', portoDestinoId: 'p-b', distanciaMn: 10, tempoMedioH: 1, ativo: true }],
  embarcacoes: [
    {
      id: 'e', nome: 'Lancha', tipo: 'LANCHA', capacidadeVeiculo: 0,
      capacidadeSuite2: 0, capacidadeSuite3: 0, capacidadeCamarote: 0, empresaId: 'x',
    },
  ],
  viagens: [{ id: 'v', rotaId: 'r', embarcacaoId: 'e', diaSemana: 'MONDAY', horaMin: 480, ativo: true }],
  atuacao: { embarcacaoIds: new Set(['e']), portoIds: new Set(['p-a', 'p-b']) },
}

/** Um `fetch` que devolve sempre a mesma resposta, e anota o que lhe pediram. */
function respondendo(resposta: () => Response): { buscar: Buscar; pedidos: string[] } {
  const pedidos: string[] = []
  return {
    pedidos,
    buscar: async (url) => {
      pedidos.push(url)
      return resposta()
    },
  }
}

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

describe('o catálogo pela API', () => {
  it('pede /catalogo na raiz da API — com ou sem barra no fim', async () => {
    for (const raiz of ['https://api.exemplo.com.br', 'https://api.exemplo.com.br/']) {
      const { buscar, pedidos } = respondendo(() => json(catalogoParaJson(CATALOGO)))
      await catalogoHttp(raiz, buscar).carregar()
      expect(pedidos).toEqual(['https://api.exemplo.com.br/catalogo'])
    }
  })

  it('devolve o catálogo que a API mandou, com a concessão de pé', async () => {
    const { buscar } = respondendo(() => json(catalogoParaJson(CATALOGO)))
    const catalogo = await catalogoHttp('https://api', buscar).carregar()
    expect(catalogo).toEqual(CATALOGO)
    expect(catalogo.atuacao?.embarcacaoIds.has('e')).toBe(true)
  })

  it('resposta de erro rejeita — inclusive a 500 que a API dá quando falta a concessão', async () => {
    for (const status of [404, 500, 503]) {
      const { buscar } = respondendo(() => json({ erro: 'FALHA_INTERNA', mensagem: 'Falha interna' }, status))
      await expect(catalogoHttp('https://api', buscar).carregar()).rejects.toBeInstanceOf(FalhaAoCarregarOCatalogo)
    }
  })

  it('corpo que não é JSON rejeita', async () => {
    const { buscar } = respondendo(() => new Response('<html>gateway</html>', { status: 200 }))
    await expect(catalogoHttp('https://api', buscar).carregar()).rejects.toBeInstanceOf(FalhaAoCarregarOCatalogo)
  })

  it('JSON que não é catálogo rejeita, em vez de virar um catálogo vazio', async () => {
    for (const corpo of [{}, [], { viagens: [] }, { ...catalogoParaJson(CATALOGO), atuacao: { embarcacaoIds: {}, portoIds: {} } }]) {
      const { buscar } = respondendo(() => json(corpo))
      await expect(catalogoHttp('https://api', buscar).carregar()).rejects.toBeInstanceOf(FalhaAoCarregarOCatalogo)
    }
  })

  it('falha de rede rejeita — e o totem diz que não carregou', async () => {
    const buscar: Buscar = async () => {
      throw new TypeError('Failed to fetch')
    }
    await expect(catalogoHttp('https://api', buscar).carregar()).rejects.toThrow('Failed to fetch')
  })
})
