/**
 * **Enviar a reserva** — o caso de uso inteiro, e ele é pequeno de propósito.
 *
 * Gera um código, monta a reserva, grava. Se o código colidir, gera outro e **monta de novo** — a montagem é
 * pura, então a segunda reserva é a primeira com outro código, e mais nada muda. Tudo o que decide *se* há
 * reserva é do domínio (`montarReserva`, `montarEncomenda`); o que mora aqui é só a ordem e a nova tentativa.
 *
 * Há dois envios, um por montagem — [enviarReserva] e [enviarEncomenda] —, e uma nova tentativa só, a de
 * [gravarComCodigoLivre]. O repositório é o mesmo: as duas gravam em `reservas`.
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
import { montarEncomenda } from '../encomenda/montagem-da-encomenda.js'
import type { NoDaEncomenda, RespostasDaEncomenda } from '../encomenda/roteiro-da-encomenda.js'
import type { InstanteLocal } from '../primitivos/calendario.js'
import { gerarCodigoDaReserva } from './codigo-da-reserva.js'
import {
  montarReserva,
  type IdentidadeDaReserva,
  type MontagemIncoerente,
  type MontagemIncompleta,
} from './montagem-da-reserva.js'
import type { Reserva, ReservaDeEncomenda } from './reserva.js'
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

/** O mesmo resultado, para a encomenda: o nó que falta é do roteiro dela, e a reserva é de encomenda. */
export type ResultadoDoEnvioDaEncomenda =
  | { readonly caso: 'ENVIADA'; readonly reserva: ReservaDeEncomenda }
  | { readonly caso: 'INCOMPLETA'; readonly faltando: NoDaEncomenda }
  | MontagemIncoerente
  | { readonly caso: 'FALHA'; readonly motivo: string }

interface PedidoBase {
  readonly contexto: ContextoDaReserva
  /** O relógio no fuso da operação, lido por quem chama. */
  readonly criadoEm: InstanteLocal
  readonly repositorio: ReservaRepositorio
  readonly agenciaId?: string
  /** Para os cenários. O padrão é o gerador com `crypto.getRandomValues`. */
  readonly gerarCodigo?: () => string
}

export interface PedidoDeEnvio extends PedidoBase {
  readonly respostas: RespostasDaReserva
}

export interface PedidoDeEnvioDaEncomenda extends PedidoBase {
  readonly respostas: RespostasDaEncomenda
}

/**
 * Cinco tentativas. Com 32⁶ códigos, a segunda colisão seguida já é improvável; cinco seguidas quer dizer que
 * alguma coisa está errada com o gerador ou com a regra, e insistir esconderia isso.
 */
export const TENTATIVAS_DE_CODIGO = 5

type Montagem<R extends Reserva, M extends { readonly caso: 'INCOMPLETA' | 'INCOERENTE' }> = { readonly caso: 'OK'; readonly reserva: R } | M

/**
 * **A nova tentativa, uma vez só.** Monta com um código, grava; colidiu, monta de novo com outro. O que não é
 * `OK` na montagem volta como veio — a incompleta e a incoerente são de quem montou.
 */
async function gravarComCodigoLivre<R extends Reserva, M extends { readonly caso: 'INCOMPLETA' | 'INCOERENTE' }>(
  pedido: PedidoBase,
  montar: (identidade: IdentidadeDaReserva) => Montagem<R, M>,
): Promise<{ readonly caso: 'ENVIADA'; readonly reserva: R } | M | { readonly caso: 'FALHA'; readonly motivo: string }> {
  const gerar = pedido.gerarCodigo ?? (() => gerarCodigoDaReserva())

  for (let tentativa = 0; tentativa < TENTATIVAS_DE_CODIGO; tentativa += 1) {
    const montagem = montar({
      codigo: gerar(),
      criadoEm: pedido.criadoEm,
      ...(pedido.agenciaId !== undefined ? { agenciaId: pedido.agenciaId } : {}),
    })
    if (montagem.caso !== 'OK') return montagem

    const { reserva } = montagem
    const gravacao = await pedido.repositorio.criar(reserva)
    switch (gravacao.caso) {
      case 'GRAVADA':
        return { caso: 'ENVIADA', reserva }
      case 'CODIGO_EM_USO':
        continue
      case 'FALHA':
        return gravacao
    }
  }

  return { caso: 'FALHA', motivo: `${TENTATIVAS_DE_CODIGO} códigos seguidos já estavam em uso` }
}

export function enviarReserva(pedido: PedidoDeEnvio): Promise<ResultadoDoEnvio> {
  return gravarComCodigoLivre(pedido, (identidade) => montarReserva(pedido.respostas, pedido.contexto, identidade))
}

/** O mesmo envio, para a encomenda: a montagem é a dela, e a gravação é na mesma coleção. */
export function enviarEncomenda(pedido: PedidoDeEnvioDaEncomenda): Promise<ResultadoDoEnvioDaEncomenda> {
  return gravarComCodigoLivre(pedido, (identidade) => montarEncomenda(pedido.respostas, pedido.contexto, identidade))
}
