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
      const tipo =
        reserva.gratuidade === undefined
          ? TipoPassagem.rotulo(reserva.tipo)
          : `${TipoPassagem.rotulo(reserva.tipo)} (${TipoGratuidade.rotulo(reserva.gratuidade)})`
      return [Acomodacao.rotulo(reserva.acomodacao), tipo, pessoas(reserva.quantidadePessoas)].join(' · ')
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

function telefoneOuNao(telefone: string | undefined): string {
  return telefone === undefined ? 'Não informado' : formatarWhatsapp(telefone)
}

/** O resumo da encomenda: o que vai, quem manda, quem retira, e até quando entregar. */
export function resumoDaEncomenda(reserva: ReservaDeEncomenda, travessia: TravessiaOfertada): readonly LinhaDoResumo[] {
  const { destinatario } = reserva
  return [
    { rotulo: 'Travessia', valor: `${travessia.rotulos.origem} → ${travessia.rotulos.destino}` },
    { rotulo: 'Saída', valor: travessia.rotulos.partida },
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
    { rotulo: 'Travessia', valor: `${travessia.rotulos.origem} → ${travessia.rotulos.destino}` },
    { rotulo: 'Saída', valor: travessia.rotulos.partida },
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
