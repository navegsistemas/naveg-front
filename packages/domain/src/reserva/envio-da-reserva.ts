/**
 * **Enviar a reserva** — o caso de uso inteiro, e ele é pequeno de propósito.
 *
 * Gera um código, monta a reserva, grava. Se o código colidir, gera outro e **monta de novo** — a montagem é
 * pura, então a segunda reserva é a primeira com outro código, e mais nada muda. Tudo o que decide *se* há
 * reserva é do domínio (`montarReserva`); o que mora aqui é só a ordem e a nova tentativa.
 *
 * ### Por que mora no domínio
 *
 * Morava no `@navegsistemas/dados`, porque fala com uma porta. Veio para cá no passo 10 (decisão de 2026-09-23)
 * porque **o servidor também o executa**: a `naveg-api-vercel` grava pelo mesmo caso de uso que o totem usava,
 * e o domínio é o único pacote publicado. Duas cópias da nova tentativa divergiriam.
 *
 * O domínio continua sem falar com ninguém: a **porta** (`ReservaRepositorio`) é só uma interface declarada
 * aqui, e quem a implementa — em memória, Firestore, HTTP — mora fora. É o domínio dizendo do que precisa, e
 * não sabendo quem entrega.
 */
import type { InstanteLocal } from '../primitivos/calendario.js'
import { gerarCodigoDaReserva } from './codigo-da-reserva.js'
import { montarReserva, type MontagemIncoerente, type MontagemIncompleta } from './montagem-da-reserva.js'
import type { Reserva } from './reserva.js'
import type { ContextoDaReserva, RespostasDaReserva } from './roteiro-da-reserva.js'

/**
 * O resultado de tentar gravar. `CODIGO_EM_USO` é caso próprio, e não uma falha genérica, porque é o único que
 * se resolve **tentando de novo com outro código** — é o `create` recusado porque o documento já existe
 * (ADR-0002, camada 4).
 */
export type ResultadoDaGravacao =
  | { readonly caso: 'GRAVADA' }
  | { readonly caso: 'CODIGO_EM_USO' }
  | { readonly caso: 'FALHA'; readonly motivo: string }

/** Onde a reserva é gravada. Só criar: o público não lê, não altera, não apaga. */
export interface ReservaRepositorio {
  criar(reserva: Reserva): Promise<ResultadoDaGravacao>
}

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
