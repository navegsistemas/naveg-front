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
  FaixaPeso,
  NaturezaVeiculo,
  OQueEmbarca,
  PorteDoVeiculo,
  TipoGratuidade,
  TipoPassagem,
  casoImpossivel,
  embarqueEmVigor,
  encomendaPeloSite,
  porteEmVigor,
  type NoDoRoteiro,
  type RespostasDaReserva,
} from '@navegsistemas/domain'
import type { ReactNode } from 'react'

import { EscolhaEmCartoes } from './EscolhaEmCartoes.js'
import { CampoDeCilindrada, FormularioDoCliente, FormularioDoTipoDoVolume } from './Formularios.js'
import { QuantidadeDePessoas, VOLUMES } from './QuantidadeDePessoas.js'

/** As respostas sem estas chaves — omitidas, e não `undefined`, como no domínio. */
function semChaves(respostas: RespostasDaReserva, ...chaves: (keyof RespostasDaReserva)[]): RespostasDaReserva {
  const copia: { -readonly [Chave in keyof RespostasDaReserva]: RespostasDaReserva[Chave] } = { ...respostas }
  for (const chave of chaves) delete copia[chave]
  return copia
}

export interface PropsDoPasso {
  /** Qualquer nó, menos a conferência — ela tem componente próprio. */
  readonly no: Exclude<NoDoRoteiro, { passo: 'CONFERENCIA' }>
  readonly respostas: RespostasDaReserva
  readonly aoResponder: (respostas: RespostasDaReserva) => void
  /** No passo de quem reserva, a linha antes do "Continuar" (2.3, C). Quem decide se ela aparece é a tela. */
  readonly avisoDoCliente?: ReactNode
}

export function PassoDaReserva({ no, respostas, aoResponder, avisoDoCliente }: PropsDoPasso) {
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
    case 'EMBARQUE':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: OQueEmbarca.rotulo(valor) }))}
          escolhida={embarqueEmVigor(respostas)}
          aoEscolher={(embarque) => com({ embarque })}
        />
      )
    case 'PORTE_DO_VEICULO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({
            valor,
            rotulo: PorteDoVeiculo.rotulo(valor),
            descricao: PorteDoVeiculo.exemplos(valor),
          }))}
          escolhida={porteEmVigor(respostas)}
          aoEscolher={(porteVeiculo) => com({ porteVeiculo })}
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
        <QuantidadeDePessoas
          opcoes={no.opcoes}
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
      return (
        <FormularioDoCliente
          inicial={respostas.cliente}
          telefoneObrigatorio={no.telefoneObrigatorio === true}
          {...(encomendaPeloSite(respostas) ? { erroDoNome: 'Informe o nome de quem manda.' } : {})}
          /* O celular obrigatório é o do site, e lá ele é o do WhatsApp (2.3, B); o quiosque segue com "com DDD". */
          {...(no.telefoneObrigatorio === true ? { rotuloDoTelefone: 'Celular com WhatsApp' } : {})}
          {...(avisoDoCliente !== undefined ? { aviso: avisoDoCliente } : {})}
          aoConfirmar={(cliente) => com({ cliente })}
        />
      )
    case 'TIPO_VOLUME':
      return (
        <FormularioDoTipoDoVolume
          tipos={no.opcoes}
          inicial={{
            ...(respostas.tipoVolume !== undefined ? { tipoVolume: respostas.tipoVolume } : {}),
            ...(respostas.complemento !== undefined ? { complemento: respostas.complemento } : {}),
          }}
          aoConfirmar={({ tipoVolume, complemento }) =>
            aoResponder({ ...semChaves(respostas, 'complemento'), tipoVolume, ...(complemento !== undefined ? { complemento } : {}) })
          }
        />
      )
    case 'QUANTIDADE_VOLUMES':
      return (
        <QuantidadeDePessoas
          opcoes={no.opcoes}
          unidade={VOLUMES}
          escolhida={respostas.quantidadeVolumes}
          aoEscolher={(quantidadeVolumes) => com({ quantidadeVolumes })}
        />
      )
    case 'FAIXA_PESO':
      return (
        <EscolhaEmCartoes
          opcoes={no.opcoes.map((valor) => ({ valor, rotulo: FaixaPeso.rotulo(valor) }))}
          escolhida={respostas.faixaPeso}
          aoEscolher={(faixaPeso) => com({ faixaPeso })}
        />
      )
    case 'DESTINATARIO':
      /* Opcional (PO, 2026-10-15): informar é preencher os dois campos; "Pular" também responde. */
      return (
        <>
          <FormularioDoCliente
            inicial={respostas.destinatario}
            telefoneObrigatorio
            erroDoNome="Informe o nome de quem recebe."
            aoConfirmar={(destinatario) => aoResponder({ ...semChaves(respostas, 'semDestinatario'), destinatario })}
          />
          <button
            type="button"
            className="acao acao--secundaria"
            onClick={() => aoResponder({ ...semChaves(respostas, 'destinatario'), semDestinatario: true })}
          >
            Pular: combino com o atendimento
          </button>
        </>
      )
    default:
      return casoImpossivel(no, 'PassoDaReserva')
  }
}
