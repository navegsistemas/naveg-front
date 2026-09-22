/**
 * **O passo em foco, desenhado** — um nó do roteiro vira o componente que o responde.
 *
 * As opções vêm de `no.opcoes`, sempre: este arquivo não conhece nenhuma regra de quais acomodações admitem
 * meia ou quais cascos levam veículo. Ele só sabe **escrever a resposta no campo certo** — o inverso do
 * `respondido` do domínio —, e os cenários do totem conferem que cada escrita faz o nó ficar respondido.
 */
import {
  Acomodacao,
  CategoriaPassagem,
  ClasseVeiculo,
  NaturezaVeiculo,
  TipoGratuidade,
  TipoPassagem,
  casoImpossivel,
  type NoDoRoteiro,
  type RespostasDaReserva,
} from '@naveg/domain'

import { EscolhaEmCartoes } from './EscolhaEmCartoes.js'
import { CampoDeCilindrada, FormularioDoCliente } from './Formularios.js'

export interface PropsDoPasso {
  /** Qualquer nó, menos a conferência — ela tem componente próprio. */
  readonly no: Exclude<NoDoRoteiro, { passo: 'CONFERENCIA' }>
  readonly respostas: RespostasDaReserva
  readonly aoResponder: (respostas: RespostasDaReserva) => void
}

function pessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

export function PassoDaReserva({ no, respostas, aoResponder }: PropsDoPasso) {
  const com = (parcial: RespostasDaReserva) => aoResponder({ ...respostas, ...parcial })

  switch (no.passo) {
    case 'CATEGORIA':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: CategoriaPassagem.rotulo(valor) }))}
          escolhida={respostas.categoria}
          aoEscolher={(categoria) => com({ categoria })}
        />
      )
    case 'ACOMODACAO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({
            valor,
            rotulo: Acomodacao.rotulo(valor),
            descricao: Acomodacao.ocupacaoMaxima(valor) === 1 ? 'Uma pessoa' : `Até ${Acomodacao.ocupacaoMaxima(valor)} pessoas`,
          }))}
          escolhida={respostas.acomodacao}
          aoEscolher={(acomodacao) => com({ acomodacao })}
        />
      )
    case 'TIPO_TARIFARIO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: TipoPassagem.rotulo(valor) }))}
          escolhida={respostas.tipo}
          aoEscolher={(tipo) => com({ tipo })}
        />
      )
    case 'TIPO_GRATUIDADE':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: TipoGratuidade.rotulo(valor) }))}
          escolhida={respostas.gratuidade}
          aoEscolher={(gratuidade) => com({ gratuidade })}
        />
      )
    case 'QUANTIDADE_PESSOAS':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: pessoas(valor) }))}
          escolhida={respostas.quantidadePessoas}
          aoEscolher={(quantidadePessoas) => com({ quantidadePessoas })}
        />
      )
    case 'NATUREZA_VEICULO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: NaturezaVeiculo.rotulo(valor) }))}
          escolhida={respostas.naturezaVeiculo}
          aoEscolher={(naturezaVeiculo) => com({ naturezaVeiculo })}
        />
      )
    case 'CLASSE_VEICULO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: ClasseVeiculo.rotulo(valor) }))}
          escolhida={respostas.classeVeiculo}
          aoEscolher={(classeVeiculo) => com({ classeVeiculo })}
        />
      )
    case 'CILINDRADA':
      return <CampoDeCilindrada inicial={respostas.cilindrada} aoConfirmar={(cilindrada) => com({ cilindrada })} />
    case 'CLIENTE':
      return <FormularioDoCliente inicial={respostas.cliente} aoConfirmar={(cliente) => com({ cliente })} />
    default:
      return casoImpossivel(no, 'PassoDaReserva')
  }
}
