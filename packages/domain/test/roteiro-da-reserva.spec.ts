/**
 * **O roteiro da reserva — a sequência, em cada ramo.**
 *
 * Como no fluviapp, estes cenários não verificam regra de negócio (essas têm cenário onde moram); verificam
 * **a sequência que as regras implicam**: rede/suíte/camarote × inteira/meia/gratuidade × 1–3 pessoas, e
 * veículo por natureza, classe e casco. E um bloco sobre a resposta que ficou para trás.
 */
import { describe, expect, it } from 'vitest'

import { NATUREZAS_DE_VEICULO } from '../src/passagem/natureza-veiculo.js'
import { TIPOS_DE_GRATUIDADE } from '../src/passagem/tipo-gratuidade.js'
import {
  chaveDoNo,
  embarcacaoLeva,
  embarqueRespondido,
  classesOfertadas,
  respondido,
  roteiroDaReserva,
  semResposta,
  voltar,
  type NoDoRoteiro,
  type RespostasDaReserva,
  type Roteiro,
} from '../src/reserva/roteiro-da-reserva.js'
import { CLIENTE, contexto, REDE_COMPLETA } from './exemplos.js'

function passos(roteiro: Roteiro): string[] {
  return roteiro.nos.map(chaveDoNo)
}

function no<P extends NoDoRoteiro['passo']>(roteiro: Roteiro, passo: P): Extract<NoDoRoteiro, { passo: P }> {
  const achado = roteiro.nos.find((n) => n.passo === passo)
  if (achado === undefined) throw new Error(`o roteiro não tem o passo ${passo}`)
  return achado as Extract<NoDoRoteiro, { passo: P }>
}

describe('o começo', () => {
  it('sem resposta nenhuma, são três passos: categoria, cliente e conferência', () => {
    const roteiro = roteiroDaReserva({}, contexto())
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'CLIENTE', 'CONFERENCIA'])
    expect(roteiro.atual?.passo).toBe('CATEGORIA')
    expect(roteiro.posicaoAtual).toBe(1)
    expect(roteiro.prontoParaConferir).toBe(false)
  })

  it('nenhum caminho pede documento, pagamento ou dados de pessoa por passageiro', () => {
    const caminhos: RespostasDaReserva[] = [
      REDE_COMPLETA,
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', quantidadePessoas: 3 },
      { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO' },
    ]
    for (const respostas of caminhos) {
      const todos = passos(roteiroDaReserva(respostas, contexto()))
      for (const proibido of ['PAGAMENTO', 'QUEM_VIAJA', 'RESPONSAVEL', 'DADOS_VEICULO']) {
        expect(todos).not.toContain(proibido)
      }
    }
  })
})

describe('a categoria depende do casco', () => {
  it('no ferry e no navio, passageiro e veículo; na lancha, "Veículo" não é opção', () => {
    expect(no(roteiroDaReserva({}, contexto('FERRY_BOAT')), 'CATEGORIA').opcoes).toEqual(['PASSAGEIRO', 'VEICULO'])
    expect(no(roteiroDaReserva({}, contexto('NAVIO')), 'CATEGORIA').opcoes).toEqual(['PASSAGEIRO', 'VEICULO'])
    expect(no(roteiroDaReserva({}, contexto('LANCHA')), 'CATEGORIA').opcoes).toEqual(['PASSAGEIRO'])
  })

  it('e responder "veículo" numa lancha não abre o ramo do veículo', () => {
    const roteiro = roteiroDaReserva({ categoria: 'VEICULO' }, contexto('LANCHA'))
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'CLIENTE', 'CONFERENCIA'])
    expect(roteiro.atual?.passo).toBe('CATEGORIA')
  })
})

describe('o ramo de passageiro', () => {
  const PASSAGEIRO: RespostasDaReserva = { categoria: 'PASSAGEIRO' }

  it('rede: acomodação e tipo tarifário — sem quantidade, a rede é uma por bilhete', () => {
    for (const tipo of ['INTEIRA', 'MEIA'] as const) {
      expect(passos(roteiroDaReserva({ ...PASSAGEIRO, acomodacao: 'REDE', tipo }, contexto()))).toEqual([
        'CATEGORIA',
        'ACOMODACAO',
        'TIPO_TARIFARIO',
        'CLIENTE',
        'CONFERENCIA',
      ])
    }
  })

  it('gratuidade acrescenta o passo do subtipo — gratuidade sem subtipo não se escreve', () => {
    const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao: 'REDE', tipo: 'GRATUIDADE' }, contexto())
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'ACOMODACAO', 'TIPO_TARIFARIO', 'TIPO_GRATUIDADE', 'CLIENTE', 'CONFERENCIA'])
    expect(no(roteiro, 'TIPO_GRATUIDADE').opcoes).toEqual(TIPOS_DE_GRATUIDADE)
    expect(no(roteiro, 'TIPO_TARIFARIO').opcoes).toEqual(['INTEIRA', 'MEIA', 'GRATUIDADE'])
  })

  for (const acomodacao of ['SUITE', 'CAMAROTE'] as const) {
    it(`${acomodacao.toLowerCase()}: sem tipo tarifário, com a quantidade de 1 a 3`, () => {
      const roteiro = roteiroDaReserva({ ...PASSAGEIRO, acomodacao }, contexto())
      expect(passos(roteiro)).toEqual(['CATEGORIA', 'ACOMODACAO', 'QUANTIDADE_PESSOAS', 'CLIENTE', 'CONFERENCIA'])
      expect(no(roteiro, 'QUANTIDADE_PESSOAS').opcoes).toEqual([1, 2, 3])
    })

    it(`${acomodacao.toLowerCase()}: a quantidade não acrescenta passos — ninguém é identificado aqui`, () => {
      const umaPessoa = roteiroDaReserva({ ...PASSAGEIRO, acomodacao, quantidadePessoas: 1 }, contexto())
      const tresPessoas = roteiroDaReserva({ ...PASSAGEIRO, acomodacao, quantidadePessoas: 3 }, contexto())
      expect(tresPessoas.total).toBe(umaPessoa.total)
    })

    it(`${acomodacao.toLowerCase()}: quantidade fora da faixa não é resposta`, () => {
      expect(roteiroDaReserva({ ...PASSAGEIRO, acomodacao, quantidadePessoas: 4 }, contexto()).atual?.passo).toBe(
        'QUANTIDADE_PESSOAS',
      )
    })
  }
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
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'NATUREZA_VEICULO', 'CLASSE_VEICULO', 'CLIENTE', 'CONFERENCIA'])
    expect(no(roteiro, 'CLASSE_VEICULO').opcoes).toEqual(['CARRETA', 'TRAILER', 'CARRETILHA', 'JET_SKI', 'LANCHA'])
  })

  it('carro: natureza e classe, e nada do veículo em si — placa, modelo e cor são do atendimento', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO' },
      contexto('FERRY_BOAT'),
    )
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'NATUREZA_VEICULO', 'CLASSE_VEICULO', 'CLIENTE', 'CONFERENCIA'])
  })

  it('moto: a cilindrada é pergunta, porque muda a tarifa — é informação da passagem', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO' },
      contexto('FERRY_BOAT'),
    )
    expect(passos(roteiro)).toEqual([
      'CATEGORIA',
      'NATUREZA_VEICULO',
      'CLASSE_VEICULO',
      'CILINDRADA',
      'CLIENTE',
      'CONFERENCIA',
    ])
    expect(no(roteiro, 'CILINDRADA').classe).toBe('MOTO')
  })

  it('quadriciclo é motociclo e não pede cilindrada', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'QUADRICICLO' },
      contexto('FERRY_BOAT'),
    )
    expect(passos(roteiro)).not.toContain('CILINDRADA')
  })

  it('no navio a classe não se pergunta — e a moto derivada ainda pede a cilindrada', () => {
    const roteiro = roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO' }, contexto('NAVIO'))
    expect(passos(roteiro)).toEqual(['CATEGORIA', 'NATUREZA_VEICULO', 'CILINDRADA', 'CLIENTE', 'CONFERENCIA'])
    expect(classesOfertadas('AUTOMOTOR', 'NAVIO')).toEqual(['CARRO'])
  })

  it('máquina escolhida num navio não é resposta — o navio não a oferece', () => {
    expect(roteiroDaReserva({ categoria: 'VEICULO', naturezaVeiculo: 'MAQUINA' }, contexto('NAVIO')).atual?.passo).toBe(
      'NATUREZA_VEICULO',
    )
  })
})

describe('respondido, nó a nó', () => {
  it('as escolhas só contam se estavam entre as opções', () => {
    const r = roteiroDaReserva({ categoria: 'PASSAGEIRO', acomodacao: 'SUITE' }, contexto())
    expect(respondido(no(r, 'QUANTIDADE_PESSOAS'), { quantidadePessoas: 2 })).toBe(true)
    expect(respondido(no(r, 'QUANTIDADE_PESSOAS'), { quantidadePessoas: 0 })).toBe(false)
    expect(respondido(no(r, 'CATEGORIA'), { categoria: 'PASSAGEIRO' })).toBe(true)
  })

  it('cilindrada: um número positivo', () => {
    const noCilindrada = { passo: 'CILINDRADA', classe: 'MOTO' } as const
    expect(respondido(noCilindrada, { cilindrada: 160 })).toBe(true)
    expect(respondido(noCilindrada, { cilindrada: 0 })).toBe(false)
    expect(respondido(noCilindrada, {})).toBe(false)
  })

  it('cliente: o nome responde; o telefone é opcional', () => {
    const cliente = no(roteiroDaReserva({}, contexto()), 'CLIENTE')
    expect(respondido(cliente, { cliente: { nome: 'Maria' } })).toBe(true)
    expect(respondido(cliente, { cliente: CLIENTE })).toBe(true)
    expect(respondido(cliente, { cliente: { telefone: '91988887777' } })).toBe(false)
    expect(respondido(cliente, { cliente: { nome: '   ' } })).toBe(false)
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
    const roteiro = roteiroDaReserva({ categoria: 'PASSAGEIRO', acomodacao: 'REDE', cliente: CLIENTE }, contexto())
    expect(roteiro.atual?.passo).toBe('TIPO_TARIFARIO')
  })

  it('ao longo de um caminho, o total nunca diminui — o indicador cresce', () => {
    const caminho: RespostasDaReserva[] = [
      {},
      { categoria: 'PASSAGEIRO' },
      { categoria: 'PASSAGEIRO', acomodacao: 'REDE' },
      { categoria: 'PASSAGEIRO', acomodacao: 'REDE', tipo: 'GRATUIDADE' },
    ]
    expect(caminho.map((respostas) => roteiroDaReserva(respostas, contexto()).total)).toEqual([3, 4, 5, 6])
  })
})

describe('a resposta que ficou para trás não vaza', () => {
  /* No aplicativo, o ViewModel limpa a resposta ao trocar a escolha. Aqui a garantia mora na leitura. */

  it('rede → gratuidade, depois troca para suíte: o passo do subtipo some', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'PASSAGEIRO', acomodacao: 'SUITE', tipo: 'GRATUIDADE', gratuidade: 'IDOSO' },
      contexto(),
    )
    expect(passos(roteiro)).not.toContain('TIPO_GRATUIDADE')
    expect(passos(roteiro)).not.toContain('TIPO_TARIFARIO')
  })

  it('moto, depois troca para carro: o passo da cilindrada some', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO', cilindrada: 160 },
      contexto(),
    )
    expect(passos(roteiro)).not.toContain('CILINDRADA')
  })

  it('veículo escolhido, depois troca para passageiro: o ramo do veículo some', () => {
    const roteiro = roteiroDaReserva(
      { categoria: 'PASSAGEIRO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CARRO' },
      contexto(),
    )
    expect(passos(roteiro)).not.toContain('NATUREZA_VEICULO')
  })
})

describe('voltar apaga a resposta certa', () => {
  const TODOS_OS_NOS: RespostasDaReserva[] = [
    { categoria: 'PASSAGEIRO', acomodacao: 'REDE', tipo: 'GRATUIDADE', gratuidade: 'PCD', cliente: CLIENTE },
    { categoria: 'PASSAGEIRO', acomodacao: 'CAMAROTE', quantidadePessoas: 3, cliente: CLIENTE },
    { categoria: 'VEICULO', naturezaVeiculo: 'MOTOCICLO', classeVeiculo: 'MOTO', cilindrada: 160, cliente: CLIENTE },
  ]

  it('semResposta é o inverso exato de respondido, em todo nó de todo ramo', () => {
    for (const respostas of TODOS_OS_NOS) {
      const roteiro = roteiroDaReserva(respostas, contexto())
      expect(roteiro.prontoParaConferir).toBe(true)
      for (const n of roteiro.nos) {
        if (n.passo === 'CONFERENCIA') continue
        expect(respondido(n, respostas), `${chaveDoNo(n)} respondido`).toBe(true)
        expect(respondido(n, semResposta(n, respostas)), `${chaveDoNo(n)} apagado`).toBe(false)
      }
    }
  })

  it('a chave apagada é omitida, não posta em undefined', () => {
    expect('cliente' in semResposta({ passo: 'CLIENTE' }, REDE_COMPLETA)).toBe(false)
  })

  it('na conferência, voltar apaga o cliente — o nó anterior', () => {
    const depois = voltar(REDE_COMPLETA, contexto())
    expect('cliente' in depois).toBe(false)
    expect(roteiroDaReserva(depois, contexto()).atual?.passo).toBe('CLIENTE')
  })

  it('no meio do caminho, voltar apaga o nó antes do foco e o põe em foco', () => {
    const respostas: RespostasDaReserva = { categoria: 'PASSAGEIRO', acomodacao: 'SUITE' }
    const depois = voltar(respostas, contexto())
    expect(depois).toEqual({ categoria: 'PASSAGEIRO' })
    expect(roteiroDaReserva(depois, contexto()).atual?.passo).toBe('ACOMODACAO')
  })

  it('no primeiro passo não há para onde voltar', () => {
    expect(voltar({}, contexto())).toEqual({})
  })
})

/* naveg-front#65: o site não pergunta o tipo, e pergunta quantos viajam antes da acomodação, de 1 a 50. */
describe('o ramo de passageiro, pelo site', () => {
  const SITE: RespostasDaReserva = { canal: 'SITE', categoria: 'PASSAGEIRO' }

  it('quantos viajam, depois a acomodação — e nenhum tipo, em acomodação nenhuma', () => {
    /* A `categoria` que o site da #65 manda vale como "Passageiros" (naveg-front#66). */
    expect(passos(roteiroDaReserva(SITE, contexto()))).toEqual([
      'EMBARQUE',
      'QUANTIDADE_PESSOAS',
      'ACOMODACAO',
      'CLIENTE',
      'CONFERENCIA',
    ])
    for (const acomodacao of ['REDE', 'SUITE', 'CAMAROTE'] as const) {
      const roteiro = roteiroDaReserva({ ...SITE, quantidadePessoas: 2, acomodacao }, contexto())
      expect(passos(roteiro)).not.toContain('TIPO_TARIFARIO')
      expect(roteiro.atual?.passo).toBe('CLIENTE')
    }
  })

  it('de 1 a 50 pessoas, sem o teto da acomodação', () => {
    const quantidade = no(roteiroDaReserva(SITE, contexto()), 'QUANTIDADE_PESSOAS')
    expect(quantidade.opcoes[0]).toBe(1)
    expect(quantidade.opcoes.at(-1)).toBe(50)
    expect(roteiroDaReserva({ ...SITE, quantidadePessoas: 7, acomodacao: 'SUITE' }, contexto()).atual?.passo).toBe('CLIENTE')
    expect(roteiroDaReserva({ ...SITE, quantidadePessoas: 51 }, contexto()).atual?.passo).toBe('QUANTIDADE_PESSOAS')
  })

  it('o tipo que sobrou nas respostas não abre passo nenhum', () => {
    const roteiro = roteiroDaReserva({ ...SITE, quantidadePessoas: 1, acomodacao: 'REDE', tipo: 'GRATUIDADE' }, contexto())
    expect(passos(roteiro)).not.toContain('TIPO_GRATUIDADE')
  })

  it('voltar não apaga o canal: ele não é um passo', () => {
    const respostas: RespostasDaReserva = { ...SITE, quantidadePessoas: 2 }
    expect(voltar(respostas, contexto())).toEqual(SITE)
    expect(voltar(SITE, contexto())).toEqual({ canal: 'SITE' })
  })
})

/* naveg-front#66: no site, o que vai embarcar vem antes do dia, e não depende do casco. */
describe('o que vai embarcar, pelo site', () => {
  const SITE: RespostasDaReserva = { canal: 'SITE' }

  it('começa pelo que vai embarcar: veículo, passageiros e veículo, passageiros', () => {
    const roteiro = roteiroDaReserva(SITE, contexto())
    expect(passos(roteiro)).toEqual(['EMBARQUE', 'CLIENTE', 'CONFERENCIA'])
    expect(no(roteiro, 'EMBARQUE').opcoes).toEqual(['VEICULO', 'PASSAGEIROS_E_VEICULO', 'PASSAGEIROS'])
  })

  it('o veículo: leve ou pesado, e depois só as classes daquele porte', () => {
    const veiculo = { ...SITE, embarque: 'VEICULO' as const }
    expect(passos(roteiroDaReserva(veiculo, contexto()))).toEqual(['EMBARQUE', 'PORTE_DO_VEICULO', 'CLIENTE', 'CONFERENCIA'])
    const pesado = roteiroDaReserva({ ...veiculo, porteVeiculo: 'PESADO' }, contexto())
    expect(no(pesado, 'CLASSE_VEICULO').opcoes).toContain('CAMINHAO')
    expect(no(pesado, 'CLASSE_VEICULO').opcoes).not.toContain('CARRO')
    expect(pesado.atual?.passo).toBe('CLASSE_VEICULO')
    /* O carro que sobrou de "leve" não responde "Qual?" no pesado. */
    expect(roteiroDaReserva({ ...veiculo, porteVeiculo: 'PESADO', classeVeiculo: 'CARRO' }, contexto()).atual?.passo).toBe(
      'CLASSE_VEICULO',
    )
  })

  it('a moto pede a cilindrada; passageiros e veículo pedem também quantos e onde, depois do veículo', () => {
    const moto = { ...SITE, embarque: 'VEICULO' as const, porteVeiculo: 'LEVE' as const, classeVeiculo: 'MOTO' as const }
    expect(roteiroDaReserva(moto, contexto()).atual?.passo).toBe('CILINDRADA')
    const juntos = { ...SITE, embarque: 'PASSAGEIROS_E_VEICULO' as const, porteVeiculo: 'PESADO' as const, classeVeiculo: 'CAMINHAO' as const }
    expect(passos(roteiroDaReserva(juntos, contexto()))).toEqual([
      'EMBARQUE',
      'PORTE_DO_VEICULO',
      'CLASSE_VEICULO',
      'QUANTIDADE_PESSOAS',
      'ACOMODACAO',
      'CLIENTE',
      'CONFERENCIA',
    ])
  })

  it('o embarque fica respondido quando todas as perguntas dele estão', () => {
    expect(embarqueRespondido({ ...SITE, embarque: 'VEICULO', porteVeiculo: 'LEVE' })).toBe(false)
    expect(embarqueRespondido({ ...SITE, embarque: 'VEICULO', porteVeiculo: 'LEVE', classeVeiculo: 'CARRO' })).toBe(true)
    expect(embarqueRespondido({ ...SITE, embarque: 'PASSAGEIROS', quantidadePessoas: 3, acomodacao: 'REDE' })).toBe(true)
  })

  it('a embarcação leva o que vai embarcar: passageiros em toda; o caminhão, não na lancha nem no navio', () => {
    const caminhao: RespostasDaReserva = { ...SITE, embarque: 'VEICULO', porteVeiculo: 'PESADO', classeVeiculo: 'CAMINHAO' }
    expect(embarcacaoLeva(caminhao, 'FERRY_BOAT')).toBe(true)
    expect(embarcacaoLeva(caminhao, 'NAVIO')).toBe(false)
    expect(embarcacaoLeva(caminhao, 'LANCHA')).toBe(false)
    const carro: RespostasDaReserva = { ...caminhao, porteVeiculo: 'LEVE', classeVeiculo: 'CARRO' }
    expect(embarcacaoLeva(carro, 'NAVIO')).toBe(true)
    expect(embarcacaoLeva({ ...SITE, embarque: 'PASSAGEIROS' }, 'LANCHA')).toBe(true)
  })

  it('voltar do "Qual?" apaga o porte; voltar do porte apaga o embarque — e o porte não volta pela classe', () => {
    const qual: RespostasDaReserva = { ...SITE, embarque: 'VEICULO', porteVeiculo: 'LEVE' }
    expect(voltar(qual, contexto())).toEqual({ ...SITE, embarque: 'VEICULO' })
    expect(voltar({ ...SITE, embarque: 'VEICULO' }, contexto())).toEqual(SITE)
    expect(semResposta({ passo: 'PORTE_DO_VEICULO', opcoes: [] }, { ...qual, classeVeiculo: 'CARRO' })).toEqual({
      ...SITE,
      embarque: 'VEICULO',
    })
  })

  it('a página da #65, que manda a categoria e a classe, continua fechando o roteiro', () => {
    const antigo: RespostasDaReserva = { ...SITE, categoria: 'VEICULO', naturezaVeiculo: 'AUTOMOTOR', classeVeiculo: 'CAMINHAO', cliente: CLIENTE }
    expect(roteiroDaReserva(antigo, contexto()).atual?.passo).toBe('CONFERENCIA')
  })
})
