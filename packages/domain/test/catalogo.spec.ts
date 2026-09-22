/**
 * **O catálogo** — os documentos do fluviapp lidos como o aplicativo os lê, e as travessias que a agência
 * pode oferecer agora.
 *
 * Duas famílias de cenário, e a régua das duas é a paridade com o aplicativo: o decodificador recusa **o que
 * o `toX()` recusa e só isso**; a disponibilidade é **a do `disponiveisAPartirDe`**, linha a linha.
 */
import { describe, expect, it } from 'vitest'

import {
  atuacaoDoDocumento,
  embarcacaoDoDocumento,
  localidadeDoDocumento,
  portoDoDocumento,
  rotaDoDocumento,
  viagemDoDocumento,
} from '../src/catalogo/documentos.js'
import { travessiasOfertadas, type CatalogoDoFluviapp } from '../src/catalogo/travessias.js'
import { montarReserva } from '../src/reserva/montagem-da-reserva.js'
import { roteiroDaReserva } from '../src/reserva/roteiro-da-reserva.js'
import type { Rota } from '../src/rota/rota.js'
import { chegadaEstimada, disponiveisAPartirDe, type Viagem } from '../src/viagem/viagem.js'
import { CONTATO, instante, pessoa } from './exemplos.js'

describe('os decodificadores recusam o que o aplicativo recusa, e só isso', () => {
  it('viagem: sem rota, sem embarcação ou com dia desconhecido não vira nada', () => {
    const boa = { rotaId: 'r1', embarcacaoId: 'e1', diaSemana: 'TUESDAY', horaMin: 1080, ativo: true }
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

  it('rota, porto, localidade, embarcação: cada um recusa só a referência que o faz ser o que é', () => {
    expect(rotaDoDocumento('r', { portoOrigemId: 'a' })).toBeNull()
    expect(rotaDoDocumento('r', { portoOrigemId: 'a', portoDestinoId: 'b' })).toMatchObject({ tempoMedioH: 0, ativo: true })
    expect(portoDoDocumento('p', { nome: 'Cais' })).toBeNull()
    expect(portoDoDocumento('p', { localidadeId: 'l' })).toEqual({ id: 'p', nome: '', localidadeId: 'l', ativo: true })
    expect(localidadeDoDocumento('l', { municipio: 'Belém', uf: 'XX' })).toBeNull()
    expect(localidadeDoDocumento('l', { municipio: 'Belém', uf: 'PA' })?.uf).toBe('PA')
    expect(embarcacaoDoDocumento('e', { nome: 'Sem tipo' })).toBeNull()
    expect(embarcacaoDoDocumento('e', { nome: 'Nave', tipo: 'NAVIO' })?.tipo).toBe('NAVIO')
  })

  it('a concessão: listas de ids, ignorando o que não é texto', () => {
    const atuacao = atuacaoDoDocumento({ embarcacaoIds: ['e1', 42, 'e2'], portoIds: ['p1'] })
    expect([...(atuacao?.embarcacaoIds ?? [])]).toEqual(['e1', 'e2'])
    expect(atuacaoDoDocumento(null)).toBeNull()
  })
})

describe('a disponibilidade é a do aplicativo', () => {
  const terca18h: Viagem = { id: 'v', rotaId: 'r', embarcacaoId: 'e', diaSemana: 'TUESDAY', horaMin: 18 * 60, ativo: true }

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

  it('a chegada estimada de uma travessia longa cai noutro dia', () => {
    const rota: Rota = { id: 'r', portoOrigemId: 'a', portoDestinoId: 'b', distanciaMn: 0, tempoMedioH: 30, ativo: true }
    expect(chegadaEstimada({ ...terca18h, horaMin: 21 * 60 }, rota)).toEqual({
      horaMin: 3 * 60,
      diasDepois: 2,
      diaSemana: 'THURSDAY',
    })
  })
})

describe('as travessias ofertadas', () => {
  const BASE: CatalogoDoFluviapp = {
    localidades: [
      { id: 'bel', municipio: 'Belém', uf: 'PA', codigoIbge: '1501402', ativo: true },
      { id: 'sou', municipio: 'Soure', uf: 'PA', codigoIbge: '1507904', ativo: true },
    ],
    portos: [
      { id: 'p-bel', nome: 'Terminal Hidroviário', localidadeId: 'bel', ativo: true },
      { id: 'p-sou', nome: 'Porto de Camará', localidadeId: 'sou', ativo: true },
      { id: 'p-fora', nome: 'Porto sem concessão', localidadeId: 'bel', ativo: true },
    ],
    rotas: [
      { id: 'r-ida', portoOrigemId: 'p-bel', portoDestinoId: 'p-sou', distanciaMn: 40, tempoMedioH: 3.5, ativo: true },
      { id: 'r-fora', portoOrigemId: 'p-bel', portoDestinoId: 'p-fora', distanciaMn: 10, tempoMedioH: 1, ativo: true },
      { id: 'r-inativa', portoOrigemId: 'p-sou', portoDestinoId: 'p-bel', distanciaMn: 40, tempoMedioH: 3.5, ativo: false },
    ],
    embarcacoes: [
      {
        id: 'e-ferry', nome: 'Ferry Exemplo', tipo: 'FERRY_BOAT', capacidadeVeiculo: 40,
        capacidadeSuite2: 0, capacidadeSuite3: 0, capacidadeCamarote: 4, empresaId: 'x',
      },
      {
        id: 'e-lancha', nome: 'Lancha Exemplo', tipo: 'LANCHA', capacidadeVeiculo: 0,
        capacidadeSuite2: 0, capacidadeSuite3: 0, capacidadeCamarote: 0, empresaId: 'x',
      },
    ],
    viagens: [
      { id: 'v-ferry', rotaId: 'r-ida', embarcacaoId: 'e-ferry', diaSemana: 'WEDNESDAY', horaMin: 21 * 60 + 30, ativo: true },
      { id: 'v-lancha', rotaId: 'r-ida', embarcacaoId: 'e-lancha', diaSemana: 'WEDNESDAY', horaMin: 7 * 60, ativo: true },
      { id: 'v-nao-concedida', rotaId: 'r-ida', embarcacaoId: 'e-outra', diaSemana: 'WEDNESDAY', horaMin: 9 * 60, ativo: true },
      { id: 'v-porto-fora', rotaId: 'r-fora', embarcacaoId: 'e-ferry', diaSemana: 'WEDNESDAY', horaMin: 10 * 60, ativo: true },
      { id: 'v-rota-inativa', rotaId: 'r-inativa', embarcacaoId: 'e-ferry', diaSemana: 'WEDNESDAY', horaMin: 11 * 60, ativo: true },
    ],
    atuacao: { embarcacaoIds: new Set(['e-ferry', 'e-lancha', 'e-outra']), portoIds: new Set(['p-bel', 'p-sou']) },
  }
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

  it('os rótulos são os do aplicativo: "Porto · Município/UF", o dia, a hora, a chegada', () => {
    const ferry = travessiasOfertadas(BASE, TERCA).find((t) => t.id === 'v-ferry@2026-10-14')
    expect(ferry?.rotulos).toEqual({
      origem: 'Terminal Hidroviário · Belém/PA',
      destino: 'Porto de Camará · Soure/PA',
      partida: 'Quarta-feira, 14/10 · 21:30',
      /* 21:30 + 3h30 = 01:00 do dia seguinte — e o aplicativo escreve o dia quando muda. */
      chegada: 'Qui 01:00',
      embarcacao: 'Ferry Exemplo · Ferry Boat',
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
      { categoria: 'PASSAGEIRO', acomodacao: 'REDE', tipo: 'INTEIRA', passageiros: [pessoa(0)], contato: CONTATO },
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
