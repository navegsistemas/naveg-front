/**
 * **Enviar a reserva** — o caso de uso inteiro, e ele é pequeno de propósito.
 *
 * Gera um código, monta a reserva, grava. Se o código colidir, gera outro e **monta de novo** — a montagem é
 * pura, então a segunda reserva é a primeira com outro código, e mais nada muda. Tudo o que decide *se* há
 * reserva é do domínio (`montarReserva`); o que mora aqui é só a ordem e a nova tentativa.
 *
 * Mora em `dados`, e não no domínio, porque fala com uma porta — e o domínio não fala com ninguém.
 */
import {
  gerarCodigoDaReserva,
  montarReserva,
  type ContextoDaReserva,
  type InstanteLocal,
  type MontagemIncoerente,
  type MontagemIncompleta,
  type Reserva,
  type RespostasDaReserva,
} from '@naveg/domain'

import type { ReservaRepositorio } from './portas.js'

export type ResultadoDoEnvio =
  | { readonly caso: 'ENVIADA'; readonly reserva: Reserva }
  | MontagemIncompleta
  | MontagemIncoerente
  | { readonly caso: 'FALHA'; readonly motivo: string }

export interface PedidoDeEnvio {
  readonly respostas: RespostasDaReserva
  readonly contexto: ContextoDaReserva
  /** O relógio no fuso da operação, lido por quem chama. */
  readonly criadoEm: InstanteLocal
  readonly repositorio: ReservaRepositorio
  readonly agenciaId?: string
  /** Para os cenários. O padrão é o gerador com `crypto.getRandomValues`. */
  readonly gerarCodigo?: () => string
}

/**
 * Cinco tentativas. Com 32⁶ códigos, a segunda colisão seguida já é improvável; cinco seguidas quer dizer que
 * alguma coisa está errada com o gerador ou com a regra, e insistir esconderia isso.
 */
export const TENTATIVAS_DE_CODIGO = 5

export async function enviarReserva(pedido: PedidoDeEnvio): Promise<ResultadoDoEnvio> {
  const gerar = pedido.gerarCodigo ?? (() => gerarCodigoDaReserva())

  for (let tentativa = 0; tentativa < TENTATIVAS_DE_CODIGO; tentativa += 1) {
    const montagem = montarReserva(pedido.respostas, pedido.contexto, {
      codigo: gerar(),
      criadoEm: pedido.criadoEm,
      ...(pedido.agenciaId !== undefined ? { agenciaId: pedido.agenciaId } : {}),
    })
    if (montagem.caso !== 'OK') return montagem

    const gravacao = await pedido.repositorio.criar(montagem.reserva)
    switch (gravacao.caso) {
      case 'GRAVADA':
        return { caso: 'ENVIADA', reserva: montagem.reserva }
      case 'CODIGO_EM_USO':
        continue
      case 'FALHA':
        return gravacao
    }
  }

  return { caso: 'FALHA', motivo: `${TENTATIVAS_DE_CODIGO} códigos seguidos já estavam em uso` }
}
