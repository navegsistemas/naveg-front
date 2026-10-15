/**
 * **A montagem** — das respostas à `Reserva`, e só quando o roteiro fecha.
 *
 * O bloco que mais importa é o último: o que ficou para trás nas respostas **não entra na reserva**, porque a
 * montagem lê os nós do roteiro, e não as respostas.
 */
import { describe, expect, it } from 'vitest'

import { paraDocumento, paraDominio } from '../src/reserva/documento.js'
import { montarReserva, type ResultadoDaMontagem } from '../src/reserva/montagem-da-reserva.js'
import type { Reserva } from '../src/reserva/reserva.js'
import type { RespostasDaReserva } from '../src/reserva/roteiro-da-reserva.js'
import { validadeDaReserva } from '../src/reserva/validade-da-reserva.js'
import { CLIENTE, contexto, IDENTIDADE, instante, PARTIDA, REDE_COMPLETA } from './exemplos.js'

function reservaDe(resultado: ResultadoDaMontagem): Reserva {
  if (resultado.caso !== 'OK') throw new Error(`esperava OK, veio ${JSON.stringify(resultado)}`)
  return resultado.reserva
}

function pendenciasDe(resultado: ResultadoDaMontagem): string[] {
  if (resultado.caso !== 'INCOERENTE') throw new Error(`esperava INCOERENTE, veio ${resultado.caso}`)
  return [...resultado.pendencias].sort()
}

describe('quando o roteiro fecha', () => {
  it('a rede completa vira uma reserva RESERVADA, do totem, com o telefone normalizado', () => {
    expect(reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))).toMatchObject({
      codigo: 'NVG-7K3QP2',
      categoria: 'PASSAGEIRO',
      acomodacao: 'REDE',
      tipo: 'INTEIRA',
      quantidadePessoas: 1,
      status: 'RESERVADA',
      origem: 'TOTEM_WEB',
      cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
    })
  })

  it('sem telefone também fecha — ele é opcional', () => {
    const reserva = reservaDe(montarReserva({ ...REDE_COMPLETA, cliente: { nome: ' Maria ' } }, contexto(), IDENTIDADE))
    expect(reserva.cliente).toEqual({ nome: 'Maria' })
  })

  it('a reserva vale até o navio partir — expiraEm é a partida da ocorrência', () => {
    const reserva = reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))
    expect(reserva.expiraEm).toBe(PARTIDA)
    expect(reserva.expiraEm).toBe(validadeDaReserva(PARTIDA))
  })

  it('reservar um minuto antes da partida ainda vale', () => {
    const identidade = { ...IDENTIDADE, criadoEm: instante('2026-10-14T17:59:00') }
    expect(montarReserva(REDE_COMPLETA, contexto(), identidade).caso).toBe('OK')
  })

  it('suíte para três: sempre inteira, e a quantidade vai para a reserva', () => {
    const reserva = reservaDe(
      montarReserva(
        { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', quantidadePessoas: 3, cliente: CLIENTE },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva).toMatchObject({ tipo: 'INTEIRA', quantidadePessoas: 3 })
  })

  it('moto: a classe e a cilindrada; nenhum dado do veículo em si', () => {
    const reserva = reservaDe(
      montarReserva(
        { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', cilindrada: 160, cliente: CLIENTE },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva).toMatchObject({ categoria: 'VEICULO', classe: 'MOTO', cilindrada: 160 })
  })

  it('veículo num navio: a classe é a derivada da natureza, sem ter sido perguntada', () => {
    const reserva = reservaDe(
      montarReserva({ categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', cliente: CLIENTE }, contexto('NAVIO'), IDENTIDADE),
    )
    expect(reserva.categoria === 'VEICULO' && reserva.classe).toBe('CARRO')
  })

  it('a agência e a observação entram só quando existem', () => {
    const sem = reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))
    expect('agenciaId' in sem || 'observacao' in sem).toBe(false)

    const com = reservaDe(
      montarReserva({ ...REDE_COMPLETA, observacao: '  Levo rede própria.  ' }, contexto(), {
        ...IDENTIDADE,
        agenciaId: 'agencia-naveg-belem',
      }),
    )
    expect(com.agenciaId).toBe('agencia-naveg-belem')
    expect(com.observacao).toBe('Levo rede própria.')
  })

  it('é pura: as mesmas entradas dão a mesma reserva — é o que permite tentar de novo após colisão', () => {
    expect(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE)).toEqual(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))
  })

  it('o que a montagem produz, o codec lê de volta igual', () => {
    const casos: RespostasDaReserva[] = [
      REDE_COMPLETA,
      { ...REDE_COMPLETA, tipo: 'GRATUIDADE', gratuidade: 'CRIANCA_ATE_5' },
      { categoria: 'PASSAGEIRO', acomodacao: 'CAMAROTE', quantidadePessoas: 2, cliente: { nome: 'Ana' } },
      { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', cilindrada: 160, cliente: CLIENTE },
      { categoria: 'VEICULO', naturezaVeiculo: 'REBOCADO', classeVeiculo: 'JET_SKI', cliente: CLIENTE },
    ]
    for (const respostas of casos) {
      const reserva = reservaDe(montarReserva(respostas, contexto(), IDENTIDADE))
      expect(paraDominio(reserva.codigo, JSON.parse(JSON.stringify(paraDocumento(reserva))))).toEqual(reserva)
    }
  })
})

describe('quando o roteiro não fecha', () => {
  it('devolve o nó em foco — é para lá que a tela leva a pessoa', () => {
    const resultado = montarReserva({ categoria: 'PASSAGEIRO', acomodacao: 'REDE' }, contexto(), IDENTIDADE)
    expect(resultado.caso === 'INCOMPLETA' && resultado.faltando.passo).toBe('TIPO_TARIFARIO')
  })

  it('sem o nome do cliente, não há reserva', () => {
    const resultado = montarReserva({ ...REDE_COMPLETA, cliente: { telefone: '91988887777' } }, contexto(), IDENTIDADE)
    expect(resultado.caso === 'INCOMPLETA' && resultado.faltando.passo).toBe('CLIENTE')
  })

  it('moto sem cilindrada para no passo da cilindrada', () => {
    const resultado = montarReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', cliente: CLIENTE },
      contexto(),
      IDENTIDADE,
    )
    expect(resultado.caso === 'INCOMPLETA' && resultado.faltando.passo).toBe('CILINDRADA')
  })
})

describe('quando o roteiro fecha mas a reserva não', () => {
  it('telefone informado que não é celular brasileiro', () => {
    for (const telefone of ['91 3222-1111', '98888-7777', '+1 415 555 0100']) {
      const resultado = montarReserva({ ...REDE_COMPLETA, cliente: { nome: 'Maria', telefone } }, contexto(), IDENTIDADE)
      expect(pendenciasDe(resultado), telefone).toEqual(['CLIENTE_TELEFONE'])
    }
  })

  it('o navio já partiu — o terminal ficou aberto na conferência, e o barco não esperou', () => {
    for (const criadoEm of ['2026-10-14T18:00:00', '2026-10-15T08:00:00']) {
      const resultado = montarReserva(REDE_COMPLETA, contexto(), { ...IDENTIDADE, criadoEm: instante(criadoEm) })
      expect(pendenciasDe(resultado), criadoEm).toEqual(['VALIDADE'])
    }
  })

  it('código fora do formato', () => {
    expect(pendenciasDe(montarReserva(REDE_COMPLETA, contexto(), { ...IDENTIDADE, codigo: 'NVG-123' }))).toEqual(['CODIGO'])
  })

  it('várias pendências de uma vez — a pessoa corrige tudo numa volta só', () => {
    const resultado = montarReserva(
      { ...REDE_COMPLETA, cliente: { nome: 'Maria', telefone: '123' } },
      contexto(),
      { ...IDENTIDADE, codigo: 'x' },
    )
    expect(pendenciasDe(resultado)).toEqual(['CLIENTE_TELEFONE', 'CODIGO'])
  })
})

describe('o que ficou para trás não entra na reserva', () => {
  it('a gratuidade de uma escolha desfeita não aparece numa reserva de meia', () => {
    const reserva = reservaDe(montarReserva({ ...REDE_COMPLETA, tipo: 'MEIA', gratuidade: 'IDOSO' }, contexto(), IDENTIDADE))
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.tipo).toBe('MEIA')
    expect('gratuidade' in reserva).toBe(false)
  })

  it('a meia de uma rede abandonada não vira meia numa suíte', () => {
    const reserva = reservaDe(
      montarReserva(
        { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', tipo: 'MEIA', quantidadePessoas: 1, cliente: CLIENTE },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.tipo).toBe('INTEIRA')
  })

  it('as três pessoas de uma suíte que virou rede viram uma', () => {
    const reserva = reservaDe(montarReserva({ ...REDE_COMPLETA, quantidadePessoas: 3 }, contexto(), IDENTIDADE))
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.quantidadePessoas).toBe(1)
  })

  it('a cilindrada digitada para uma moto não vai para o carro', () => {
    const reserva = reservaDe(
      montarReserva(
        { categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO', cilindrada: 150, cliente: CLIENTE },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect('cilindrada' in reserva).toBe(false)
  })

  it('a van escolhida para um ferry não vira van num navio', () => {
    const reserva = reservaDe(
      montarReserva(
        { categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'VAN', cliente: CLIENTE },
        contexto('NAVIO'),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'VEICULO' && reserva.classe).toBe('CARRO')
  })

  it('o veículo de um caminho abandonado não aparece numa reserva de passageiro', () => {
    const reserva = reservaDe(
      montarReserva({ ...REDE_COMPLETA, naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO' }, contexto(), IDENTIDADE),
    )
    expect('classe' in reserva).toBe(false)
  })
})

/* naveg-front#65 (fluviapp-kmp#62): pelo site, o tipo fica para o atendimento, e o grupo não tem o teto da acomodação. */
describe('pelo site', () => {
  const SITE: RespostasDaReserva = {
    canal: 'SITE',
    categoria: 'PASSAGEIRO',
    quantidadePessoas: 5,
    acomodacao: 'SUITE',
    cliente: CLIENTE,
  }

  it('cinco numa suíte vão assim, e sem o tipo', () => {
    const reserva = reservaDe(montarReserva(SITE, contexto(), IDENTIDADE))
    expect(reserva).toMatchObject({ categoria: 'PASSAGEIRO', acomodacao: 'SUITE', quantidadePessoas: 5 })
    expect('tipo' in reserva).toBe(false)
  })

  it('o tipo e a gratuidade que sobraram não entram', () => {
    const reserva = reservaDe(montarReserva({ ...SITE, tipo: 'GRATUIDADE', gratuidade: 'IDOSO' }, contexto(), IDENTIDADE))
    expect('tipo' in reserva).toBe(false)
    expect('gratuidade' in reserva).toBe(false)
  })

  it('o documento vai sem o tipo, e volta igual', () => {
    const reserva = reservaDe(montarReserva(SITE, contexto(), IDENTIDADE))
    const documento = paraDocumento(reserva)
    expect(documento).not.toHaveProperty('tipo')
    expect(paraDominio(reserva.codigo, JSON.parse(JSON.stringify(documento)))).toEqual(reserva)
  })

  it('sem o canal, é o quiosque: a rede sem o tipo não fecha', () => {
    const { canal: _, ...quiosque } = { ...SITE, acomodacao: 'REDE' as const, quantidadePessoas: 1 }
    expect(montarReserva(quiosque, contexto(), IDENTIDADE)).toMatchObject({ caso: 'INCOMPLETA', faltando: { passo: 'TIPO_TARIFARIO' } })
  })
})

/* naveg-front#66 (fluviapp-kmp#63): passageiros e veículo numa reserva só, e o veículo sozinho, pelo site. */
describe('o que vai embarcar, pelo site', () => {
  const CAMINHAO: RespostasDaReserva = {
    canal: 'SITE',
    embarque: 'VEICULO',
    porteVeiculo: 'PESADO',
    classeVeiculo: 'CAMINHAO',
    cliente: CLIENTE,
  }

  it('o veículo sozinho: a reserva de veículo, sem pessoas', () => {
    const reserva = reservaDe(montarReserva(CAMINHAO, contexto(), IDENTIDADE))
    expect(reserva).toMatchObject({ categoria: 'VEICULO', classe: 'CAMINHAO' })
    expect('quantidadePessoas' in reserva).toBe(false)
    expect('acomodacao' in reserva).toBe(false)
  })

  it('passageiros e veículo: uma reserva só, com as pessoas e a acomodação, sem o tipo', () => {
    const reserva = reservaDe(
      montarReserva(
        { ...CAMINHAO, embarque: 'PASSAGEIROS_E_VEICULO', quantidadePessoas: 3, acomodacao: 'REDE' },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva).toMatchObject({ categoria: 'VEICULO', classe: 'CAMINHAO', quantidadePessoas: 3, acomodacao: 'REDE' })
    expect('tipo' in reserva).toBe(false)
    expect(paraDominio(reserva.codigo, JSON.parse(JSON.stringify(paraDocumento(reserva))))).toEqual(reserva)
  })

  it('as pessoas de um "Passageiros e veículo" desfeito não vão com o veículo sozinho', () => {
    const reserva = reservaDe(montarReserva({ ...CAMINHAO, quantidadePessoas: 3, acomodacao: 'REDE' }, contexto(), IDENTIDADE))
    expect('quantidadePessoas' in reserva).toBe(false)
  })

  it('passageiros: a de passageiros, sem o tipo', () => {
    const reserva = reservaDe(
      montarReserva(
        { canal: 'SITE', embarque: 'PASSAGEIROS', quantidadePessoas: 2, acomodacao: 'CAMAROTE', cliente: CLIENTE },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva).toMatchObject({ categoria: 'PASSAGEIRO', acomodacao: 'CAMAROTE', quantidadePessoas: 2 })
  })

  it('a moto vai com a cilindrada', () => {
    const moto = { ...CAMINHAO, porteVeiculo: 'LEVE' as const, classeVeiculo: 'MOTO' as const, cilindrada: 160 }
    expect(reservaDe(montarReserva(moto, contexto(), IDENTIDADE))).toMatchObject({ classe: 'MOTO', cilindrada: 160 })
  })

  it('a saída cuja embarcação não leva o veículo não fecha: o caminhão no navio', () => {
    expect(montarReserva(CAMINHAO, contexto('NAVIO'), IDENTIDADE)).toMatchObject({ caso: 'INCOMPLETA', faltando: { passo: 'EMBARQUE' } })
    expect(montarReserva(CAMINHAO, contexto('LANCHA'), IDENTIDADE).caso).toBe('INCOMPLETA')
  })

  it('a página da #65 continua reservando o veículo: a categoria e a classe, sem o porte', () => {
    const { embarque: _e, porteVeiculo: _p, ...antigo } = CAMINHAO
    const reserva = reservaDe(montarReserva({ ...antigo, categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR' }, contexto(), IDENTIDADE))
    expect(reserva).toMatchObject({ categoria: 'VEICULO', classe: 'CAMINHAO' })
  })
})
