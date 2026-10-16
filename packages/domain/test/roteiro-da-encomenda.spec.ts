/**
 * **O roteiro da encomenda — a sequência, com e sem quem retira.**
 *
 * Como os do roteiro da passagem, estes cenários verificam **a sequência**: quais perguntas, em que ordem, o celular
 * que fica obrigatório, o destinatário que só aparece quando outra pessoa retira, e voltar.
 *
 * Desde a 2.7 (naveg-front#58), "Quem retira no destino?" não é pergunta: a retirada é derivada do destinatário
 * informado, e uma retirada explícita — a da página de antes — ainda vale.
 */
import { describe, expect, it } from 'vitest'

import {
  respondidoNaEncomenda,
  retiradaEmVigor,
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

const ATE_O_PESO: RespostasDaEncomenda = { tipoVolume: 'CAIXA', quantidadeVolumes: 3, faixaPeso: 'DE_5_A_20' }
const JOAO = { nome: 'João Lima', telefone: '(96) 98888-7777' }

describe('o começo', () => {
  it('sem resposta nenhuma, são quatro passos — sem "Quem retira?" —, e o foco é o volume', () => {
    const roteiro = roteiroDaEncomenda({})
    expect(passos(roteiro)).toEqual(['VOLUMES', 'PESO', 'REMETENTE', 'CONFERENCIA'])
    expect(roteiro.atual?.passo).toBe('VOLUMES')
    expect(roteiro.posicaoAtual).toBe(1)
    expect(roteiro.prontoParaConferir).toBe(false)
  })

  it('as opções vêm no nó: os cinco tipos, até 20 volumes e as quatro faixas', () => {
    const roteiro = roteiroDaEncomenda({})
    expect(noDe(roteiro, 'VOLUMES')).toEqual({
      passo: 'VOLUMES',
      tipos: ['CAIXA', 'SACO_FARDO', 'ELETRODOMESTICO', 'MOVEL', 'OUTRO'],
      maximo: 20,
    })
    expect(noDe(roteiro, 'PESO')).toEqual({ passo: 'PESO', opcoes: ['ATE_5', 'DE_5_A_20', 'DE_20_A_50', 'ACIMA_DE_50'] })
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

describe('quem retira, derivado', () => {
  it('sem destinatário, a retirada fica ausente — o atendimento combina —, e o celular de quem manda é obrigatório', () => {
    expect(retiradaEmVigor(ATE_O_PESO)).toBeUndefined()
    const roteiro = roteiroDaEncomenda({ ...ATE_O_PESO, cliente: { nome: 'Maria Souza' } })
    expect(roteiro.atual).toEqual({ passo: 'REMETENTE', telefoneObrigatorio: true })
    expect(roteiroDaEncomenda({ ...ATE_O_PESO, cliente: CLIENTE }).prontoParaConferir).toBe(true)
  })

  it('com o destinatário informado, é "outra pessoa", e ele entra no caminho depois de quem manda', () => {
    const respostas = { ...ATE_O_PESO, cliente: CLIENTE, destinatario: JOAO }
    expect(retiradaEmVigor(respostas)).toBe('OUTRA_PESSOA')
    expect(passos(roteiroDaEncomenda(respostas))).toEqual(['VOLUMES', 'PESO', 'REMETENTE', 'DESTINATARIO', 'CONFERENCIA'])
    expect(roteiroDaEncomenda(respostas).prontoParaConferir).toBe(true)
  })

  it('o destinatário pela metade não é destinatário', () => {
    expect(retiradaEmVigor({ ...ATE_O_PESO, destinatario: { nome: 'João Lima' } })).toBeUndefined()
  })

  it('a retirada explícita da página de antes ainda vale: "eu mesmo" e "outra pessoa"', () => {
    expect(roteiroDaEncomenda(ENCOMENDA_DO_PROPRIO).prontoParaConferir).toBe(true)
    expect(roteiroDaEncomenda(ENCOMENDA_PARA_OUTRA).prontoParaConferir).toBe(true)
    /* Com "outra pessoa", o celular de quem manda é opcional, como o KMP confere. */
    const semCelular = roteiroDaEncomenda({ ...ENCOMENDA_PARA_OUTRA, cliente: { nome: 'Maria Souza' } })
    expect(noDe(semCelular, 'REMETENTE')).toEqual({ passo: 'REMETENTE', telefoneObrigatorio: false })
    expect(semCelular.prontoParaConferir).toBe(true)
  })

  it('"outra pessoa" explícita pede o destinatário, com nome e celular', () => {
    const base = { ...ATE_O_PESO, retirada: 'OUTRA_PESSOA' as const, cliente: CLIENTE }
    expect(roteiroDaEncomenda(base).atual?.passo).toBe('DESTINATARIO')
    const no = noDe(roteiroDaEncomenda(base), 'DESTINATARIO')
    expect(respondidoNaEncomenda(no, { ...base, destinatario: { nome: 'João Lima' } })).toBe(false)
    expect(respondidoNaEncomenda(no, { ...base, destinatario: JOAO })).toBe(true)
  })

  it('"eu mesmo" explícito tira o destinatário do caminho, ainda que preenchido', () => {
    const roteiro = roteiroDaEncomenda({ ...ENCOMENDA_PARA_OUTRA, retirada: 'REMETENTE', cliente: CLIENTE })
    expect(passos(roteiro)).not.toContain('DESTINATARIO')
    expect(roteiro.prontoParaConferir).toBe(true)
  })
})

describe('voltar', () => {
  it('da conferência com destinatário, apaga o destinatário — e a retirada que vinha com ele', () => {
    const voltou = voltarNaEncomenda(ENCOMENDA_PARA_OUTRA)
    expect(voltou.destinatario).toBeUndefined()
    expect(voltou.retirada).toBeUndefined()
    expect(voltou.cliente).toEqual(ENCOMENDA_PARA_OUTRA.cliente)
  })

  it('do peso, apaga o volume inteiro — tipo, quantidade e complemento', () => {
    const voltou = voltarNaEncomenda({ tipoVolume: 'OUTRO', quantidadeVolumes: 2, complemento: 'rede de pesca' })
    expect(voltou).toEqual({})
  })

  it('no primeiro passo, nada muda', () => {
    const respostas = { tipoVolume: 'CAIXA' as const }
    expect(voltarNaEncomenda(respostas)).toBe(respostas)
  })

  it('voltar até o começo, de qualquer caminho, esvazia as respostas', () => {
    for (const inicio of [{ ...ATE_O_PESO, cliente: CLIENTE, destinatario: JOAO }, ATE_O_PESO]) {
      let respostas: RespostasDaEncomenda = inicio
      for (let i = 0; i < 10; i += 1) respostas = voltarNaEncomenda(respostas)
      expect(respostas).toEqual({})
    }
  })
})
