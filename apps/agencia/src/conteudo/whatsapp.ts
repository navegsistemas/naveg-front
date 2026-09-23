/**
 * **O link do WhatsApp** — função pura, testável sem navegador.
 *
 * `https://wa.me/<E.164 sem o +>?text=<mensagem>` é a forma atual e oficial. `api.whatsapp.com/send` é legada e
 * continua funcionando, mas não é o que a documentação da Meta manda usar hoje.
 *
 * ### O número não vai escrito no `href`
 *
 * Porque quase todo número de atendimento é anotado como as pessoas o leem — `(91) 98888-7777` —, e o WhatsApp
 * só aceita dígitos com o código do país na frente. A passagem é de `telefone.ts`, num lugar só: um parêntese
 * esquecido no `href` não dá erro, dá uma conversa que não abre.
 *
 * ### Ele vai mudar de casa
 *
 * No passo 10 este arquivo vira `@navegsistemas/domain/reserva/link-de-atendimento`, porque lá a mensagem passa a ser
 * montada a partir da reserva — código, travessia, quem viaja. O que está aqui é a metade que já é necessária
 * agora, e a assinatura não muda: o que a reserva acrescenta é o texto, não o mecanismo.
 */
import { normalizarCelular } from './telefone.js'

/**
 * O link para abrir a conversa, opcionalmente já com a mensagem escrita.
 *
 * A mensagem passa por `encodeURIComponent` inteira — acento, quebra de linha e `&` incluídos. Sem isso, um
 * `&` no texto vira outro parâmetro e a mensagem chega cortada no ponto exato em que alguém escreveu "rede &
 * suíte".
 */
export function linkDeWhatsApp(telefone: string, mensagem?: string): string {
  const numero = normalizarCelular(telefone)
  const base = `https://wa.me/${numero}`

  if (mensagem === undefined || mensagem.trim() === '') return base

  return `${base}?text=${encodeURIComponent(mensagem)}`
}
