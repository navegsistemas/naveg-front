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
  type Reserva,
  type TravessiaOfertada,
} from '@naveg/domain'

export interface LinhaDoResumo {
  readonly rotulo: string
  readonly valor: string
}

function pessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

function aPassagem(reserva: Reserva): string {
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

export function resumoDaReserva(reserva: Reserva, travessia: TravessiaOfertada): readonly LinhaDoResumo[] {
  return [
    { rotulo: 'Travessia', valor: `${travessia.rotulos.origem} → ${travessia.rotulos.destino}` },
    { rotulo: 'Saída', valor: travessia.rotulos.partida },
    { rotulo: 'Embarcação', valor: travessia.rotulos.embarcacao },
    { rotulo: 'Passagem', valor: aPassagem(reserva) },
    { rotulo: 'Em nome de', valor: reserva.cliente.nome },
    {
      rotulo: 'Telefone',
      valor: reserva.cliente.telefone === undefined ? 'Não informado' : formatarWhatsapp(reserva.cliente.telefone),
    },
    { rotulo: 'Vale até', valor: `a saída — ${travessia.rotulos.partida}` },
  ]
}
