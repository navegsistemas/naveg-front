/**
 * **A mensagem da encomenda para o atendente** — o mesmo handoff da passagem (`link-de-atendimento.ts`), com o
 * pedido de envio no lugar da passagem pedida.
 *
 * ```
 * Encomenda NVG-7K3QP2
 * Porto do Sal · Belém/PA → Porto de Santana · Santana/AP · Qua, 14/10 · 18:00
 * 3 volumes · Caixa (mantimentos) · 5 a 20 kg
 * De Maria Souza para João Lima, (96) 98888-7777
 * Entregue no porto antes da partida.
 * ```
 *
 * Quando quem manda retira, a quarta linha é `Carlos Melo envia e retira no destino, (91) 98888-1234`.
 *
 * ### Aqui vai telefone, e na passagem não
 *
 * Na passagem, o único telefone é o de quem manda a mensagem, e a conversa já é dele. Aqui, o celular da quarta
 * linha é **por onde o destino avisa que a encomenda chegou** — o do destinatário, ou o de quem manda e retira.
 * O atendente precisa dele à vista, e ele pode não ser o da conversa.
 */
import { formatarWhatsapp } from '../reserva/contato.js'
import type { RotulosDaMensagem } from '../reserva/link-de-atendimento.js'
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

export function mensagemDaEncomenda(reserva: ReservaDeEncomenda, rotulos: RotulosDaMensagem): string {
  return [
    `Encomenda ${reserva.codigo}`,
    `${rotulos.origem} → ${rotulos.destino} · ${rotulos.partida}`,
    oQueVai(reserva),
    quemRetira(reserva),
    'Entregue no porto antes da partida.',
  ].join('\n')
}
