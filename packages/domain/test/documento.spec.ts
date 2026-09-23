/**
 * **O codec** — ida e volta, e as recusas.
 *
 * Cada recusa parte de um documento **válido** e estraga um campo só. É a forma de saber que o `null` veio
 * daquele campo, e não de outro que estava errado por acaso no exemplo.
 */
import { describe, expect, it } from 'vitest'

import { CAMPOS_DO_DOCUMENTO, paraDocumento, paraDominio, type ReservaDocumento } from '../src/reserva/documento.js'
import type { Reserva, ReservaDePassageiro, ReservaDeVeiculo } from '../src/reserva/reserva.js'
import { instante, OCORRENCIA } from './exemplos.js'

const BASE = {
  codigo: 'NVG-7K3QP2',
  ocorrencia: OCORRENCIA,
  cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
  status: 'RESERVADA',
  origem: 'TOTEM_WEB',
  criadoEm: instante('2026-10-01T23:30:00'),
  expiraEm: instante('2026-10-14T18:00:00'),
} as const

const REDE_GRATUIDADE: ReservaDePassageiro = {
  ...BASE,
  categoria: 'PASSAGEIRO',
  acomodacao: 'REDE',
  tipo: 'GRATUIDADE',
  gratuidade: 'IDOSO',
  quantidadePessoas: 1,
}

const SUITE_PARA_TRES: ReservaDePassageiro = {
  ...BASE,
  codigo: 'NVG-5V1TE3',
  cliente: { nome: 'Ana' },
  categoria: 'PASSAGEIRO',
  acomodacao: 'SUITE',
  tipo: 'INTEIRA',
  quantidadePessoas: 3,
  agenciaId: 'agencia-naveg-belem',
  observacao: 'Chegamos de ônibus às 17h.',
}

const MOTO: ReservaDeVeiculo = { ...BASE, codigo: 'NVG-M0T0CG', categoria: 'VEICULO', classe: 'MOTO', cilindrada: 160 }

const CARRETA: ReservaDeVeiculo = { ...BASE, codigo: 'NVG-CARRET', categoria: 'VEICULO', classe: 'CARRETA' }

const CONVERTIDA: ReservaDePassageiro = {
  ...REDE_GRATUIDADE,
  codigo: 'NVG-C0NV3R',
  status: 'CONVERTIDA',
  passagemId: 'passagem-abc',
  tratamento: { porId: 'uid-ana', em: instante('2026-10-02T09:00:00') },
}

const CANCELADA: ReservaDeVeiculo = {
  ...MOTO,
  codigo: 'NVG-CANCE1',
  status: 'CANCELADA',
  tratamento: { porId: 'uid-ana', em: instante('2026-10-02T09:00:00') },
}

const EXEMPLOS: readonly Reserva[] = [REDE_GRATUIDADE, SUITE_PARA_TRES, MOTO, CARRETA, CONVERTIDA, CANCELADA]

/** O que o Firestore devolve: um objeto sem protótipo de classe, e sem `undefined`. */
function comoFirestore(documento: ReservaDocumento): Record<string, unknown> {
  return JSON.parse(JSON.stringify(documento)) as Record<string, unknown>
}

describe('ida e volta', () => {
  for (const reserva of EXEMPLOS) {
    it(`${reserva.codigo}: domínio → documento → domínio é identidade`, () => {
      expect(paraDominio(reserva.codigo, comoFirestore(paraDocumento(reserva)))).toEqual(reserva)
    })
  }

  it('o documento é JSON puro: nenhum `undefined`, nenhum `null` escrito', () => {
    for (const reserva of EXEMPLOS) {
      const documento = paraDocumento(reserva)
      expect(JSON.stringify(documento), reserva.codigo).not.toContain('null')
      expect(Object.values(documento), reserva.codigo).not.toContain(undefined)
    }
  })

  it('o código não é um campo — ele é o id', () => {
    expect('codigo' in paraDocumento(REDE_GRATUIDADE)).toBe(false)
  })

  it('nenhum dado de documento, nascimento ou placa é escrito — o totem não os recolhe', () => {
    for (const reserva of EXEMPLOS) {
      const texto = JSON.stringify(paraDocumento(reserva))
      for (const chave of ['documento', 'Documento', 'nascimento', 'Nascimento', 'placa', 'passageiros']) {
        expect(texto, `${reserva.codigo}: ${chave}`).not.toContain(`"${chave}`)
      }
    }
  })
})

describe('as chaves são o contrato', () => {
  it('tudo o que o codec escreve está em CAMPOS_DO_DOCUMENTO', () => {
    const permitidos = new Set<string>(CAMPOS_DO_DOCUMENTO)
    for (const reserva of EXEMPLOS) {
      for (const chave of Object.keys(paraDocumento(reserva))) {
        expect(permitidos.has(chave), `${reserva.codigo}.${chave}`).toBe(true)
      }
    }
  })

  it('o ramo do outro nunca é escrito', () => {
    expect(Object.keys(paraDocumento(SUITE_PARA_TRES))).not.toContain('classe')
    expect(Object.keys(paraDocumento(MOTO))).not.toContain('quantidadePessoas')
  })

  it('o carimbo de quem tratou é lido inteiro, ou lido como ausente — nunca recusa a reserva', () => {
    const documento = comoFirestore(paraDocumento(CANCELADA))
    expect(paraDominio(CANCELADA.codigo, documento)?.tratamento).toEqual(CANCELADA.tratamento)

    for (const pelaMetade of [{ porId: 'uid-ana' }, { em: '2026-10-02T09:00:00' }, { porId: 7, em: 'ontem' }, 'x']) {
      const lido = paraDominio(CANCELADA.codigo, { ...documento, tratamento: pelaMetade })
      expect(lido, JSON.stringify(pelaMetade)).not.toBeNull()
      expect(lido?.tratamento, JSON.stringify(pelaMetade)).toBeUndefined()
    }
  })

  it('uma chave extra na leitura é ignorada — quem a recusa é a Rule, na escrita', () => {
    const documento = { ...comoFirestore(paraDocumento(REDE_GRATUIDADE)), extra: 'x' }
    expect(paraDominio(REDE_GRATUIDADE.codigo, documento)).toEqual(REDE_GRATUIDADE)
  })
})

describe('as recusas', () => {
  function estragar(reserva: Reserva, alterar: (documento: Record<string, unknown>) => void): Reserva | null {
    const documento = comoFirestore(paraDocumento(reserva))
    alterar(documento)
    return paraDominio(reserva.codigo, documento)
  }

  it('o exemplo intacto é aceito — sem isso, as recusas abaixo não provam nada', () => {
    expect(estragar(REDE_GRATUIDADE, () => {})).not.toBeNull()
    expect(estragar(MOTO, () => {})).not.toBeNull()
  })

  it('1 · id que não é um código NVG, e dado que não é objeto', () => {
    const documento = comoFirestore(paraDocumento(REDE_GRATUIDADE))
    for (const id of ['', 'abc123', 'nvg-7k3qp2']) expect(paraDominio(id, documento), id).toBeNull()
    for (const lixo of [null, undefined, 'texto', 42, [], true]) expect(paraDominio('NVG-7K3QP2', lixo)).toBeNull()
  })

  it('2 · categoria ilegível', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['categoria'] = 'CARGA'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['categoria'])).toBeNull()
  })

  it('3 · ocorrência ilegível: sem viagem, ou data que não existe', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['viagemId'] = '  '))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['data'] = '2026-02-30'))).toBeNull()
  })

  it('4 · status ou origem fora do vocabulário', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['status'] = 'A_EMITIR'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['origem'] = 'BALCAO'))).toBeNull()
  })

  it('5 · instantes ilegíveis', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['expiraEm'] = 'amanhã'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['criadoEm'])).toBeNull()
  })

  it('6 · cliente ausente, sem nome, ou com telefone ilegível', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['cliente'])).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['cliente'] = { telefone: '5591988887777' }))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['cliente'] = 'Maria'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['cliente'] = { nome: 'Maria', telefone: 91988887777 }))).toBeNull()
  })

  it('6b · cliente sem telefone é aceito — ele é opcional', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['cliente'] = { nome: 'Maria' }))?.cliente).toEqual({ nome: 'Maria' })
  })

  it('7 · o que define a passagem ausente', () => {
    expect(estragar(SUITE_PARA_TRES, (d) => void delete d['quantidadePessoas'])).toBeNull()
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['quantidadePessoas'] = '3'))).toBeNull()
    expect(estragar(SUITE_PARA_TRES, (d) => void delete d['acomodacao'])).toBeNull()
    expect(estragar(MOTO, (d) => void delete d['classe'])).toBeNull()
  })

  it('8 · estado misto: a chave do outro ramo presente', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['classe'] = 'CARRO'))).toBeNull()
    expect(estragar(MOTO, (d) => void (d['acomodacao'] = 'REDE'))).toBeNull()
    expect(estragar(MOTO, (d) => void (d['quantidadePessoas'] = 1))).toBeNull()
  })

  it('9 · incoerente: meia numa suíte, quatro pessoas, meia pessoa', () => {
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['tipo'] = 'MEIA'))).toBeNull()
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['quantidadePessoas'] = 4))).toBeNull()
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['quantidadePessoas'] = 1.5))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['quantidadePessoas'] = 2))).toBeNull()
  })

  it('9 · incoerente: gratuidade sem subtipo, e subtipo sem gratuidade', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['gratuidade'])).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['tipo'] = 'MEIA'))).toBeNull()
  })

  it('9 · incoerente: moto sem cilindrada, e cilindrada num carro', () => {
    expect(estragar(MOTO, (d) => void delete d['cilindrada'])).toBeNull()
    expect(estragar(MOTO, (d) => void (d['classe'] = 'CARRO'))).toBeNull()
  })

  it('9 · incoerente: telefone que não é celular, e conversão pela metade', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['cliente'] = { nome: 'Maria', telefone: '9132221111' }))).toBeNull()
    expect(estragar(CONVERTIDA, (d) => void delete d['passagemId'])).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['passagemId'] = 'passagem-xyz'))).toBeNull()
  })

  it('as classes novas do aplicativo são lidas — e "carreta" é o rebocado', () => {
    for (const classe of ['CARRETA_CAVALINHO', 'ONIBUS', 'JET_SKI', 'RETROESCAVADEIRA']) {
      const lida = estragar(CARRETA, (d) => void (d['classe'] = classe))
      expect(lida?.categoria === 'VEICULO' && lida.classe, classe).toBe(classe)
    }
  })

  it('a grafia legada dos enums é tolerada — é a mesma fronteira do Kotlin', () => {
    const lido = estragar(REDE_GRATUIDADE, (d) => {
      d['categoria'] = ' passageiro '
      d['gratuidade'] = 'idoso'
    })
    expect(lido).toEqual(REDE_GRATUIDADE)
  })

  it('opcional em branco é ausência; opcional de outro tipo recusa', () => {
    const lido = estragar(SUITE_PARA_TRES, (d) => void (d['observacao'] = '   '))
    expect(lido !== null && 'observacao' in lido).toBe(false)
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['observacao'] = 42))).toBeNull()
    expect(estragar(SUITE_PARA_TRES, (d) => void delete d['agenciaId'])).not.toBeNull()
  })
})
