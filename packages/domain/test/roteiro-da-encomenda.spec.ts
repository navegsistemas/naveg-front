/**
 * **O roteiro da encomenda — a sequência nos dois caminhos de retirada.**
 *
 * Como os do roteiro da passagem, estes cenários verificam **a sequência**: quais perguntas, em que ordem, o
 * indicador que cresce e nunca encurta, o celular que fica obrigatório quando quem manda retira, e voltar.
 */
import { describe, expect, it } from 'vitest'

import {
  respondidoNaEncomenda,
  roteiroDaEncomenda,
  voltarNaEncomenda,
  type NoDaEncomenda,
  type RespostasDaEncomenda,
  type RoteiroDaEncomenda,
} from '../src/encomenda/roteiro-da-encomenda.js'
import { CLIENTE, ENCOMENDA_DO_PROPRIO, ENCOMENDA_PARA_OUTRA } from './exemplos.js'

function passos(roteiro: RoteiroDaEncomenda): string[] {
  return roteiro.nos.map((no) => no.passo)
}

function noDe(roteiro: RoteiroDaEncomenda, passo: NoDaEncomenda['passo']): NoDaEncomenda {
  const achado = roteiro.nos.find((no) => no.passo === passo)
  if (achado === undefined) throw new Error(`o roteiro não tem o passo ${passo}`)
  return achado
}

const ATE_A_RETIRADA: RespostasDaEncomenda = { tipoVolume: 'CAIXA', quantidadeVolumes: 3, faixaPeso: 'DE_5_A_20' }

describe('o começo', () => {
  it('sem resposta nenhuma, são cinco passos, e o foco é o volume', () => {
    const roteiro = roteiroDaEncomenda({})
    expect(passos(roteiro)).toEqual(['VOLUMES', 'PESO', 'RETIRADA', 'REMETENTE', 'CONFERENCIA'])
    expect(roteiro.atual?.passo).toBe('VOLUMES')
    expect(roteiro.posicaoAtual).toBe(1)
    expect(roteiro.prontoParaConferir).toBe(false)
  })

  it('as opções vêm no nó: os cinco tipos, até 20 volumes, as quatro faixas e as duas retiradas', () => {
    const roteiro = roteiroDaEncomenda({})
    expect(noDe(roteiro, 'VOLUMES')).toEqual({
      passo: 'VOLUMES',
      tipos: ['CAIXA', 'SACO_FARDO', 'ELETRODOMESTICO', 'MOVEL', 'OUTRO'],
      maximo: 20,
    })
    expect(noDe(roteiro, 'PESO')).toEqual({ passo: 'PESO', opcoes: ['ATE_5', 'DE_5_A_20', 'DE_20_A_50', 'ACIMA_DE_50'] })
    expect(noDe(roteiro, 'RETIRADA')).toEqual({ passo: 'RETIRADA', opcoes: ['REMETENTE', 'OUTRA_PESSOA'] })
  })

  it('nenhum caminho pede documento nem valor declarado', () => {
    for (const respostas of [ENCOMENDA_PARA_OUTRA, ENCOMENDA_DO_PROPRIO]) {
      const todos = passos(roteiroDaEncomenda(respostas))
      for (const proibido of ['DOCUMENTO', 'VALOR_DECLARADO', 'PAGAMENTO']) expect(todos).not.toContain(proibido)
    }
  })
})

describe('o volume', () => {
  it('o tipo sozinho não responde: falta a quantidade', () => {
    expect(roteiroDaEncomenda({ tipoVolume: 'CAIXA' }).atual?.passo).toBe('VOLUMES')
  })

  it('quantidade fora de 1 a 20, ou quebrada, não responde', () => {
    for (const quantidadeVolumes of [0, 21, 2.5, -1]) {
      expect(roteiroDaEncomenda({ tipoVolume: 'CAIXA', quantidadeVolumes }).atual?.passo, String(quantidadeVolumes)).toBe('VOLUMES')
    }
  })

  it('o complemento é opcional: tipo e quantidade bastam para seguir ao peso', () => {
    const roteiro = roteiroDaEncomenda({ tipoVolume: 'MOVEL', quantidadeVolumes: 1 })
    expect(roteiro.atual?.passo).toBe('PESO')
    expect(roteiro.posicaoAtual).toBe(2)
  })
})

describe('quem retira', () => {
  it('"Outra pessoa" acrescenta o destinatário — e o indicador cresce de 5 para 6', () => {
    const antes = roteiroDaEncomenda(ATE_A_RETIRADA)
    expect(antes.atual?.passo).toBe('RETIRADA')
    expect(antes.total).toBe(5)

    const depois = roteiroDaEncomenda({ ...ATE_A_RETIRADA, retirada: 'OUTRA_PESSOA' })
    expect(passos(depois)).toEqual(['VOLUMES', 'PESO', 'RETIRADA', 'DESTINATARIO', 'REMETENTE', 'CONFERENCIA'])
    expect(depois.atual?.passo).toBe('DESTINATARIO')
    expect(depois.total).toBe(6)
  })

  it('"Eu mesmo" vai direto a quem manda, com o celular obrigatório', () => {
    const roteiro = roteiroDaEncomenda({ ...ATE_A_RETIRADA, retirada: 'REMETENTE' })
    expect(passos(roteiro)).toEqual(['VOLUMES', 'PESO', 'RETIRADA', 'REMETENTE', 'CONFERENCIA'])
    expect(roteiro.atual).toEqual({ passo: 'REMETENTE', telefoneObrigatorio: true })
  })

  it('com outra pessoa retirando, o celular de quem manda é opcional', () => {
    const roteiro = roteiroDaEncomenda({ ...ENCOMENDA_PARA_OUTRA, cliente: { nome: 'Maria Souza' } })
    expect(noDe(roteiro, 'REMETENTE')).toEqual({ passo: 'REMETENTE', telefoneObrigatorio: false })
    expect(roteiro.prontoParaConferir).toBe(true)
  })

  it('quem manda e retira, sem celular, não chega à conferência', () => {
    const roteiro = roteiroDaEncomenda({ ...ENCOMENDA_DO_PROPRIO, cliente: { nome: 'Carlos Melo' } })
    expect(roteiro.atual?.passo).toBe('REMETENTE')
    expect(roteiro.prontoParaConferir).toBe(false)
  })

  it('o destinatário pede nome e celular, os dois', () => {
    const base = { ...ATE_A_RETIRADA, retirada: 'OUTRA_PESSOA' as const }
    const no = noDe(roteiroDaEncomenda(base), 'DESTINATARIO')
    expect(respondidoNaEncomenda(no, { ...base, destinatario: { nome: 'João Lima' } })).toBe(false)
    expect(respondidoNaEncomenda(no, { ...base, destinatario: { telefone: '(96) 98888-7777' } })).toBe(false)
    expect(respondidoNaEncomenda(no, { ...base, destinatario: { nome: 'João Lima', telefone: '(96) 98888-7777' } })).toBe(true)
  })

  it('trocar "Outra pessoa" por "Eu mesmo" tira o destinatário do caminho, ainda que preenchido', () => {
    const roteiro = roteiroDaEncomenda({ ...ENCOMENDA_PARA_OUTRA, retirada: 'REMETENTE', cliente: CLIENTE })
    expect(passos(roteiro)).not.toContain('DESTINATARIO')
    expect(roteiro.prontoParaConferir).toBe(true)
  })
})

describe('os caminhos completos', () => {
  it('para outra pessoa: seis passos, em foco a conferência', () => {
    const roteiro = roteiroDaEncomenda(ENCOMENDA_PARA_OUTRA)
    expect(roteiro.atual?.passo).toBe('CONFERENCIA')
    expect(roteiro.posicaoAtual).toBe(6)
    expect(roteiro.total).toBe(6)
    expect(roteiro.prontoParaConferir).toBe(true)
  })

  it('do próprio remetente: cinco passos', () => {
    const roteiro = roteiroDaEncomenda(ENCOMENDA_DO_PROPRIO)
    expect(roteiro.atual?.passo).toBe('CONFERENCIA')
    expect(roteiro.total).toBe(5)
  })
})

describe('voltar', () => {
  it('da conferência, apaga quem manda', () => {
    const voltou = voltarNaEncomenda(ENCOMENDA_PARA_OUTRA)
    expect(voltou.cliente).toBeUndefined()
    expect(voltou.destinatario).toEqual(ENCOMENDA_PARA_OUTRA.destinatario)
    expect(roteiroDaEncomenda(voltou).atual?.passo).toBe('REMETENTE')
  })

  it('do peso, apaga o volume inteiro — tipo, quantidade e complemento', () => {
    const voltou = voltarNaEncomenda({ tipoVolume: 'OUTRO', quantidadeVolumes: 2, complemento: 'rede de pesca' })
    expect(voltou).toEqual({})
  })

  it('no primeiro passo, nada muda', () => {
    const respostas = { tipoVolume: 'CAIXA' as const }
    expect(voltarNaEncomenda(respostas)).toBe(respostas)
  })

  it('voltar até o começo, de qualquer caminho, esvazia as respostas uma a uma', () => {
    for (const inicio of [ENCOMENDA_PARA_OUTRA, ENCOMENDA_DO_PROPRIO]) {
      let respostas: RespostasDaEncomenda = inicio
      for (let i = 0; i < 10; i += 1) respostas = voltarNaEncomenda(respostas)
      expect(respostas).toEqual({})
    }
  })
})
