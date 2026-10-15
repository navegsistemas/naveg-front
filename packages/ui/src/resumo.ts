/**
 * **O resumo da reserva, em linhas** — o que a conferência mostra e a conclusão repete.
 *
 * É apresentação pura: pega a reserva que o domínio montou e a travessia que o catálogo ofereceu, e escreve com
 * os rótulos que os dois já têm. Não decide nada — se uma linha faltar, é porque a reserva não tem o dado.
 */
import {
  Acomodacao,
  CategoriaPassagem,
  ClasseVeiculo,
  formatarWhatsapp,
  TipoGratuidade,
  TipoPassagem,
  casoImpossivel,
  oQueVai,
  type Reserva,
  type ReservaDeEncomenda,
  type ReservaDePassageiro,
  type ReservaDeVeiculo,
  type TravessiaOfertada,
} from '@navegsistemas/domain'

export interface LinhaDoResumo {
  readonly rotulo: string
  readonly valor: string
}

function pessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

function aPassagem(reserva: ReservaDePassageiro | ReservaDeVeiculo): string {
  switch (reserva.categoria) {
    case 'PASSAGEIRO': {
      /* Pelo site, o tipo não é perguntado: inteira, meia e gratuidade são do atendimento (naveg-front#65). */
      const acomodacao = Acomodacao.rotulo(reserva.acomodacao)
      const quantas = pessoas(reserva.quantidadePessoas)
      if (reserva.tipo === undefined) return [acomodacao, quantas, 'inteira, meia ou gratuidade no atendimento'].join(' · ')
      const tipo =
        reserva.gratuidade === undefined
          ? TipoPassagem.rotulo(reserva.tipo)
          : `${TipoPassagem.rotulo(reserva.tipo)} (${TipoGratuidade.rotulo(reserva.gratuidade)})`
      return [acomodacao, tipo, quantas].join(' · ')
    }
    case 'VEICULO':
      return [
        `${CategoriaPassagem.rotulo(reserva.categoria)}: ${ClasseVeiculo.rotulo(reserva.classe)}`,
        ...(reserva.cilindrada === undefined ? [] : [`${reserva.cilindrada} cc`]),
      ].join(' · ')
    default:
      return casoImpossivel(reserva, 'aPassagem')
  }
}

/**
 * A travessia, a saída, o cais do dia e, quando a data foi alterada, o aviso (UI 2.2, decisões A e B). A cidade é a da
 * rota; o cais é o do dia, já com a alteração.
 */
function aSaida(travessia: TravessiaOfertada): LinhaDoResumo[] {
  const { rotulos } = travessia
  return [
    { rotulo: 'Travessia', valor: `${rotulos.origem} → ${rotulos.destino}` },
    { rotulo: 'Saída', valor: rotulos.partida },
    { rotulo: 'Embarque', valor: rotulos.embarque },
    { rotulo: 'Desembarque', valor: rotulos.desembarque },
    ...(rotulos.alteracao === null ? [] : [{ rotulo: 'Atenção', valor: rotulos.alteracao }]),
  ]
}

function telefoneOuNao(telefone: string | undefined): string {
  return telefone === undefined ? 'Não informado' : formatarWhatsapp(telefone)
}

/** O resumo da encomenda: o que vai, quem manda, quem retira, e até quando entregar. */
export function resumoDaEncomenda(reserva: ReservaDeEncomenda, travessia: TravessiaOfertada): readonly LinhaDoResumo[] {
  const { destinatario } = reserva
  return [
    ...aSaida(travessia),
    { rotulo: 'Embarcação', valor: travessia.rotulos.embarcacao },
    { rotulo: 'Encomenda', valor: oQueVai(reserva) },
    { rotulo: 'Quem manda', valor: reserva.cliente.nome },
    { rotulo: 'Celular de quem manda', valor: telefoneOuNao(reserva.cliente.telefone) },
    {
      rotulo: 'Quem retira',
      valor:
        reserva.retirada === 'REMETENTE' || destinatario === undefined
          ? 'Quem manda'
          : `${destinatario.nome}, ${formatarWhatsapp(destinatario.telefone)}`,
    },
    { rotulo: 'Entregar no porto', valor: `antes da saída — ${travessia.rotulos.partida}` },
  ]
}

export function resumoDaReserva(reserva: Reserva, travessia: TravessiaOfertada): readonly LinhaDoResumo[] {
  if (reserva.categoria === 'ENCOMENDA') return resumoDaEncomenda(reserva, travessia)
  return [
    ...aSaida(travessia),
    { rotulo: 'Embarcação', valor: travessia.rotulos.embarcacao },
    { rotulo: 'Passagem', valor: aPassagem(reserva) },
    { rotulo: 'Em nome de', valor: reserva.cliente.nome },
    {
      rotulo: 'Telefone',
      valor: telefoneOuNao(reserva.cliente.telefone),
    },
    { rotulo: 'Vale até', valor: `a saída — ${travessia.rotulos.partida}` },
  ]
}
