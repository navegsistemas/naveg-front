/**
 * **O roteiro da reserva — a sequência, em cada ramo.**
 *
 * Como no fluviapp, estes cenários não verificam regra de negócio (essas têm cenário onde moram); verificam
 * **a sequência que as regras implicam**. A matriz do plano é coberta inteira: rede/suíte/camarote ×
 * inteira/meia/gratuidade × 1–3 pessoas, e veículo por classe e por casco.
 *
 * E há um bloco a mais, sobre a correção que este roteiro faz ao da emissão: **a resposta que ficou para
 * trás não vaza**.
 */
import { describe, expect, it } from 'vitest'

import { CLASSES_DE_VEICULO, ClasseVeiculo } from '../src/passagem/classe-veiculo.js'
import { NATUREZAS_DE_VEICULO } from '../src/passagem/natureza-veiculo.js'
import { TIPOS_DE_GRATUIDADE } from '../src/passagem/tipo-gratuidade.js'
import {
  camposDoVeiculo,
  camposExigidos,
  chaveDoNo,
  classesOfertadas,
  DOCUMENTOS_DE_PESSOA,
  respondido,
  roteiroDaReserva,
  SEM_RESPONSAVEL,
  semResposta,
  voltar,
  type NoDoRoteiro,
  type RespostasDaReserva,
  type Roteiro,
} from '../src/reserva/roteiro-da-reserva.js'
import { CONTATO, contexto, pessoa, REDE_COMPLETA } from './exemplos.js'

function passos(roteiro: Roteiro): string[] {
  return roteiro.nos.map(chaveDoNo)
}

function no<P extends NoDoRoteiro['passo']>(
  roteiro: Roteiro,
  passo: P,
): Extract<NoDoRoteiro, { passo: P }> {
  const achado = roteiro.nos.find((n) => n.passo === passo)
  if (achado === undefined) throw new Error(`o roteiro não tem o passo ${passo}`)
  return achado as Extract<NoDoRoteiro, { passo: P }>
}

describe('o começo', () => {
  it('sem resposta nenhuma, são três passos: categoria, contato e conferência', () => {
    const roteiro = roteiroDaReserva({}, contexto())
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'CONTATO', 'CONFERENCIA'])
    expect(roteiro.atual?.passo).toBe('CATEGORIA')
    expect(roteiro.posicaoAtual).toBe(1)
    expect(roteiro.prontoParaConferir).toBe(false)
  })

  it('o contato e a conferência existem desde o primeiro passo — o indicador cresce, não encurta', () => {
    for (const casco of ['FERRY_BOAT', 'NAVIO', 'LANCHA'] as const) {
      expect(passos(roteiroDaReserva({}, contexto(casco))).slice(-2)).toEqual(['CONTATO', 'CONFERENCIA'])
    }
  })

  it('não existe passo de pagamento em caminho nenhum — não se vende aqui', () => {
    const caminhos: RespostasDaReserva[] = [
      {},
      REDE_COMPLETA,
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', quantidadePessoas: 3 },
      { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO' },
    ]
    for (const respostas of caminhos) {
      expect(passos(roteiroDaReserva(respostas, contexto()))).not.toContain('PAGAMENTO')
    }
  })
})

describe('a categoria depende do casco', () => {
  it('no ferry e no navio, passageiro e veículo', () => {
    expect(no(roteiroDaReserva({}, contexto('FERRY_BOAT')), 'CATEGORIA').opcoes).toEqual([
      'PASSAGEIRO',
      'VEICULO',
    ])
    expect(no(roteiroDaReserva({}, contexto('NAVIO')), 'CATEGORIA').opcoes).toEqual([
      'PASSAGEIRO',
      'VEICULO',
    ])
  })

  it('na lancha, "Veículo" não é uma opção desabilitada — não é uma opção', () => {
    expect(no(roteiroDaReserva({}, contexto('LANCHA')), 'CATEGORIA').opcoes).toEqual(['PASSAGEIRO'])
  })

  it('e responder "veículo" numa lancha não abre o ramo do veículo', () => {
    const roteiro = roteiroDaReserva({ categoria: 'VEICULO' }, contexto('LANCHA'))
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'CONTATO', 'CONFERENCIA'])
    expect(roteiro.atual?.passo).toBe('CATEGORIA')
  })
})

describe('o ramo de passageiro', () => {
  const PASSAGEIRO: RespostasDaReserva = { categoria: 'PASSAGEIRO' }

  it('a acomodação oferece as três', () => {
    expect(no(roteiroDaReserva(PASSAGEIRO, contexto()), 'ACOMODACAO').opcoes).toEqual([
      'REDE',
      'SUITE',
      'CAMAROTE',
    ])
  })

  describe('rede — uma pessoa, com escolha de tipo', () => {
    it('inteira: acomodação, tipo, quem viaja', () => {
      const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao: 'REDE', tipo: 'INTEIRA' }, contexto())
      expect(passos(roteiro)).toEqual([
        'CATEGORIA',
        'ACOMODACAO',
        'TIPO_TARIFARIO',
        'QUEM_VIAJA#0',
        'CONTATO',
        'CONFERENCIA',
      ])
    })

    it('meia: o mesmo caminho', () => {
      const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao: 'REDE', tipo: 'MEIA' }, contexto())
      expect(passos(roteiro)).toEqual([
        'CATEGORIA',
        'ACOMODACAO',
        'TIPO_TARIFARIO',
        'QUEM_VIAJA#0',
        'CONTATO',
        'CONFERENCIA',
      ])
    })

    it('gratuidade acrescenta o passo do subtipo — gratuidade sem subtipo não se escreve', () => {
      const roteiro = roteiroDaReserva(
        { ...PASSAGEIRO, acomodacao: 'REDE', tipo: 'GRATUIDADE' },
        contexto(),
      )
      expect(passos(roteiro)).toEqual([
        'CATEGORIA',
        'ACOMODACAO',
        'TIPO_TARIFARIO',
        'TIPO_GRATUIDADE',
        'QUEM_VIAJA#0',
        'CONTATO',
        'CONFERENCIA',
      ])
      expect(no(roteiro, 'TIPO_GRATUIDADE').opcoes).toEqual(TIPOS_DE_GRATUIDADE)
    })

    it('o tipo tarifário oferece os três, e a rede nunca pergunta quantidade', () => {
      const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao: 'REDE' }, contexto())
      expect(no(roteiro, 'TIPO_TARIFARIO').opcoes).toEqual(['INTEIRA', 'MEIA', 'GRATUIDADE'])
      expect(passos(roteiro)).not.toContain('QUANTIDADE_PESSOAS')
    })

    it('mesmo que a resposta diga três pessoas, a rede leva uma', () => {
      const roteiro = roteiroDaReserva(
        { ...PASSAGEIRO, acomodacao: 'REDE', tipo: 'INTEIRA', quantidadePessoas: 3 },
        contexto(),
      )
      expect(passos(roteiro).filter((p) => p.startsWith('QUEM_VIAJA'))).toEqual(['QUEM_VIAJA#0'])
    })
  })

  for (const acomodacao of ['SUITE', 'CAMAROTE'] as const) {
    describe(`${acomodacao.toLowerCase()} — até três pessoas, sempre inteira`, () => {
      it('não pergunta tipo tarifário: um seletor de um item é uma pergunta sem alternativa', () => {
        const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao }, contexto())
        expect(passos(roteiro)).not.toContain('TIPO_TARIFARIO')
        expect(passos(roteiro)).not.toContain('TIPO_GRATUIDADE')
      })

      it('pergunta a quantidade, de 1 a 3', () => {
        const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao }, contexto())
        expect(no(roteiro, 'QUANTIDADE_PESSOAS').opcoes).toEqual([1, 2, 3])
      })

      for (const quantidade of [1, 2, 3]) {
        it(`para ${quantidade}: um passo por pessoa, e o titular é o primeiro`, () => {
          const roteiro = roteiroDaReserva(
            { ...PASSAGEIRO, acomodacao, quantidadePessoas: quantidade },
            contexto(),
          )
          const quemViaja = roteiro.nos.filter(
            (n): n is Extract<NoDoRoteiro, { passo: 'QUEM_VIAJA' }> => n.passo === 'QUEM_VIAJA',
          )
          expect(quemViaja.map((n) => n.pessoa)).toEqual(Array.from({ length: quantidade }, (_, i) => i))
          expect(quemViaja.map((n) => n.ehTitular)).toEqual(
            Array.from({ length: quantidade }, (_, i) => i === 0),
          )
          expect(passos(roteiro)).toEqual([
            'CATEGORIA',
            'ACOMODACAO',
            'QUANTIDADE_PESSOAS',
            ...quemViaja.map(chaveDoNo),
            'CONTATO',
            'CONFERENCIA',
          ])
        })
      }

      it('uma quantidade fora da faixa não amplia a ocupação — não é resposta', () => {
        const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao, quantidadePessoas: 4 }, contexto())
        expect(roteiro.atual?.passo).toBe('QUANTIDADE_PESSOAS')
        expect(passos(roteiro).filter((p) => p.startsWith('QUEM_VIAJA'))).toEqual(['QUEM_VIAJA#0'])
      })
    })
  }

  it('suíte para três acrescenta dois passos em relação a suíte para um', () => {
    const umaPessoa = roteiroDaReserva(
      { ...PASSAGEIRO, acomodacao: 'SUITE', quantidadePessoas: 1 },
      contexto(),
    )
    const tresPessoas = roteiroDaReserva(
      { ...PASSAGEIRO, acomodacao: 'SUITE', quantidadePessoas: 3 },
      contexto(),
    )
    expect(tresPessoas.total - umaPessoa.total).toBe(2)
  })

  it('o passo de quem viaja oferece os documentos de pessoa — e o CNPJ não está entre eles', () => {
    const roteiro = roteiroDaReserva(REDE_COMPLETA, contexto())
    const documentos = no(roteiro, 'QUEM_VIAJA').documentos
    expect(documentos).toEqual(DOCUMENTOS_DE_PESSOA)
    expect(documentos).toEqual(['CPF', 'RG', 'CNH', 'PASSAPORTE'])
    expect(documentos).not.toContain('CNPJ')
  })
})

describe('o ramo de veículo — natureza, depois classe, como no roteiro do aplicativo', () => {
  it('o ferry oferece as quatro naturezas; o navio, só as que têm classe a bordo', () => {
    expect(no(roteiroDaReserva({ categoria: 'VEICULO' }, contexto('FERRY_BOAT')), 'NATUREZA_VEICULO').opcoes).toEqual(
      NATUREZAS_DE_VEICULO,
    )
    expect(no(roteiroDaReserva({ categoria: 'VEICULO' }, contexto('NAVIO')), 'NATUREZA_VEICULO').opcoes).toEqual([
      'AUTOMOTOR',
      'MOTOCICLO',
    ])
  })

  it('no ferry, a natureza abre o subpasso da classe com as classes dela', () => {
    const roteiro = roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'REBOCADO' }, contexto('FERRY_BOAT'))
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'NATUREZA_VEICULO', 'CLASSE_VEICULO', 'CONTATO', 'CONFERENCIA'])
    expect(no(roteiro, 'CLASSE_VEICULO').opcoes).toEqual(['CARRETA', 'TRAILER', 'CARRETILHA', 'JET_SKI', 'LANCHA'])
    expect(ClasseVeiculo.daNatureza('MOTOCICLO')).toEqual(['MOTO', 'QUADRICICLO'])
  })

  it('no navio a classe não se pergunta — cada natureza tem uma só a bordo, e ela já é a resposta', () => {
    const roteiro = roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO' }, contexto('NAVIO'))
    expect(passos(roteiro)).toEqual([
      'CATEGORIA',
      'NATUREZA_VEICULO',
      'DADOS_VEICULO',
      'RESPONSAVEL',
      'CONTATO',
      'CONFERENCIA',
    ])
    expect(no(roteiro, 'DADOS_VEICULO').classe).toBe('MOTO')
    expect(classesOfertadas('AUTOMOTOR', 'NAVIO')).toEqual(['CARRO'])
  })

  it('escolhida a classe: dados do veículo e o responsável opcional, antes do contato', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'ONIBUS' },
      contexto('FERRY_BOAT'),
    )
    expect(passos(roteiro)).toEqual([
      'CATEGORIA',
      'NATUREZA_VEICULO',
      'CLASSE_VEICULO',
      'DADOS_VEICULO',
      'RESPONSAVEL',
      'CONTATO',
      'CONFERENCIA',
    ])
  })

  it('só a moto pede cilindrada; a placa é o único campo exigido nas demais — o modelo é opcional', () => {
    for (const classe of CLASSES_DE_VEICULO) {
      const esperadoCampos = classe === 'MOTO' ? ['PLACA', 'MODELO', 'COR', 'CILINDRADA'] : ['PLACA', 'MODELO', 'COR']
      const esperadoExigidos = classe === 'MOTO' ? ['PLACA', 'CILINDRADA'] : ['PLACA']
      expect(camposDoVeiculo(classe), classe).toEqual(esperadoCampos)
      expect(camposExigidos(classe), classe).toEqual(esperadoExigidos)
    }
  })

  it('van não embarca em navio — o ADR-0031 D4 encolheu a lista para carro e moto', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'VAN' },
      contexto('NAVIO'),
    )
    /* No navio a classe é derivada (carro); a van que sobrou nas respostas não entra. */
    expect(no(roteiro, 'DADOS_VEICULO').classe).toBe('CARRO')
  })

  it('máquina escolhida num navio não é resposta — o navio não a oferece', () => {
    const roteiro = roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'MAQUINA' }, contexto('NAVIO'))
    expect(roteiro.atual?.passo).toBe('NATUREZA_VEICULO')
  })
})

describe('respondido, nó a nó', () => {
  it('categoria, acomodação, tipo, subtipo e quantidade: só conta o que estava entre as opções', () => {
    const ctx = contexto()
    const r = roteiroDaReserva(
      { categoria: 'PASSAGEIRO', acomodacao: 'REDE', tipo: 'GRATUIDADE', gratuidade: 'IDOSO' },
      ctx,
    )
    expect(respondido(no(r, 'CATEGORIA'), { categoria: 'PASSAGEIRO' })).toBe(true)
    expect(respondido(no(r, 'ACOMODACAO'), { acomodacao: 'REDE' })).toBe(true)
    expect(respondido(no(r, 'TIPO_TARIFARIO'), { tipo: 'MEIA' })).toBe(true)
    expect(respondido(no(r, 'TIPO_GRATUIDADE'), { gratuidade: 'PCD' })).toBe(true)
    expect(respondido(no(r, 'TIPO_GRATUIDADE'), {})).toBe(false)

    const suite = roteiroDaReserva({ categoria: 'PASSAGEIRO', acomodacao: 'SUITE' }, ctx)
    expect(respondido(no(suite, 'QUANTIDADE_PESSOAS'), { quantidadePessoas: 2 })).toBe(true)
    expect(respondido(no(suite, 'QUANTIDADE_PESSOAS'), { quantidadePessoas: 0 })).toBe(false)
    expect(respondido(no(suite, 'QUANTIDADE_PESSOAS'), { quantidadePessoas: 4 })).toBe(false)
  })

  it('quem viaja: nome, documento de um tipo oferecido, número e nascimento — todos presentes', () => {
    const quemViaja = no(roteiroDaReserva(REDE_COMPLETA, contexto()), 'QUEM_VIAJA')
    const completo = pessoa(0)

    expect(respondido(quemViaja, { passageiros: [completo] })).toBe(true)
    expect(respondido(quemViaja, { passageiros: [] })).toBe(false)
    expect(respondido(quemViaja, { passageiros: [undefined] })).toBe(false)
    expect(respondido(quemViaja, { passageiros: [{ ...completo, nome: '   ' }] })).toBe(false)
    expect(respondido(quemViaja, { passageiros: [{ ...completo, numeroDocumento: '' }] })).toBe(false)
    expect(respondido(quemViaja, { passageiros: [{ ...completo, tipoDocumento: 'CNPJ' }] })).toBe(false)

    const { dataNascimento: _, ...semNascimento } = completo
    expect(respondido(quemViaja, { passageiros: [semNascimento] })).toBe(false)
  })

  it('quem viaja pergunta presença, não validade — o CPF errado é recusado na montagem, dizendo por quê', () => {
    const quemViaja = no(roteiroDaReserva(REDE_COMPLETA, contexto()), 'QUEM_VIAJA')
    expect(respondido(quemViaja, { passageiros: [{ ...pessoa(0), numeroDocumento: '52998224726' }] })).toBe(true)
  })

  it('dados do veículo: a placa trava, o modelo e a cor não, a cilindrada só na moto', () => {
    const carro = no(
      roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO' }, contexto()),
      'DADOS_VEICULO',
    )
    expect(respondido(carro, { veiculo: { placa: 'ABC1D23' } })).toBe(true)
    expect(respondido(carro, { veiculo: { modelo: 'Gol' } })).toBe(false)

    const moto = no(
      roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO' }, contexto()),
      'DADOS_VEICULO',
    )
    expect(respondido(moto, { veiculo: { placa: 'ABC1D23', modelo: 'CG' } })).toBe(false)
    expect(respondido(moto, { veiculo: { placa: 'ABC1D23', cilindrada: 0 } })).toBe(false)
    expect(respondido(moto, { veiculo: { placa: 'ABC1D23', cilindrada: 160 } })).toBe(true)

    const quadriciclo = no(
      roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'QUADRICICLO' }, contexto()),
      'DADOS_VEICULO',
    )
    expect(respondido(quadriciclo, { veiculo: { placa: 'ABC1D23' } })).toBe(true)
  })

  it('responsável: pular é uma resposta; começar a preencher obriga a terminar', () => {
    const responsavel = no(
      roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO' }, contexto()),
      'RESPONSAVEL',
    )
    expect(respondido(responsavel, {})).toBe(false)
    expect(respondido(responsavel, { responsavel: SEM_RESPONSAVEL })).toBe(true)
    expect(respondido(responsavel, { responsavel: pessoa(1) })).toBe(true)
    expect(respondido(responsavel, { responsavel: { nome: 'Pedro' } })).toBe(false)
  })

  it('contato: nome e WhatsApp presentes', () => {
    const contato = no(roteiroDaReserva({}, contexto()), 'CONTATO')
    expect(respondido(contato, { contato: CONTATO })).toBe(true)
    expect(respondido(contato, { contato: { nome: 'Maria' } })).toBe(false)
    expect(respondido(contato, { contato: { whatsapp: '91988887777' } })).toBe(false)
    expect(respondido(contato, {})).toBe(false)
  })

  it('a conferência nunca se responde — confirmá-la é enviar', () => {
    expect(respondido({ passo: 'CONFERENCIA' }, REDE_COMPLETA)).toBe(false)
  })
})

describe('o foco e o indicador', () => {
  it('a rede completa chega à conferência, pronta para conferir', () => {
    const roteiro = roteiroDaReserva(REDE_COMPLETA, contexto())
    expect(roteiro.atual?.passo).toBe('CONFERENCIA')
    expect(roteiro.posicaoAtual).toBe(roteiro.total)
    expect(roteiro.prontoParaConferir).toBe(true)
  })

  it('o foco é o primeiro nó sem resposta, mesmo com respostas adiante', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'PASSAGEIRO', acomodacao: 'REDE', contato: CONTATO, passageiros: [pessoa(0)] },
      contexto(),
    )
    expect(roteiro.atual?.passo).toBe('TIPO_TARIFARIO')
    expect(roteiro.prontoParaConferir).toBe(false)
  })

  it('ao longo de um caminho, o total nunca diminui — o indicador cresce', () => {
    const caminho: RespostasDaReserva[] = [
      {},
      { categoria: 'PASSAGEIRO' },
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE' },
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', quantidadePessoas: 3 },
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', quantidadePessoas: 3, passageiros: [pessoa(0)] },
    ]
    const totais = caminho.map((respostas) => roteiroDaReserva(respostas, contexto()).total)
    for (let i = 1; i < totais.length; i += 1) {
      expect(totais[i]).toBeGreaterThanOrEqual(totais[i - 1] as number)
    }
    expect(totais).toEqual([3, 4, 6, 8, 8])
  })
})

describe('a resposta que ficou para trás não vaza', () => {
  /* No aplicativo, o ViewModel limpa a resposta ao trocar a escolha. Aqui não há ViewModel: a garantia mora
     na leitura, e estes cenários são o que a sustenta. */

  it('rede → gratuidade, depois troca para suíte: o passo do subtipo some', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', tipo: 'GRATUIDADE', gratuidade: 'IDOSO' },
      contexto(),
    )
    expect(passos(roteiro)).not.toContain('TIPO_GRATUIDADE')
    expect(passos(roteiro)).not.toContain('TIPO_TARIFARIO')
  })

  it('suíte para três, depois troca para rede: os dois acompanhantes somem do caminho', () => {
    const roteiro = roteiroDaReserva(
      {
        categoria: 'PASSAGEIRO',
        acomodacao: 'REDE',
        tipo: 'INTEIRA',
        quantidadePessoas: 3,
        passageiros: [pessoa(0), pessoa(1), pessoa(2)],
      },
      contexto(),
    )
    expect(passos(roteiro).filter((p) => p.startsWith('QUEM_VIAJA'))).toEqual(['QUEM_VIAJA#0'])
  })

  it('veículo escolhido, depois troca para passageiro: o ramo do veículo some', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'PASSAGEIRO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO', veiculo: { placa: 'ABC1D23' } },
      contexto(),
    )
    expect(passos(roteiro)).not.toContain('NATUREZA_VEICULO')
    expect(passos(roteiro)).not.toContain('DADOS_VEICULO')
  })
})

describe('voltar apaga a resposta certa', () => {
  const TODOS_OS_NOS: RespostasDaReserva[] = [
    { categoria: 'PASSAGEIRO', acomodacao: 'REDE', tipo: 'GRATUIDADE', gratuidade: 'PCD', passageiros: [pessoa(0)], contato: CONTATO },
    { categoria: 'PASSAGEIRO', acomodacao: 'CAMAROTE', quantidadePessoas: 3, passageiros: [pessoa(0), pessoa(1), pessoa(2)], contato: CONTATO },
    { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', veiculo: { placa: 'ABC1D23', modelo: 'CG', cilindrada: 160 }, responsavel: pessoa(1), contato: CONTATO },
    { categoria: 'VEICULO', naturezaVeiculo: 'REBOCADO', classeVeiculo: 'JET_SKI', veiculo: { placa: 'JET0001' }, responsavel: SEM_RESPONSAVEL, contato: CONTATO },
  ]

  it('semResposta é o inverso exato de respondido, em todo nó de todo ramo', () => {
    for (const respostas of TODOS_OS_NOS) {
      const roteiro = roteiroDaReserva(respostas, contexto())
      for (const n of roteiro.nos) {
        if (n.passo === 'CONFERENCIA') continue
        expect(respondido(n, respostas), `${chaveDoNo(n)} respondido`).toBe(true)
        expect(respondido(n, semResposta(n, respostas)), `${chaveDoNo(n)} apagado`).toBe(false)
      }
    }
  })

  it('apagar um nó não toca nos outros', () => {
    const respostas = TODOS_OS_NOS[1] as RespostasDaReserva
    const roteiro = roteiroDaReserva(respostas, contexto())
    const segundaPessoa = roteiro.nos.find((n) => chaveDoNo(n) === 'QUEM_VIAJA#1') as NoDoRoteiro
    const depois = semResposta(segundaPessoa, respostas)

    expect(depois.passageiros?.[0]).toEqual(pessoa(0))
    expect(depois.passageiros?.[1]).toBeUndefined()
    expect(depois.passageiros?.[2]).toEqual(pessoa(2))
    expect(depois.contato).toEqual(CONTATO)
  })

  it('a chave apagada é omitida, não posta em undefined', () => {
    const depois = semResposta({ passo: 'CONTATO' }, REDE_COMPLETA)
    expect('contato' in depois).toBe(false)
  })

  it('na conferência, voltar apaga o contato — o nó anterior', () => {
    const depois = voltar(REDE_COMPLETA, contexto())
    expect('contato' in depois).toBe(false)
    expect(roteiroDaReserva(depois, contexto()).atual?.passo).toBe('CONTATO')
  })

  it('no meio do caminho, voltar apaga o nó antes do foco e o põe em foco', () => {
    const respostas: RespostasDaReserva = { categoria: 'PASSAGEIRO', acomodacao: 'SUITE' }
    expect(roteiroDaReserva(respostas, contexto()).atual?.passo).toBe('QUANTIDADE_PESSOAS')

    const depois = voltar(respostas, contexto())
    expect(depois).toEqual({ categoria: 'PASSAGEIRO' })
    expect(roteiroDaReserva(depois, contexto()).atual?.passo).toBe('ACOMODACAO')
  })

  it('no primeiro passo não há para onde voltar', () => {
    expect(voltar({}, contexto())).toEqual({})
  })
})
