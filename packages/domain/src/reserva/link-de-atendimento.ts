/**
 * **O handoff para o WhatsApp** — a reserva vira uma conversa com o atendimento, já com o código.
 *
 * O totem grava a reserva; quem a transforma em passagem é uma pessoa, no centralizador. Este arquivo é a ponte:
 * o link `https://wa.me/<número>?text=<mensagem>` que abre a conversa com a mensagem escrita. O atendente acha a
 * reserva pelo **código**, que por isso é o primeiro campo, logo depois da saudação — o resto da mensagem é para
 * ele conferir de relance, sem abrir nada.
 *
 * ### O que não vai na mensagem
 *
 * Documento nenhum, e o telefone também não: a conversa já é **do** telefone de quem manda. O nome vai porque o
 * atendente cumprimenta a pessoa por ele.
 *
 * E a linha "Abrir no app: https://…/r/{codigo}" do plano **fica de fora até existir o domínio de produção**
 * (decisão de 2026-09-25): hoje o endereço seria o da homologação, atrás do login da Vercel, e o cliente
 * receberia um link que não abre. O código na primeira linha basta ao atendente.
 *
 * ### O número passa pela regra do domínio
 *
 * `wa.me` só aceita dígitos com o código do país. O número do atendimento é escrito como se lê —
 * `(91) 98888-7777` — e passa por [normalizarWhatsapp]. Um número que não é celular **lança**: ele é conteúdo
 * do site, escrito uma vez, e deve quebrar o build de quem o digitou, não virar um link que não abre.
 */
import { mensagemDaEncomenda, mensagemDaEncomendaSemCodigo } from '../encomenda/mensagem-da-encomenda.js'
import {
  aberturaSemCodigo,
  camposDaTravessia,
  montarMensagem,
  PEDE_A_CONFIRMACAO,
  type CampoDaMensagem,
  type RotulosDaMensagem,
} from './formato-da-mensagem.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import { Acomodacao } from '../passagem/acomodacao.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import { normalizarWhatsapp } from './contato.js'
import type { Reserva, ReservaDeEncomenda, ReservaDePassageiro, ReservaDeVeiculo } from './reserva.js'

export type { RotulosDaMensagem } from './formato-da-mensagem.js'


/**
 * O link para abrir a conversa, opcionalmente já com a mensagem escrita.
 *
 * A mensagem passa por `encodeURIComponent` inteira — acento, quebra de linha e `&` incluídos. Sem isso, um
 * `&` no texto vira outro parâmetro e a mensagem chega cortada no ponto exato em que alguém escreveu "rede &
 * suíte".
 *
 * @throws quando o número não é um celular brasileiro.
 */
export function linkDeWhatsApp(telefone: string, mensagem?: string): string {
  const numero = normalizarWhatsapp(telefone)
  if (numero === null) {
    throw new Error(`Celular inválido: "${telefone}" não é 55 + DDD + 9 dígitos começando com 9.`)
  }

  const base = `https://wa.me/${numero}`
  if (mensagem === undefined || mensagem.trim() === '') return base
  return `${base}?text=${encodeURIComponent(mensagem)}`
}

function pessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`
}

/**
 * As pessoas que vão com o veículo, como o painel do KMP as escreve: "3 pessoas em rede". Vazio quando ele vai
 * sozinho.
 */
export function pessoasComOVeiculo(reserva: ReservaDeVeiculo): string | undefined {
  const { quantidadePessoas, acomodacao } = reserva
  if (quantidadePessoas === undefined || acomodacao === undefined) return undefined
  return `${pessoas(quantidadePessoas)} em ${Acomodacao.rotulo(acomodacao).toLowerCase()}`
}

/** "*Passagem:* Rede · 1 pessoa", ou "*Veículo:* Moto · 160 cc" e, quando vai gente junto, "*Acompanhantes:* 3 pessoas em rede". */
function camposDaPassagem(reserva: ReservaDePassageiro | ReservaDeVeiculo): CampoDaMensagem[] {
  switch (reserva.categoria) {
    case 'PASSAGEIRO':
      return [{ rotulo: 'Passagem', valor: `${Acomodacao.rotulo(reserva.acomodacao)} · ${pessoas(reserva.quantidadePessoas)}` }]
    case 'VEICULO': {
      const veiculo =
        reserva.cilindrada === undefined
          ? ClasseVeiculo.rotulo(reserva.classe)
          : `${ClasseVeiculo.rotulo(reserva.classe)} · ${reserva.cilindrada} cc`
      const junto = pessoasComOVeiculo(reserva)
      return [
        { rotulo: 'Veículo', valor: veiculo },
        ...(junto === undefined ? [] : [{ rotulo: 'Acompanhantes', valor: junto }]),
      ]
    }
    default:
      return casoImpossivel(reserva, 'camposDaPassagem')
  }
}

/** Os campos da passagem, sem o código: a mensagem com código e a sem código (2.6, B) diferem só na abertura. */
function camposDaReserva(reserva: ReservaDePassageiro | ReservaDeVeiculo, rotulos: RotulosDaMensagem): CampoDaMensagem[] {
  return [...camposDaTravessia(rotulos), ...camposDaPassagem(reserva), { rotulo: 'Nome', valor: reserva.cliente.nome }]
}

/**
 * A mensagem que o cliente manda ao atendimento (2.6, E, PO, 2026-10-16):
 *
 * ```
 * Olá! Gostaria de confirmar a reserva que fiz pelo site.
 *
 * *Reserva:* NVG-7K3QP2
 * *Trecho:* Belém/PA → Salvaterra/PA
 * *Saída:* Qua, 14/10 · 18:00
 * *Embarque:* Porto do Sal · Belém/PA
 * *Passagem:* Rede · 1 pessoa
 * *Nome:* Maria Souza
 *
 * Aguardo a confirmação.
 * ```
 *
 * O "Vale até a partida." de antes saiu: o site já o diz ao cliente, e na conversa soava como aviso ao atendente. A
 * de encomenda tem a mensagem dela (`mensagemDaEncomenda`), com o que vai e quem retira.
 */
export function mensagemDaReserva(reserva: Reserva, rotulos: RotulosDaMensagem): string {
  if (reserva.categoria === 'ENCOMENDA') return mensagemDaEncomenda(reserva, rotulos)
  return montarMensagem(
    'Olá! Gostaria de confirmar a reserva que fiz pelo site.',
    [{ rotulo: 'Reserva', valor: reserva.codigo }, ...camposDaReserva(reserva, rotulos)],
    PEDE_A_CONFIRMACAO,
  )
}

/** O link de atendimento **desta** reserva: a conversa com o atendimento, com a mensagem pronta. */
export function linkDaReserva(telefoneDoAtendimento: string, reserva: Reserva, rotulos: RotulosDaMensagem): string {
  return linkDeWhatsApp(telefoneDoAtendimento, mensagemDaReserva(reserva, rotulos))
}

/**
 * **A reserva que o site não conseguiu enviar** (2.6, B, PO, 2026-10-16): a mesma mensagem, sem o código — ele não existe,
 * porque nada foi gravado —, e a abertura diz o que aconteceu. O atendimento registra no painel.
 */
export function mensagemSemCodigo(reserva: Reserva, rotulos: RotulosDaMensagem): string {
  if (reserva.categoria === 'ENCOMENDA') return mensagemDaEncomendaSemCodigo(reserva, rotulos)
  return montarMensagem(aberturaSemCodigo(reserva), camposDaReserva(reserva, rotulos), PEDE_A_CONFIRMACAO)
}

export function linkSemCodigo(telefoneDoAtendimento: string, reserva: Reserva, rotulos: RotulosDaMensagem): string {
  return linkDeWhatsApp(telefoneDoAtendimento, mensagemSemCodigo(reserva, rotulos))
}

/** O link de atendimento **desta** encomenda: a conversa com o atendimento, com o pedido escrito. */
export function linkDaEncomenda(telefoneDoAtendimento: string, reserva: ReservaDeEncomenda, rotulos: RotulosDaMensagem): string {
  return linkDaReserva(telefoneDoAtendimento, reserva, rotulos)
}
