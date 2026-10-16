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
  classeDoEmbarque,
  embarqueEmVigor,
  embarqueRespondido,
  FaixaPeso,
  TipoVolume,
  OQueEmbarca,
  oQueVai,
  pessoasComOVeiculo,
  type Reserva,
  type ReservaDeEncomenda,
  type ReservaDePassageiro,
  type ReservaDeVeiculo,
  type RespostasDaReserva,
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
    case 'VEICULO': {
      /* Com as pessoas que vão junto (naveg-front#66), como o painel do KMP escreve, e o tipo para o atendimento. */
      const junto = pessoasComOVeiculo(reserva)
      return [
        `${CategoriaPassagem.rotulo(reserva.categoria)}: ${ClasseVeiculo.rotulo(reserva.classe)}`,
        ...(reserva.cilindrada === undefined ? [] : [`${reserva.cilindrada} cc`]),
        ...(junto === undefined ? [] : [`+ ${junto}`, 'inteira, meia ou gratuidade no atendimento']),
      ].join(' · ')
    }
    default:
      return casoImpossivel(reserva, 'aPassagem')
  }
}

/**
 * **O que vai embarcar, numa linha**, enquanto a reserva ainda não existe: "Caminhão + 3 pessoas em rede", "Moto ·
 * 160 cc", "2 pessoas em suíte". É o texto do quadro que acompanha o calendário (naveg-front#66). `null` enquanto o
 * embarque não está respondido.
 */
export function resumoDoEmbarque(respostas: RespostasDaReserva): string | null {
  const embarque = embarqueEmVigor(respostas)
  if (embarque === undefined || !embarqueRespondido(respostas)) return null
  /* A encomenda (2.7), como a conferência a escreve: "8 volumes · Caixa (mantimentos) · 20 a 50 kg". */
  if (OQueEmbarca.eEncomenda(embarque)) {
    const { tipoVolume, quantidadeVolumes, faixaPeso } = respostas
    if (tipoVolume === undefined || quantidadeVolumes === undefined || faixaPeso === undefined) return null
    const complemento = respostas.complemento?.trim() ?? ''
    const tipo = TipoVolume.rotulo(tipoVolume)
    const volumes = quantidadeVolumes === 1 ? '1 volume' : `${quantidadeVolumes} volumes`
    return `${volumes} · ${complemento.length > 0 ? `${tipo} (${complemento})` : tipo} · ${FaixaPeso.rotulo(faixaPeso)}`
  }
  const { acomodacao, quantidadePessoas } = respostas
  const grupo =
    OQueEmbarca.levaPessoas(embarque) && acomodacao !== undefined && quantidadePessoas !== undefined
      ? `${pessoas(quantidadePessoas)} em ${Acomodacao.rotulo(acomodacao).toLowerCase()}`
      : null
  const classe = classeDoEmbarque(respostas)
  if (!OQueEmbarca.levaVeiculo(embarque) || classe === undefined) return grupo
  const veiculo = [ClasseVeiculo.rotulo(classe), ...(respostas.cilindrada === undefined ? [] : [`${respostas.cilindrada} cc`])].join(
    ' · ',
  )
  return grupo === null ? veiculo : `${veiculo} + ${grupo}`
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
      /* Sem a retirada, o atendimento combina (naveg-front#58, 2.7). */
      valor:
        reserva.retirada === undefined
          ? 'A combinar com o atendimento'
          : reserva.retirada === 'REMETENTE' || destinatario === undefined
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
      /* Um nome só para o celular, do campo à conferência (2.3, B). */
      rotulo: 'Celular',
      valor: telefoneOuNao(reserva.cliente.telefone),
    },
    { rotulo: 'Vale até', valor: `a saída — ${travessia.rotulos.partida}` },
  ]
}
