/**
 * **O catálogo** — os documentos do fluviapp lidos como o aplicativo os lê, e as travessias que a agência
 * pode oferecer agora.
 *
 * Duas famílias de cenário, e a régua das duas é a paridade com o aplicativo: o decodificador recusa **o que
 * o `toX()` recusa e só isso**; a disponibilidade é **a do `disponiveisAPartirDe`**, linha a linha.
 */
import { describe, expect, it } from 'vitest'

import {
  alteracaoDoDocumento,
  atuacaoDoDocumento,
  embarcacaoDoDocumento,
  localidadeDoDocumento,
  portoDoDocumento,
  rotaDoDocumento,
  viagemDoDocumento,
} from '../src/catalogo/documentos.js'
import { recortarPelaConcessao } from '../src/catalogo/recorte.js'
import { catalogoDoJson, catalogoParaJson } from '../src/catalogo/serializacao.js'
import { travessiasOfertadas, type CatalogoDoFluviapp } from '../src/catalogo/travessias.js'
import type { DataCalendario } from '../src/primitivos/calendario.js'
import { montarReserva } from '../src/reserva/montagem-da-reserva.js'
import { roteiroDaReserva } from '../src/reserva/roteiro-da-reserva.js'
import type { Rota } from '../src/rota/rota.js'
import type { AlteracaoDaSaida } from '../src/viagem/alteracao-da-saida.js'
import { chegadaEstimada, disponiveisAPartirDe, type Viagem } from '../src/viagem/viagem.js'
import { CATALOGO_DE_EXEMPLO, CLIENTE, instante } from './exemplos.js'

describe('os decodificadores recusam o que o aplicativo recusa, e só isso', () => {
  it('viagem: sem rota, sem embarcação ou com dia desconhecido não vira nada', () => {
    const boa = {
      rotaId: 'r1',
      embarcacaoId: 'e1',
      diaSemana: 'TUESDAY',
      horaMin: 1080,
      ativo: true,
      portoEmbarqueId: 'p1',
      portoDesembarqueId: 'p2',
    }
    expect(viagemDoDocumento('v1', boa)).toEqual({ id: 'v1', ...boa })
    expect(viagemDoDocumento('v1', { ...boa, rotaId: '' })).toBeNull()
    expect(viagemDoDocumento('v1', { ...boa, embarcacaoId: '  ' })).toBeNull()
    expect(viagemDoDocumento('v1', { ...boa, diaSemana: 'TERCA' })).toBeNull()
    /* `DayOfWeek.valueOf` é estrito: o aplicativo recusa "tuesday", então o site também. */
    expect(viagemDoDocumento('v1', { ...boa, diaSemana: 'tuesday' })).toBeNull()
  })

  it('viagem: os padrões do DocumentoBruto — hora ausente é 0, ativo ausente é true, número trunca', () => {
    const lida = viagemDoDocumento('v1', { rotaId: 'r1', embarcacaoId: 'e1', diaSemana: 'MONDAY', horaMin: 1080.9 })
    expect(lida).toMatchObject({ horaMin: 1080, ativo: true })
    expect(viagemDoDocumento('v1', { rotaId: 'r1', embarcacaoId: 'e1', diaSemana: 'MONDAY' })?.horaMin).toBe(0)
  })

  it('viagem: sem os cais não é recusada, como no KMP — a concessão é que não a cobre', () => {
    expect(viagemDoDocumento('v1', { rotaId: 'r1', embarcacaoId: 'e1', diaSemana: 'MONDAY' })).toMatchObject({
      portoEmbarqueId: '',
      portoDesembarqueId: '',
    })
  })

  it('rota, porto, localidade, embarcação: cada um recusa só a referência que o faz ser o que é', () => {
    expect(rotaDoDocumento('r', { localidadeOrigemId: 'a' })).toBeNull()
    expect(rotaDoDocumento('r', { localidadeOrigemId: 'a', localidadeDestinoId: 'b' })).toMatchObject({
      tempoMedioH: 0,
      ativo: true,
    })
    /* A rota de antes, só com os portos, não é rota (fluviapp-kmp#51): os portos são legado e não se leem. */
    expect(rotaDoDocumento('r', { portoOrigemId: 'a', portoDestinoId: 'b' })).toBeNull()
    expect(rotaDoDocumento('r', { portoOrigemId: 'a', localidadeOrigemId: 'x', localidadeDestinoId: 'y' })).not.toHaveProperty(
      'portoOrigemId',
    )
    expect(portoDoDocumento('p', { nome: 'Cais' })).toBeNull()
    expect(portoDoDocumento('p', { localidadeId: 'l' })).toEqual({ id: 'p', nome: '', localidadeId: 'l', ativo: true })
    expect(localidadeDoDocumento('l', { municipio: 'Belém', uf: 'XX' })).toBeNull()
    expect(localidadeDoDocumento('l', { municipio: 'Belém', uf: 'PA' })?.uf).toBe('PA')
    expect(embarcacaoDoDocumento('e', { nome: 'Sem tipo' })).toBeNull()
    expect(embarcacaoDoDocumento('e', { nome: 'Nave', tipo: 'NAVIO' })?.tipo).toBe('NAVIO')
  })

  it('alteração: recusa sem viagem, data ilegível, algum cais ou hora; e só leva o que o site mostra', () => {
    const boa = {
      viagemId: 'v1',
      data: '2026-10-14',
      empresaId: 'moc',
      portoEmbarqueId: 'p1',
      portoDesembarqueId: 'p2',
      horaMin: 1140,
      motivo: 'Cais em obra',
      porId: 'uid-da-transportadora',
      em: '2026-10-12T10:00:00',
    }
    expect(alteracaoDoDocumento('v1@2026-10-14', boa)).toEqual({
      ocorrencia: { viagemId: 'v1', data: '2026-10-14' },
      portoEmbarqueId: 'p1',
      portoDesembarqueId: 'p2',
      horaMin: 1140,
      motivo: 'Cais em obra',
    })
    expect(alteracaoDoDocumento('x', { ...boa, viagemId: '' })).toBeNull()
    expect(alteracaoDoDocumento('x', { ...boa, data: '14/10/2026' })).toBeNull()
    expect(alteracaoDoDocumento('x', { ...boa, portoEmbarqueId: ' ' })).toBeNull()
    expect(alteracaoDoDocumento('x', { ...boa, portoDesembarqueId: undefined })).toBeNull()
    expect(alteracaoDoDocumento('x', { ...boa, horaMin: -1 })).toBeNull()
    const { horaMin: _semHora, ...semHora } = boa
    expect(alteracaoDoDocumento('x', semHora)).toBeNull()
    /* Meia-noite é hora: 0 não é "ausente". */
    expect(alteracaoDoDocumento('x', { ...boa, horaMin: 0 })?.horaMin).toBe(0)
  })

  it('a concessão: listas de ids, ignorando o que não é texto', () => {
    const atuacao = atuacaoDoDocumento({ embarcacaoIds: ['e1', 42, 'e2'], portoIds: ['p1'] })
    expect([...(atuacao?.embarcacaoIds ?? [])]).toEqual(['e1', 'e2'])
    expect(atuacaoDoDocumento(null)).toBeNull()
  })
})

describe('a disponibilidade é a do aplicativo', () => {
  const terca18h: Viagem = {
    id: 'v',
    rotaId: 'r',
    embarcacaoId: 'e',
    diaSemana: 'TUESDAY',
    horaMin: 18 * 60,
    ativo: true,
    portoEmbarqueId: 'a',
    portoDesembarqueId: 'b',
  }

  it('só a data cujo dia bate, dentro da janela de sete dias', () => {
    const lista = disponiveisAPartirDe([terca18h], instante('2026-10-12T08:00:00'))
    expect(lista.map((o) => o.data)).toEqual(['2026-10-13'])
  })

  it('a saída das 18:00 não está disponível às 18:01 do mesmo dia — e está exatamente às 18:00', () => {
    expect(disponiveisAPartirDe([terca18h], instante('2026-10-13T18:01:00')).map((o) => o.data)).toEqual([])
    expect(disponiveisAPartirDe([terca18h], instante('2026-10-13T18:00:00')).map((o) => o.data)).toEqual(['2026-10-13'])
  })

  it('viagem inativa não é ofertada — é registro do passado', () => {
    expect(disponiveisAPartirDe([{ ...terca18h, ativo: false }], instante('2026-10-12T08:00:00'))).toEqual([])
  })

  it('a hora da alteração decide se o barco já partiu: o adiado ainda está, o antecipado já foi', () => {
    const adiada = new Map([['v@2026-10-13', 20 * 60]])
    expect(disponiveisAPartirDe([terca18h], instante('2026-10-13T19:00:00'), 7, adiada).map((o) => o.horaMin)).toEqual([20 * 60])
    const antecipada = new Map([['v@2026-10-13', 16 * 60]])
    expect(disponiveisAPartirDe([terca18h], instante('2026-10-13T17:00:00'), 7, antecipada)).toEqual([])
  })

  it('a chegada estimada de uma travessia longa cai noutro dia', () => {
    const rota: Rota = { id: 'r', localidadeOrigemId: 'a', localidadeDestinoId: 'b', distanciaMn: 0, tempoMedioH: 30, ativo: true }
    expect(chegadaEstimada({ ...terca18h, horaMin: 21 * 60 }, rota)).toEqual({
      horaMin: 3 * 60,
      diasDepois: 2,
      diaSemana: 'THURSDAY',
    })
  })
})

describe('as travessias ofertadas', () => {
  const BASE = CATALOGO_DE_EXEMPLO
  const TERCA = instante('2026-10-13T08:00:00')

  it('só o que a concessão cobre, de rota ativa, com embarcação que resolve — ordenado pela partida', () => {
    /* `e-outra` está concedida mas não existe na coleção: sem tipo, não se sabe se leva veículo. */
    expect(travessiasOfertadas(BASE, TERCA).map((t) => t.id)).toEqual([
      'v-lancha@2026-10-14',
      'v-ferry@2026-10-14',
    ])
  })

  it('sem concessão, nada — a agência não oferta o pool inteiro', () => {
    expect(travessiasOfertadas({ ...BASE, atuacao: null }, TERCA)).toEqual([])
  })

  it('os rótulos: as cidades da rota, o cais "Porto · Município/UF", o dia, a hora, a chegada', () => {
    const ferry = travessiasOfertadas(BASE, TERCA).find((t) => t.id === 'v-ferry@2026-10-14')
    expect(ferry?.alteracao).toBeNull()
    expect(ferry?.rotulos).toEqual({
      origem: 'Belém/PA',
      destino: 'Soure/PA',
      embarque: 'Terminal Hidroviário · Belém/PA',
      desembarque: 'Porto de Camará · Soure/PA',
      partida: 'Quarta-feira, 14/10 · 21:30',
      /* 21:30 + 3h30 = 01:00 do dia seguinte — e o aplicativo escreve o dia quando muda. */
      chegada: 'Qui 01:00',
      embarcacao: 'Ferry Exemplo · Ferry Boat',
      alteracao: null,
    })
  })

  it('cada travessia leva o contexto pronto para o totem — casco e partida inclusos', () => {
    const [lancha, ferry] = travessiasOfertadas(BASE, TERCA)
    expect(lancha?.contexto).toEqual({
      ocorrencia: { viagemId: 'v-lancha', data: '2026-10-14' },
      tipoEmbarcacao: 'LANCHA',
      partida: '2026-10-14T07:00:00',
    })
    /* O casco já recorta o roteiro: a lancha não oferece veículo. */
    expect(roteiroDaReserva({}, (lancha as NonNullable<typeof lancha>).contexto).nos[0]).toEqual({
      passo: 'CATEGORIA',
      opcoes: ['PASSAGEIRO'],
    })
    expect(ferry?.contexto.tipoEmbarcacao).toBe('FERRY_BOAT')
  })

  it('do catálogo à reserva: a validade é a partida da travessia escolhida', () => {
    const ferry = travessiasOfertadas(BASE, TERCA).find((t) => t.id === 'v-ferry@2026-10-14')
    if (ferry === undefined) throw new Error('exemplo quebrado')
    const resultado = montarReserva(
      { categoria: 'PASSAGEIRO', acomodacao: 'REDE', tipo: 'INTEIRA', cliente: CLIENTE },
      ferry.contexto,
      { codigo: 'NVG-7K3QP2', criadoEm: TERCA },
    )
    expect(resultado.caso === 'OK' && resultado.reserva.expiraEm).toBe('2026-10-14T21:30:00')
    expect(resultado.caso === 'OK' && resultado.reserva.ocorrencia).toEqual({ viagemId: 'v-ferry', data: '2026-10-14' })
  })

  it('a saída que já partiu some da oferta', () => {
    expect(travessiasOfertadas(BASE, instante('2026-10-14T08:00:00')).map((t) => t.id)).toEqual(['v-ferry@2026-10-14'])
  })
})

/*
 * A rota geográfica e a alteração da saída (fluviapp-kmp#51 e #52, ADR-0021 de lá). O caso é o da MOCORONGO: a rota
 * é Belém → Macapá, e o barco atraca no Porto do Grego, em Santana (PO, 2026-10-13: "a rota é o marketing").
 */
describe('a rota liga cidades, o cais é da viagem, e uma data pode ser alterada', () => {
  const QUARTA = '2026-10-14' as DataCalendario
  const TERCA = instante('2026-10-13T08:00:00')
  const MACAPA: CatalogoDoFluviapp = {
    localidades: [
      { id: 'belem', municipio: 'Belém', uf: 'PA', codigoIbge: '1501402', ativo: true },
      { id: 'macapa', municipio: 'Macapá', uf: 'AP', codigoIbge: '1600303', ativo: true },
      { id: 'santana', municipio: 'Santana', uf: 'AP', codigoIbge: '1600600', ativo: true },
    ],
    portos: [
      { id: 'p-terminal', nome: 'Terminal Hidroviário', localidadeId: 'belem', ativo: true },
      { id: 'p-grego', nome: 'Porto do Grego', localidadeId: 'santana', ativo: true },
      { id: 'p-outro', nome: 'Cais da obra', localidadeId: 'santana', ativo: true },
      { id: 'p-de-ninguem', nome: 'Porto de outra transportadora', localidadeId: 'belem', ativo: true },
    ],
    rotas: [
      { id: 'r', localidadeOrigemId: 'belem', localidadeDestinoId: 'macapa', distanciaMn: 300, tempoMedioH: 24, ativo: true },
    ],
    embarcacoes: [
      {
        id: 'e', nome: 'Navio', tipo: 'NAVIO', capacidadeVeiculo: 6,
        capacidadeSuite2: 2, capacidadeSuite3: 2, capacidadeCamarote: 4, empresaId: 'moc',
      },
    ],
    viagens: [
      {
        id: 'v', rotaId: 'r', embarcacaoId: 'e', diaSemana: 'WEDNESDAY', horaMin: 18 * 60, ativo: true,
        portoEmbarqueId: 'p-terminal', portoDesembarqueId: 'p-grego',
      },
    ],
    atuacao: { embarcacaoIds: new Set(['e']), portoIds: new Set(['p-terminal', 'p-grego']) },
    suspensas: [],
    alteracoes: [],
  }
  const ALTERADA: AlteracaoDaSaida = {
    ocorrencia: { viagemId: 'v', data: QUARTA },
    portoEmbarqueId: 'p-terminal',
    portoDesembarqueId: 'p-outro',
    horaMin: 19 * 60,
    motivo: 'Cais em obra',
  }

  it('a origem e o destino são as cidades da rota, e não as do cais', () => {
    const [saida] = travessiasOfertadas(MACAPA, TERCA)
    expect(saida?.origem.municipio).toBe('Belém')
    expect(saida?.destino.municipio).toBe('Macapá')
    expect(saida?.rotulos.destino).toBe('Macapá/AP')
    expect(saida?.rotulos.desembarque).toBe('Porto do Grego · Santana/AP')
  })

  it('a concessão confere os cais da viagem: sem um deles, a saída não é ofertada', () => {
    const semGrego = { ...MACAPA, atuacao: { embarcacaoIds: new Set(['e']), portoIds: new Set(['p-terminal']) } }
    expect(travessiasOfertadas(semGrego, TERCA)).toEqual([])
    /* A viagem anterior à rota geográfica, sem os cais, também não. */
    const semCais = { ...MACAPA, viagens: MACAPA.viagens.map((v) => ({ ...v, portoEmbarqueId: '', portoDesembarqueId: '' })) }
    expect(travessiasOfertadas(semCais, TERCA)).toEqual([])
  })

  it('a data alterada continua ofertada — mesmo com o cais novo fora da concessão —, com o cais e a hora do dia', () => {
    const [saida] = travessiasOfertadas({ ...MACAPA, alteracoes: [ALTERADA] }, TERCA)
    expect(saida?.id).toBe('v@2026-10-14')
    expect(saida?.desembarque.id).toBe('p-outro')
    expect(saida?.rotulos.desembarque).toBe('Cais da obra · Santana/AP')
    expect(saida?.rotulos.partida).toBe('Quarta-feira, 14/10 · 19:00')
    /* 19:00 + 24h: a chegada parte da hora do dia. */
    expect(saida?.rotulos.chegada).toBe('Qui 19:00')
    expect(saida?.alteracao).toEqual({ mudancas: ['DESEMBARQUE', 'HORA'], motivo: 'Cais em obra' })
    /* O aviso da 2.2 (decisão B): a frase, sem o cais de antes. */
    expect(saida?.rotulos.alteracao).toBe('Embarque alterado nesta data: Cais em obra')
    const semMotivo = travessiasOfertadas({ ...MACAPA, alteracoes: [{ ...ALTERADA, motivo: '  ' }] }, TERCA)[0]
    expect(semMotivo?.rotulos.alteracao).toBe('Embarque alterado nesta data.')
    /* A validade da reserva é a partida do dia. */
    expect(saida?.contexto.partida).toBe('2026-10-14T19:00:00')
  })

  it('a alteração só vale para a data dela', () => {
    const ofertadas = travessiasOfertadas({ ...MACAPA, alteracoes: [ALTERADA] }, TERCA, 14)
    expect(ofertadas.map((t) => [t.id, t.desembarque.id, t.alteracao === null])).toEqual([
      ['v@2026-10-14', 'p-outro', false],
      ['v@2026-10-21', 'p-grego', true],
    ])
  })

  it('a alteração que repete a viagem não dá aviso', () => {
    const igual = { ...ALTERADA, portoDesembarqueId: 'p-grego', horaMin: 18 * 60 }
    expect(travessiasOfertadas({ ...MACAPA, alteracoes: [igual] }, TERCA)[0]?.alteracao).toBeNull()
  })

  it('a suspensão vence a alteração: a data não sai, de cais nenhum', () => {
    const catalogo = { ...MACAPA, alteracoes: [ALTERADA], suspensas: [ALTERADA.ocorrencia] }
    expect(travessiasOfertadas(catalogo, TERCA)).toEqual([])
  })

  it('o cais de uma alteração que não resolve tira só aquela data', () => {
    const fantasma = { ...ALTERADA, portoDesembarqueId: 'p-que-nao-existe' }
    expect(travessiasOfertadas({ ...MACAPA, alteracoes: [fantasma] }, TERCA, 14).map((t) => t.id)).toEqual(['v@2026-10-21'])
  })

  it('o recorte leva as alterações das viagens que ficam, e o cais delas — e não muda o que se oferta', () => {
    const alheia: AlteracaoDaSaida = { ...ALTERADA, ocorrencia: { viagemId: 'de-outra', data: QUARTA } }
    const completo = { ...MACAPA, alteracoes: [ALTERADA, alheia] }
    const recortado = recortarPelaConcessao(completo)
    expect(recortado.alteracoes).toEqual([ALTERADA])
    expect(recortado.portos.map((p) => p.id).sort()).toEqual(['p-grego', 'p-outro', 'p-terminal'])
    expect(recortado.localidades.map((l) => l.id).sort()).toEqual(['belem', 'macapa', 'santana'])
    /* A concessão que sai é a dos cais planejados: o cais da alteração não vira concessão. */
    expect([...(recortado.atuacao?.portoIds ?? [])].sort()).toEqual(['p-grego', 'p-terminal'])
    expect(travessiasOfertadas(recortado, TERCA, 90)).toEqual(travessiasOfertadas(completo, TERCA, 90))
  })

  it('o catálogo atravessa a rede com as alterações, e a API de antes chega sem elas', () => {
    const completo = recortarPelaConcessao({ ...MACAPA, alteracoes: [ALTERADA] })
    const json = JSON.parse(JSON.stringify(catalogoParaJson(completo))) as Record<string, unknown>
    expect(json['alteracoes']).toEqual([
      {
        id: 'v@2026-10-14',
        viagemId: 'v',
        data: '2026-10-14',
        portoEmbarqueId: 'p-terminal',
        portoDesembarqueId: 'p-outro',
        horaMin: 19 * 60,
        motivo: 'Cais em obra',
      },
    ])
    expect(catalogoDoJson(json)?.alteracoes).toEqual([ALTERADA])
    const { alteracoes: _antes, ...antiga } = json
    expect(catalogoDoJson(antiga)?.alteracoes).toEqual([])
    expect(catalogoDoJson({ ...json, alteracoes: {} })).toBeNull()
  })
})
