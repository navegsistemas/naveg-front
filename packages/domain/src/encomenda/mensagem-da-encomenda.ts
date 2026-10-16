/**
 * **A mensagem da encomenda para o atendente** — o mesmo handoff da passagem (`link-de-atendimento.ts`), com o
 * pedido de envio no lugar da passagem pedida.
 *
 * ```
 * Olá! Gostaria de confirmar a encomenda que registrei pelo site.
 *
 * *Encomenda:* NVG-7K3QP2
 * *Trecho:* Belém/PA → Santana/AP
 * *Saída:* Qua, 14/10 · 18:00
 * *Embarque:* Porto do Sal · Belém/PA
 * *Volumes:* 3 · Caixa (mantimentos) · 5 a 20 kg
 * *Remetente:* Maria Souza
 * *Destinatário:* João Lima, (96) 98888-7777
 *
 * Entrego no porto antes da saída. Aguardo a confirmação.
 * ```
 *
 * Quando quem manda retira, o celular vai com o remetente, e o destinatário é "o próprio remetente"; sem a
 * retirada, "a combinar com o atendimento" (2.6, E, PO, 2026-10-16).
 *
 * ### Aqui vai telefone, e na passagem não
 *
 * Na passagem, o único telefone é o de quem manda a mensagem, e a conversa já é dele. Aqui, o celular é **por onde
 * o destino avisa que a encomenda chegou** — o do destinatário, ou o de quem manda e retira.
 * O atendente precisa dele à vista, e ele pode não ser o da conversa.
 */
import { formatarWhatsapp } from '../reserva/contato.js'
import {
  aberturaSemCodigo,
  camposDaTravessia,
  montarMensagem,
  PEDE_A_CONFIRMACAO,
  type CampoDaMensagem,
  type RotulosDaMensagem,
} from '../reserva/formato-da-mensagem.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import type { ReservaDeEncomenda } from '../reserva/reserva.js'
import { FaixaPeso, TipoVolume } from './volume.js'

function volumes(quantidade: number): string {
  return quantidade === 1 ? '1 volume' : `${quantidade} volumes`
}

/** "3 volumes · Caixa (mantimentos) · 5 a 20 kg". Serve também à conferência e à conclusão. */
export function oQueVai(reserva: ReservaDeEncomenda): string {
  const tipo = TipoVolume.rotulo(reserva.tipoVolume)
  const comComplemento = reserva.complemento === undefined ? tipo : `${tipo} (${reserva.complemento})`
  return `${volumes(reserva.quantidadeVolumes)} · ${comComplemento} · ${FaixaPeso.rotulo(reserva.faixaPeso)}`
}

/** Quem manda, quem retira, e o celular por onde o destino avisa. */
export function quemRetira(reserva: ReservaDeEncomenda): string {
  switch (reserva.retirada) {
    /* Sem a retirada, o atendimento combina quem busca (naveg-front#58): a mensagem diz quem manda, e o celular. */
    case undefined:
      return `De ${reserva.cliente.nome}, ${formatarWhatsapp(reserva.cliente.telefone ?? '')} · quem retira, a combinar`
    case 'REMETENTE':
      return `${reserva.cliente.nome} envia e retira no destino, ${formatarWhatsapp(reserva.cliente.telefone ?? '')}`
    case 'OUTRA_PESSOA': {
      const destinatario = reserva.destinatario
      if (destinatario === undefined) return `De ${reserva.cliente.nome}`
      return `De ${reserva.cliente.nome} para ${destinatario.nome}, ${formatarWhatsapp(destinatario.telefone)}`
    }
    default:
      return casoImpossivel(reserva.retirada, 'quemRetira')
  }
}

/** Quem manda e quem retira, em dois campos, com o celular por onde o destino avisa que a encomenda chegou. */
function camposDeQuemRetira(reserva: ReservaDeEncomenda): CampoDaMensagem[] {
  const remetente = reserva.cliente.nome
  const comCelular = `${remetente}, ${formatarWhatsapp(reserva.cliente.telefone ?? '')}`
  switch (reserva.retirada) {
    /* Sem a retirada, o atendimento combina quem busca (naveg-front#58). */
    case undefined:
      return [
        { rotulo: 'Remetente', valor: comCelular },
        { rotulo: 'Destinatário', valor: 'a combinar com o atendimento' },
      ]
    case 'REMETENTE':
      return [
        { rotulo: 'Remetente', valor: comCelular },
        { rotulo: 'Destinatário', valor: 'o próprio remetente' },
      ]
    case 'OUTRA_PESSOA': {
      const destinatario = reserva.destinatario
      return [
        { rotulo: 'Remetente', valor: remetente },
        ...(destinatario === undefined
          ? []
          : [{ rotulo: 'Destinatário', valor: `${destinatario.nome}, ${formatarWhatsapp(destinatario.telefone)}` }]),
      ]
    }
    default:
      return casoImpossivel(reserva.retirada, 'camposDeQuemRetira')
  }
}

/** Os campos da encomenda, sem o código: a mensagem com código e a sem código (2.6, B) diferem só na abertura. */
function camposDaEncomenda(reserva: ReservaDeEncomenda, rotulos: RotulosDaMensagem): CampoDaMensagem[] {
  const tipo = TipoVolume.rotulo(reserva.tipoVolume)
  const comComplemento = reserva.complemento === undefined ? tipo : `${tipo} (${reserva.complemento})`
  return [
    ...camposDaTravessia(rotulos),
    { rotulo: 'Volumes', valor: `${reserva.quantidadeVolumes} · ${comComplemento} · ${FaixaPeso.rotulo(reserva.faixaPeso)}` },
    ...camposDeQuemRetira(reserva),
  ]
}

const FECHO_DA_ENCOMENDA = `Entrego no porto antes da saída. ${PEDE_A_CONFIRMACAO}`

export function mensagemDaEncomenda(reserva: ReservaDeEncomenda, rotulos: RotulosDaMensagem): string {
  return montarMensagem(
    'Olá! Gostaria de confirmar a encomenda que registrei pelo site.',
    [{ rotulo: 'Encomenda', valor: reserva.codigo }, ...camposDaEncomenda(reserva, rotulos)],
    FECHO_DA_ENCOMENDA,
  )
}

/** A encomenda que o site não conseguiu enviar (2.6, B): sem o código, que não existe. */
export function mensagemDaEncomendaSemCodigo(reserva: ReservaDeEncomenda, rotulos: RotulosDaMensagem): string {
  return montarMensagem(aberturaSemCodigo(reserva), camposDaEncomenda(reserva, rotulos), FECHO_DA_ENCOMENDA)
}
