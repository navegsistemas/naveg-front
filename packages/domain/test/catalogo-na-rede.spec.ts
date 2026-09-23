/**
 * **O catálogo na rede** — o recorte que o servidor faz antes de responder, e a ida e volta pelo JSON.
 *
 * As duas réguas são de igualdade, e é por isso que elas podem ser conferidas assim:
 *
 * - o recorte **não muda a oferta**: o que o totem oferta a partir do catálogo recortado é exatamente o que
 *   ofertaria a partir do pool inteiro;
 * - a ida e volta **não muda o catálogo**: `catalogoDoJson(JSON(catalogoParaJson(c)))` é `c`, com a concessão
 *   ainda de pé — que é o que um `JSON.stringify` ingênuo derrubaria.
 */
import { describe, expect, it } from 'vitest'

import { recortarPelaConcessao } from '../src/catalogo/recorte.js'
import { catalogoDoJson, catalogoParaJson } from '../src/catalogo/serializacao.js'
import { travessiasOfertadas, type CatalogoDoFluviapp } from '../src/catalogo/travessias.js'
import { CATALOGO_DE_EXEMPLO, instante } from './exemplos.js'

/** O exemplo, com o que ainda faltava para o recorte ter o que tirar. */
const POOL: CatalogoDoFluviapp = {
  ...CATALOGO_DE_EXEMPLO,
  localidades: [
    ...CATALOGO_DE_EXEMPLO.localidades,
    { id: 'mao', municipio: 'Manaus', uf: 'AM', codigoIbge: '1302603', ativo: true },
  ],
  portos: [...CATALOGO_DE_EXEMPLO.portos, { id: 'p-mao', nome: 'Porto de Manaus', localidadeId: 'mao', ativo: true }],
  embarcacoes: [
    ...CATALOGO_DE_EXEMPLO.embarcacoes,
    {
      id: 'e-de-outra-agencia', nome: 'Navio de Outra Agência', tipo: 'NAVIO', capacidadeVeiculo: 0,
      capacidadeSuite2: 2, capacidadeSuite3: 1, capacidadeCamarote: 6, empresaId: 'outra',
    },
  ],
  viagens: [
    ...CATALOGO_DE_EXEMPLO.viagens,
    { id: 'v-inativa', rotaId: 'r-ida', embarcacaoId: 'e-ferry', diaSemana: 'THURSDAY', horaMin: 8 * 60, ativo: false },
    { id: 'v-de-outra-agencia', rotaId: 'r-ida', embarcacaoId: 'e-de-outra-agencia', diaSemana: 'FRIDAY', horaMin: 6 * 60, ativo: true },
  ],
}

const ids = (itens: readonly { readonly id: string }[]) => itens.map((item) => item.id).sort()

/** Instantes espalhados pela semana, inclusive depois de saídas já partidas. */
const AGORAS = [
  '2026-10-12T00:00:00',
  '2026-10-13T08:00:00',
  '2026-10-14T07:00:00',
  '2026-10-14T21:31:00',
  '2026-10-17T23:59:00',
].map(instante)

describe('o recorte pela concessão', () => {
  const recortado = recortarPelaConcessao(POOL)

  it('fica só o que a NAVEG pode vender, e o que isso cita', () => {
    expect(ids(recortado.viagens)).toEqual(['v-ferry', 'v-lancha'])
    expect(ids(recortado.rotas)).toEqual(['r-ida'])
    expect(ids(recortado.portos)).toEqual(['p-bel', 'p-sou'])
    expect(ids(recortado.localidades)).toEqual(['bel', 'sou'])
    expect(ids(recortado.embarcacoes)).toEqual(['e-ferry', 'e-lancha'])
  })

  it('o pool das outras empresas não sai: nem a embarcação, nem o porto, nem a cidade', () => {
    const texto = JSON.stringify(catalogoParaJson(recortado))
    for (const alheio of ['e-de-outra-agencia', 'Navio de Outra Agência', 'p-mao', 'Manaus', 'p-fora', 'r-inativa']) {
      expect(texto).not.toContain(alheio)
    }
  })

  it('a concessão sai recortada também — só os ids que as viagens mantidas usam', () => {
    expect([...(recortado.atuacao?.embarcacaoIds ?? [])].sort()).toEqual(['e-ferry', 'e-lancha'])
    expect([...(recortado.atuacao?.portoIds ?? [])].sort()).toEqual(['p-bel', 'p-sou'])
  })

  it('não muda a oferta: para qualquer instante, o totem oferta o mesmo a partir do recorte', () => {
    for (const agora of AGORAS) {
      expect(travessiasOfertadas(recortado, agora)).toEqual(travessiasOfertadas(POOL, agora))
    }
    /* E há o que ofertar — uma igualdade entre duas listas vazias não provaria nada. */
    expect(travessiasOfertadas(recortado, instante('2026-10-13T08:00:00')).length).toBeGreaterThan(0)
  })

  it('sem concessão, o recorte é vazio e continua sem concessão', () => {
    expect(recortarPelaConcessao({ ...POOL, atuacao: null })).toEqual({
      viagens: [], rotas: [], portos: [], localidades: [], embarcacoes: [], atuacao: null,
    })
  })
})

describe('a ida e volta pelo JSON', () => {
  const pelaRede = (catalogo: CatalogoDoFluviapp) => catalogoDoJson(JSON.parse(JSON.stringify(catalogoParaJson(catalogo))))

  it('volta igual — com a concessão de pé', () => {
    const recortado = recortarPelaConcessao(POOL)
    const volta = pelaRede(recortado)
    expect(volta).toEqual(recortado)
    expect(volta?.atuacao?.embarcacaoIds.has('e-ferry')).toBe(true)
  })

  it('é o defeito que ela existe para evitar: sem ela, a concessão chegaria como {}', () => {
    const ingenuo = JSON.parse(JSON.stringify(CATALOGO_DE_EXEMPLO)) as { atuacao: unknown }
    expect(ingenuo.atuacao).toEqual({ embarcacaoIds: {}, portoIds: {} })
    /* …e o `catalogoDoJson` recusa essa forma, em vez de ler uma concessão vazia. */
    expect(catalogoDoJson(ingenuo)).toBeNull()
  })

  it('o totem oferta o mesmo do outro lado da rede', () => {
    const agora = instante('2026-10-13T08:00:00')
    const volta = pelaRede(POOL)
    expect(volta).not.toBeNull()
    expect(travessiasOfertadas(volta as CatalogoDoFluviapp, agora)).toEqual(travessiasOfertadas(POOL, agora))
  })

  it('sem concessão continua sem concessão', () => {
    expect(pelaRede({ ...POOL, atuacao: null })?.atuacao).toBeNull()
  })

  it('o que não é catálogo é null, e não um catálogo vazio — o totem tem de dizer que falhou', () => {
    const bom = catalogoParaJson(CATALOGO_DE_EXEMPLO)
    const { viagens: _, ...semViagens } = bom
    const { atuacao: __, ...semConcessao } = bom
    for (const torto of [null, [], 'catálogo', {}, semViagens, semConcessao, { ...bom, rotas: {} }, { ...bom, atuacao: { portoIds: [] } }]) {
      expect(catalogoDoJson(torto)).toBeNull()
    }
  })

  it('cada item passa pelo decodificador do documento: o que o banco recusaria, a rede também recusa', () => {
    const bom = catalogoParaJson(CATALOGO_DE_EXEMPLO)
    const adulterado = {
      ...bom,
      viagens: [...bom.viagens, { id: 'v-dia-torto', rotaId: 'r-ida', embarcacaoId: 'e-ferry', diaSemana: 'QUARTA', horaMin: 0 }],
      embarcacoes: [...bom.embarcacoes, { id: 'e-sem-tipo', nome: 'Sem tipo' }, { nome: 'Sem id', tipo: 'LANCHA' }],
    }
    const volta = catalogoDoJson(adulterado)
    expect(ids(volta?.viagens ?? [])).toEqual(ids(CATALOGO_DE_EXEMPLO.viagens))
    expect(ids(volta?.embarcacoes ?? [])).toEqual(ids(CATALOGO_DE_EXEMPLO.embarcacoes))
  })
})
