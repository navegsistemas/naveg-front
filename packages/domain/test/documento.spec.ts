/**
 * **O codec** — ida e volta, e as recusas.
 *
 * Cada recusa parte de um documento **válido** e estraga um campo só. É a forma de saber que o `null` veio
 * daquele campo, e não de outro que estava errado por acaso no exemplo.
 */
import { describe, expect, it } from 'vitest'

import {
  CAMPOS_DO_DOCUMENTO,
  paraDocumento,
  paraDominio,
  type ReservaDocumento,
} from '../src/reserva/documento.js'
import type { Reserva, ReservaDePassageiro, ReservaDeVeiculo } from '../src/reserva/reserva.js'
import { CPFS_VALIDOS, data, instante, OCORRENCIA } from './exemplos.js'

const BASE = {
  codigo: 'NVG-7K3QP2',
  ocorrencia: OCORRENCIA,
  contato: { nome: 'Maria Souza', whatsapp: '5591988887777' },
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
  passageiros: [
    { nome: 'José Souza', tipoDocumento: 'CPF', numeroDocumento: CPFS_VALIDOS[0], dataNascimento: data('1950-03-02') },
  ],
}

const SUITE_PARA_TRES: ReservaDePassageiro = {
  ...BASE,
  codigo: 'NVG-5V1TE3',
  categoria: 'PASSAGEIRO',
  acomodacao: 'SUITE',
  tipo: 'INTEIRA',
  agenciaId: 'agencia-naveg-belem',
  observacao: 'Chegamos de ônibus às 17h.',
  passageiros: [
    { nome: 'Ana', tipoDocumento: 'CPF', numeroDocumento: CPFS_VALIDOS[0], dataNascimento: data('1985-01-10') },
    { nome: 'Bruno', tipoDocumento: 'RG', numeroDocumento: '1234567', dataNascimento: data('1983-07-22') },
    { nome: 'Caio', tipoDocumento: 'PASSAPORTE', numeroDocumento: 'AB123456', dataNascimento: data('2019-11-30') },
  ],
}

const MOTO: ReservaDeVeiculo = {
  ...BASE,
  codigo: 'NVG-M0T0CG',
  categoria: 'VEICULO',
  classe: 'MOTO',
  veiculo: { placa: 'ABC1D23', modelo: 'CG 160', cor: 'Vermelha', cilindrada: 160 },
  responsavel: { nome: 'Pedro Souza', tipoDocumento: 'CPF', numeroDocumento: CPFS_VALIDOS[1], dataNascimento: data('1990-08-08') },
}

const CAMINHAO: ReservaDeVeiculo = {
  ...BASE,
  codigo: 'NVG-CAM1NH',
  categoria: 'VEICULO',
  classe: 'CAMINHAO',
  veiculo: { placa: 'XYZ9K87' },
}

const CONVERTIDA: ReservaDePassageiro = {
  ...REDE_GRATUIDADE,
  codigo: 'NVG-C0NV3R',
  status: 'CONVERTIDA',
  passagemId: 'passagem-abc',
}

const EXEMPLOS: readonly Reserva[] = [REDE_GRATUIDADE, SUITE_PARA_TRES, MOTO, CAMINHAO, CONVERTIDA]

/** O que o Firestore devolve: um objeto sem protótipo de classe, e sem `undefined`. */
function comoFirestore(documento: ReservaDocumento): Record<string, unknown> {
  return JSON.parse(JSON.stringify(documento)) as Record<string, unknown>
}

describe('ida e volta', () => {
  for (const reserva of EXEMPLOS) {
    it(`${reserva.codigo}: domínio → documento → domínio é identidade`, () => {
      const documento = comoFirestore(paraDocumento(reserva))
      expect(paraDominio(reserva.codigo, documento)).toEqual(reserva)
    })
  }

  it('o documento é JSON puro: nenhum `undefined`, nenhum `null` escrito', () => {
    for (const reserva of EXEMPLOS) {
      const documento = paraDocumento(reserva)
      const texto = JSON.stringify(documento)
      expect(texto, reserva.codigo).not.toContain('null')
      expect(Object.values(documento), reserva.codigo).not.toContain(undefined)
    }
  })

  it('o código não é um campo — ele é o id', () => {
    expect('codigo' in paraDocumento(REDE_GRATUIDADE)).toBe(false)
  })

  it('os campos de consulta estão no topo, planos', () => {
    const documento = paraDocumento(SUITE_PARA_TRES)
    expect(documento.status).toBe('RESERVADA')
    expect(documento.viagemId).toBe(OCORRENCIA.viagemId)
    expect(documento.data).toBe('2026-10-14')
    expect(documento.agenciaId).toBe('agencia-naveg-belem')
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

  it('o sub-objeto do outro ramo nunca é escrito', () => {
    const passageiro = paraDocumento(SUITE_PARA_TRES)
    expect(Object.keys(passageiro)).not.toContain('veiculo')
    expect(Object.keys(passageiro)).not.toContain('classe')

    const veiculo = paraDocumento(MOTO)
    expect(Object.keys(veiculo)).not.toContain('passageiros')
    expect(Object.keys(veiculo)).not.toContain('acomodacao')
  })

  it('os nomes são os que a Rule do passo 9 vai conferir', () => {
    /* A Rule cita estes pelo nome. Renomear um aqui sem renomear lá abre a porta ou a fecha para todos. */
    for (const chave of ['status', 'origem', 'data', 'passageiros']) {
      expect(CAMPOS_DO_DOCUMENTO).toContain(chave)
    }
  })

  it('uma chave extra na leitura é ignorada — quem a recusa é a Rule, na escrita', () => {
    const documento = { ...comoFirestore(paraDocumento(REDE_GRATUIDADE)), criadoPor: 'uid-anonimo' }
    expect(paraDominio(REDE_GRATUIDADE.codigo, documento)).toEqual(REDE_GRATUIDADE)
  })
})

describe('as recusas', () => {
  function estragar(
    reserva: Reserva,
    alterar: (documento: Record<string, unknown>) => void,
  ): Reserva | null {
    const documento = comoFirestore(paraDocumento(reserva))
    alterar(documento)
    return paraDominio(reserva.codigo, documento)
  }

  it('o exemplo intacto é aceito — sem isso, as recusas abaixo não provam nada', () => {
    expect(estragar(REDE_GRATUIDADE, () => {})).not.toBeNull()
    expect(estragar(MOTO, () => {})).not.toBeNull()
  })

  it('1 · id que não é um código NVG', () => {
    const documento = comoFirestore(paraDocumento(REDE_GRATUIDADE))
    expect(paraDominio('', documento)).toBeNull()
    expect(paraDominio('abc123', documento)).toBeNull()
    expect(paraDominio('nvg-7k3qp2', documento)).toBeNull()
  })

  it('1b · dado que não é objeto', () => {
    for (const lixo of [null, undefined, 'texto', 42, [], true]) {
      expect(paraDominio('NVG-7K3QP2', lixo), String(lixo)).toBeNull()
    }
  })

  it('2 · categoria ilegível', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['categoria'] = 'CARGA'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['categoria'])).toBeNull()
  })

  it('3 · ocorrência ilegível: sem viagem, ou data que não existe', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['viagemId'] = '  '))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['data'] = '2026-02-30'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['data'] = '14/10/2026'))).toBeNull()
  })

  it('4 · status ou origem fora do vocabulário', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['status'] = 'A_EMITIR'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['origem'] = 'BALCAO'))).toBeNull()
  })

  it('5 · instantes ilegíveis', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['expiraEm'] = 'amanhã'))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['criadoEm'])).toBeNull()
  })

  it('6 · contato ausente ou pela metade', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['contato'])).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['contato'] = { nome: 'Maria' }))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['contato'] = 'Maria, 91988887777'))).toBeNull()
  })

  it('7 · sujeito ausente: nenhum passageiro, ou nenhum veículo', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['passageiros'] = []))).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['passageiros'])).toBeNull()
    expect(estragar(MOTO, (d) => void delete d['veiculo'])).toBeNull()
    expect(estragar(MOTO, (d) => void (d['veiculo'] = { modelo: 'CG' }))).toBeNull()
  })

  it('8 · estado misto: o sub-objeto do outro ramo presente', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['veiculo'] = { placa: 'ABC1D23' }))).toBeNull()
    expect(estragar(MOTO, (d) => void (d['passageiros'] = []))).toBeNull()
    expect(estragar(MOTO, (d) => void (d['acomodacao'] = 'REDE'))).toBeNull()
  })

  it('9 · incoerente: meia numa suíte', () => {
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['tipo'] = 'MEIA'))).toBeNull()
  })

  it('9 · incoerente: quatro pessoas numa suíte', () => {
    expect(
      estragar(SUITE_PARA_TRES, (d) => {
        const lista = d['passageiros'] as unknown[]
        d['passageiros'] = [...lista, lista[0]]
      }),
    ).toBeNull()
  })

  it('9 · incoerente: gratuidade sem subtipo, e subtipo sem gratuidade', () => {
    expect(estragar(REDE_GRATUIDADE, (d) => void delete d['gratuidade'])).toBeNull()
    expect(
      estragar(REDE_GRATUIDADE, (d) => {
        d['tipo'] = 'MEIA'
      }),
    ).toBeNull()
  })

  it('9 · incoerente: convertida sem passagem, e passagem sem conversão', () => {
    expect(estragar(CONVERTIDA, (d) => void delete d['passagemId'])).toBeNull()
    expect(estragar(REDE_GRATUIDADE, (d) => void (d['passagemId'] = 'passagem-xyz'))).toBeNull()
  })

  it('9 · incoerente: moto sem cilindrada', () => {
    expect(
      estragar(MOTO, (d) => {
        const { cilindrada: _, ...resto } = d['veiculo'] as Record<string, unknown>
        d['veiculo'] = resto
      }),
    ).toBeNull()
  })

  it('carro sem modelo é aceito — no aplicativo o modelo é opcional, e o bilhete mostra a classe', () => {
    expect(estragar(CAMINHAO, (d) => void (d['classe'] = 'CARRO'))).not.toBeNull()
  })

  it('9 · incoerente: placa fora da forma canônica — é o id em `veiculos/{placa}`', () => {
    expect(estragar(CAMINHAO, (d) => void (d['veiculo'] = { placa: 'xyz-9k87' }))).toBeNull()
  })

  it('9 · incoerente: a mesma pessoa duas vezes — o CLIENTE_REPETIDO do aplicativo', () => {
    expect(
      estragar(SUITE_PARA_TRES, (d) => {
        const lista = d['passageiros'] as unknown[]
        d['passageiros'] = [lista[0], lista[0]]
      }),
    ).toBeNull()
  })

  it('responsável presente e ilegível recusa; ausente é a forma normal', () => {
    expect(estragar(MOTO, (d) => void (d['responsavel'] = 'Pedro Souza'))).toBeNull()
    expect(estragar(MOTO, (d) => void (d['responsavel'] = { nome: 'Pedro' }))).toBeNull()
    expect(estragar(MOTO, (d) => void delete d['responsavel'])).not.toBeNull()
  })

  it('as classes novas do aplicativo são lidas — e "carreta" é o rebocado', () => {
    for (const classe of ['CARRETA_CAVALINHO', 'ONIBUS', 'JET_SKI', 'RETROESCAVADEIRA']) {
      const lida = estragar(CAMINHAO, (d) => void (d['classe'] = classe))
      expect(lida?.categoria === 'VEICULO' && lida.classe, classe).toBe(classe)
    }
  })

  it('9 · incoerente: CPF com dígito trocado', () => {
    expect(
      estragar(REDE_GRATUIDADE, (d) => {
        const [titular] = d['passageiros'] as Record<string, unknown>[]
        d['passageiros'] = [{ ...titular, numeroDocumento: '52998224726' }]
      }),
    ).toBeNull()
  })

  it('10 · um passageiro ilegível recusa a reserva inteira — não some da lista', () => {
    /* Descartar só o ilegível faria a suíte para três chegar ao atendente como suíte para dois. */
    for (const estrago of [
      { dataNascimento: '1983-02-30' },
      { tipoDocumento: 'CERTIDAO' },
      { nome: 42 },
    ]) {
      const resultado = estragar(SUITE_PARA_TRES, (d) => {
        const lista = d['passageiros'] as Record<string, unknown>[]
        d['passageiros'] = [lista[0], { ...lista[1], ...estrago }, lista[2]]
      })
      expect(resultado, JSON.stringify(estrago)).toBeNull()
    }
  })

  it('opcional com tipo errado também recusa — foi escrito por fora do codec', () => {
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['observacao'] = 42))).toBeNull()
    expect(estragar(SUITE_PARA_TRES, (d) => void (d['agenciaId'] = { id: 'x' }))).toBeNull()
    expect(estragar(MOTO, (d) => void ((d['veiculo'] as Record<string, unknown>)['cilindrada'] = '160'))).toBeNull()
  })

  it('opcional em branco é ausência, não recusa', () => {
    const lido = estragar(SUITE_PARA_TRES, (d) => void (d['observacao'] = '   '))
    expect(lido).not.toBeNull()
    expect(lido !== null && 'observacao' in lido).toBe(false)
  })

  it('a grafia legada dos enums é tolerada — é a mesma fronteira do Kotlin', () => {
    const lido = estragar(REDE_GRATUIDADE, (d) => {
      d['categoria'] = ' passageiro '
      d['gratuidade'] = 'idoso'
    })
    expect(lido).toEqual(REDE_GRATUIDADE)
  })

  it('a agência ausente nunca recusa — ver a nota em Reserva.agenciaId', () => {
    const lido = estragar(SUITE_PARA_TRES, (d) => void delete d['agenciaId'])
    expect(lido).not.toBeNull()
  })
})
