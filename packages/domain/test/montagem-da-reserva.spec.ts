/**
 * **A montagem** — das respostas à `Reserva`, e só quando o roteiro fecha.
 *
 * O cenário que mais importa aqui é o último bloco: o que ficou para trás nas respostas **não entra na
 * reserva**, porque a montagem lê os nós do roteiro, e não as respostas.
 */
import { describe, expect, it } from 'vitest'

import { paraDocumento, paraDominio } from '../src/reserva/documento.js'
import { montarReserva, type ResultadoDaMontagem } from '../src/reserva/montagem-da-reserva.js'
import { chaveNatural, type Reserva } from '../src/reserva/reserva.js'
import { SEM_RESPONSAVEL, type RespostasDaReserva } from '../src/reserva/roteiro-da-reserva.js'
import { validadeDaReserva } from '../src/reserva/validade-da-reserva.js'
import {
  CONTATO,
  contexto,
  CPFS_VALIDOS,
  IDENTIDADE,
  instante,
  PARTIDA,
  pessoa,
  REDE_COMPLETA,
} from './exemplos.js'

function reservaDe(resultado: ResultadoDaMontagem): Reserva {
  if (resultado.caso !== 'OK') throw new Error(`esperava OK, veio ${JSON.stringify(resultado)}`)
  return resultado.reserva
}

function pendenciasDe(resultado: ResultadoDaMontagem): string[] {
  if (resultado.caso !== 'INCOERENTE') throw new Error(`esperava INCOERENTE, veio ${resultado.caso}`)
  return [...resultado.pendencias].sort()
}

describe('quando o roteiro fecha', () => {
  it('a rede completa vira uma reserva RESERVADA, do totem, com o código e o contato normalizado', () => {
    const reserva = reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))

    expect(reserva).toMatchObject({
      codigo: 'NVG-7K3QP2',
      categoria: 'PASSAGEIRO',
      acomodacao: 'REDE',
      tipo: 'INTEIRA',
      status: 'RESERVADA',
      origem: 'TOTEM_WEB',
      contato: { nome: 'Maria Souza', whatsapp: '5591988887777' },
    })
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.passageiros).toHaveLength(1)
  })

  it('a reserva vale até o navio partir — expiraEm é a partida da ocorrência', () => {
    const reserva = reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))
    expect(reserva.criadoEm).toBe('2026-10-01T23:30:00')
    expect(reserva.expiraEm).toBe(PARTIDA)
    expect(reserva.expiraEm).toBe(validadeDaReserva(PARTIDA))
  })

  it('reservar um minuto antes da partida ainda vale', () => {
    const resultado = montarReserva(REDE_COMPLETA, contexto(), { ...IDENTIDADE, criadoEm: instante('2026-10-14T17:59:00') })
    expect(resultado.caso).toBe('OK')
  })

  it('a suíte sem pergunta de tipo sai INTEIRA — por construção, não por padrão', () => {
    const reserva = reservaDe(
      montarReserva(
        {
          categoria: 'PASSAGEIRO',
          acomodacao: 'SUITE',
          quantidadePessoas: 2,
          passageiros: [pessoa(0), pessoa(1)],
          contato: CONTATO,
        },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.tipo).toBe('INTEIRA')
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.passageiros.map((p) => p.nome)).toEqual([
      'Passageiro 1',
      'Passageiro 2',
    ])
  })

  it('o documento é gravado na forma canônica: CPF sem pontuação, placa em caixa alta', () => {
    const passageiro = reservaDe(
      montarReserva(
        { ...REDE_COMPLETA, passageiros: [{ ...pessoa(0), numeroDocumento: '529.982.247-25' }] },
        contexto(),
        IDENTIDADE,
      ),
    )
    const titular = passageiro.categoria === 'PASSAGEIRO' ? passageiro.passageiros[0] : undefined
    expect(titular?.numeroDocumento).toBe('52998224725')
    /* A chave do pool do aplicativo: `clientes/CPF:52998224725` é o documento certo sem consulta. */
    expect(titular && chaveNatural(titular)).toBe('CPF:52998224725')

    const veiculo = reservaDe(
      montarReserva(
        {
          categoria: 'VEICULO',
          naturezaVeiculo: 'AUTOMOTOR',
          classeVeiculo: 'CARRO',
          veiculo: { placa: ' abc-1d23 ', modelo: 'Gol' },
          responsavel: SEM_RESPONSAVEL,
          contato: CONTATO,
        },
        contexto(),
        IDENTIDADE,
      ),
    )
    /* O `placaCanonica` do aplicativo: só letras e dígitos, caixa alta — é o id em `veiculos/{placa}`. */
    expect(veiculo.categoria === 'VEICULO' && veiculo.veiculo.placa).toBe('ABC1D23')
  })

  it('veículo num navio: a classe é a derivada da natureza, sem ter sido perguntada', () => {
    const reserva = reservaDe(
      montarReserva(
        {
          categoria: 'VEICULO',
          naturezaVeiculo: 'MOTOCICLO',
          veiculo: { placa: 'ABC1D23', cilindrada: 160 },
          responsavel: SEM_RESPONSAVEL,
          contato: CONTATO,
        },
        contexto('NAVIO'),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'VEICULO' && reserva.classe).toBe('MOTO')
    expect('responsavel' in reserva).toBe(false)
  })

  it('o responsável, quando informado, é uma pessoa com documento — e é conferido como passageiro', () => {
    const base: RespostasDaReserva = {
      categoria: 'VEICULO',
      naturezaVeiculo: 'AUTOMOTOR',
      classeVeiculo: 'CARRO',
      veiculo: { placa: 'ABC1D23' },
      contato: CONTATO,
    }
    const reserva = reservaDe(montarReserva({ ...base, responsavel: pessoa(1) }, contexto(), IDENTIDADE))
    expect(reserva.categoria === 'VEICULO' && reserva.responsavel?.numeroDocumento).toBe(CPFS_VALIDOS[1])

    const errado = montarReserva(
      { ...base, responsavel: { ...pessoa(1), numeroDocumento: '11111111111' } },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(errado)).toEqual(['DOCUMENTO_INVALIDO'])
  })

  it('a mesma pessoa duas vezes na suíte — o CLIENTE_REPETIDO do aplicativo', () => {
    const resultado = montarReserva(
      {
        categoria: 'PASSAGEIRO',
        acomodacao: 'SUITE',
        quantidadePessoas: 2,
        passageiros: [pessoa(0), { ...pessoa(0), nome: 'Outro nome, mesmo CPF', numeroDocumento: '529.982.247-25' }],
        contato: CONTATO,
      },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(resultado)).toEqual(['PASSAGEIRO_REPETIDO'])
  })

  it('a agência e a observação entram só quando existem', () => {
    const sem = reservaDe(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE))
    expect('agenciaId' in sem).toBe(false)
    expect('observacao' in sem).toBe(false)

    const com = reservaDe(
      montarReserva(
        { ...REDE_COMPLETA, observacao: '  Levo uma rede própria.  ' },
        contexto(),
        { ...IDENTIDADE, agenciaId: 'agencia-naveg-belem' },
      ),
    )
    expect(com.agenciaId).toBe('agencia-naveg-belem')
    expect(com.observacao).toBe('Levo uma rede própria.')
  })

  it('é pura: as mesmas entradas dão a mesma reserva — é o que permite tentar de novo após colisão', () => {
    expect(montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE)).toEqual(
      montarReserva(REDE_COMPLETA, contexto(), IDENTIDADE),
    )
  })

  it('o que a montagem produz, o codec lê de volta igual — a regra de coerência é a mesma na ida e na volta', () => {
    const casos: RespostasDaReserva[] = [
      REDE_COMPLETA,
      { ...REDE_COMPLETA, tipo: 'GRATUIDADE', gratuidade: 'CRIANCA_ATE_5' },
      {
        categoria: 'PASSAGEIRO',
        acomodacao: 'CAMAROTE',
        quantidadePessoas: 3,
        passageiros: [pessoa(0), pessoa(1), pessoa(2)],
        contato: CONTATO,
      },
      {
        categoria: 'VEICULO',
        naturezaVeiculo: 'MOTOCICLO',
        classeVeiculo: 'MOTO',
        veiculo: { placa: 'ABC1D23', modelo: 'CG', cor: 'Preta', cilindrada: 160 },
        responsavel: pessoa(1),
        contato: CONTATO,
      },
    ]
    for (const respostas of casos) {
      const reserva = reservaDe(montarReserva(respostas, contexto(), IDENTIDADE))
      expect(paraDominio(reserva.codigo, JSON.parse(JSON.stringify(paraDocumento(reserva))))).toEqual(
        reserva,
      )
    }
  })
})

describe('quando o roteiro não fecha', () => {
  it('devolve o nó em foco — é para lá que a tela leva a pessoa', () => {
    const resultado = montarReserva({ categoria: 'PASSAGEIRO', acomodacao: 'REDE' }, contexto(), IDENTIDADE)
    expect(resultado.caso).toBe('INCOMPLETA')
    expect(resultado.caso === 'INCOMPLETA' && resultado.faltando.passo).toBe('TIPO_TARIFARIO')
  })

  it('sem contato, não há reserva — o contato é a razão de ser da Fase 1', () => {
    const { contato: _, ...semContato } = REDE_COMPLETA
    const resultado = montarReserva(semContato, contexto(), IDENTIDADE)
    expect(resultado.caso === 'INCOMPLETA' && resultado.faltando.passo).toBe('CONTATO')
  })

  it('respostas vazias param no primeiro passo', () => {
    const resultado = montarReserva({}, contexto(), IDENTIDADE)
    expect(resultado.caso === 'INCOMPLETA' && resultado.faltando.passo).toBe('CATEGORIA')
  })
})

describe('quando o roteiro fecha mas a reserva não', () => {
  it('CPF com dígito trocado', () => {
    const resultado = montarReserva(
      { ...REDE_COMPLETA, passageiros: [{ ...pessoa(0), numeroDocumento: '52998224726' }] },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(resultado)).toEqual(['DOCUMENTO_INVALIDO'])
  })

  it('WhatsApp que não é celular brasileiro', () => {
    for (const whatsapp of ['91 3222-1111', '98888-7777', '+1 415 555 0100']) {
      const resultado = montarReserva(
        { ...REDE_COMPLETA, contato: { ...CONTATO, whatsapp } },
        contexto(),
        IDENTIDADE,
      )
      expect(pendenciasDe(resultado), whatsapp).toEqual(['CONTATO_WHATSAPP'])
    }
  })

  it('várias pendências de uma vez — a pessoa corrige tudo numa volta só', () => {
    const resultado = montarReserva(
      {
        ...REDE_COMPLETA,
        passageiros: [{ ...pessoa(0), numeroDocumento: '11111111111' }],
        contato: { nome: 'Maria', whatsapp: '123' },
      },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(resultado)).toEqual(['CONTATO_WHATSAPP', 'DOCUMENTO_INVALIDO'])
  })

  it('nascimento que não existe no calendário', () => {
    const resultado = montarReserva(
      { ...REDE_COMPLETA, passageiros: [{ ...pessoa(0), dataNascimento: '1980-02-30' }] },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(resultado)).toEqual(['NASCIMENTO'])
  })

  it('nascimento depois do dia da reserva — o ano corrente digitado no lugar do de nascimento', () => {
    const resultado = montarReserva(
      { ...REDE_COMPLETA, passageiros: [{ ...pessoa(0), dataNascimento: '2026-10-02' }] },
      contexto(),
      IDENTIDADE,
    )
    expect(pendenciasDe(resultado)).toEqual(['NASCIMENTO'])
  })

  it('o navio já partiu — o terminal ficou aberto na conferência, e o barco não esperou', () => {
    for (const criadoEm of ['2026-10-14T18:00:00', '2026-10-14T18:01:00', '2026-10-15T08:00:00']) {
      const resultado = montarReserva(REDE_COMPLETA, contexto(), { ...IDENTIDADE, criadoEm: instante(criadoEm) })
      expect(pendenciasDe(resultado), criadoEm).toEqual(['VALIDADE'])
    }
  })

  it('código fora do formato', () => {
    const resultado = montarReserva(REDE_COMPLETA, contexto(), { ...IDENTIDADE, codigo: 'NVG-123' })
    expect(pendenciasDe(resultado)).toEqual(['CODIGO'])
  })
})

describe('o que ficou para trás não entra na reserva', () => {
  it('a gratuidade de uma escolha desfeita não aparece numa reserva de meia', () => {
    const reserva = reservaDe(
      montarReserva({ ...REDE_COMPLETA, tipo: 'MEIA', gratuidade: 'IDOSO' }, contexto(), IDENTIDADE),
    )
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.tipo).toBe('MEIA')
    expect('gratuidade' in reserva).toBe(false)
  })

  it('a meia de uma rede abandonada não vira meia numa suíte', () => {
    const reserva = reservaDe(
      montarReserva(
        {
          categoria: 'PASSAGEIRO',
          acomodacao: 'SUITE',
          tipo: 'MEIA',
          quantidadePessoas: 1,
          passageiros: [pessoa(0)],
          contato: CONTATO,
        },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.tipo).toBe('INTEIRA')
  })

  it('a terceira pessoa de uma suíte que virou rede não viaja', () => {
    const reserva = reservaDe(
      montarReserva(
        {
          ...REDE_COMPLETA,
          quantidadePessoas: 3,
          passageiros: [pessoa(0), pessoa(1), pessoa(2)],
        },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'PASSAGEIRO' && reserva.passageiros).toHaveLength(1)
  })

  it('a cilindrada digitada para uma moto não sobrevive à troca para carro', () => {
    const reserva = reservaDe(
      montarReserva(
        {
          categoria: 'VEICULO',
          naturezaVeiculo: 'AUTOMOTOR',
          classeVeiculo: 'CARRO',
          veiculo: { placa: 'ABC1D23', cilindrada: 150 },
          responsavel: SEM_RESPONSAVEL,
          contato: CONTATO,
        },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'VEICULO' && reserva.veiculo).toEqual({ placa: 'ABC1D23' })
  })

  it('a van escolhida para um ferry não vira van num navio — a classe do navio é a derivada', () => {
    const reserva = reservaDe(
      montarReserva(
        {
          categoria: 'VEICULO',
          naturezaVeiculo: 'AUTOMOTOR',
          classeVeiculo: 'VAN',
          veiculo: { placa: 'ABC1D23' },
          responsavel: SEM_RESPONSAVEL,
          contato: CONTATO,
        },
        contexto('NAVIO'),
        IDENTIDADE,
      ),
    )
    expect(reserva.categoria === 'VEICULO' && reserva.classe).toBe('CARRO')
  })

  it('os dados do veículo de um caminho abandonado não aparecem numa reserva de passageiro', () => {
    const reserva = reservaDe(
      montarReserva(
        { ...REDE_COMPLETA, naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO', veiculo: { placa: 'ABC1D23' } },
        contexto(),
        IDENTIDADE,
      ),
    )
    expect('veiculo' in reserva).toBe(false)
    expect('classe' in reserva).toBe(false)
  })
})
