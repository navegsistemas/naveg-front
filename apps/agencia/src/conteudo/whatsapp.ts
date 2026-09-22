/**
 * **O link do WhatsApp** — função pura, testável sem navegador.
 *
 * `https://wa.me/<E.164 sem o +>?text=<mensagem>` é a forma atual e oficial. `api.whatsapp.com/send` é legada e
 * continua funcionando, mas não é o que a documentação da Meta manda usar hoje.
 *
 * ### Por que o número não vai escrito no `href`
 *
 * Porque quase todo número de atendimento é anotado como as pessoas o leem — `(91) 98888-7777` —, e o WhatsApp
 * só aceita dígitos com o código do país na frente. [normalizarTelefone] faz essa passagem em um lugar só, com
 * cenário próprio: um parêntese esquecido no `href` não dá erro, dá uma conversa que não abre.
 *
 * ### Ele vai mudar de casa
 *
 * No passo 10 este arquivo vira `@naveg/domain/reserva/link-de-atendimento`, porque lá a mensagem passa a ser
 * montada a partir da reserva — código, travessia, quem viaja. O que está aqui é a metade que já é necessária
 * agora, e a assinatura não muda: o que a reserva acrescenta é o texto, não o mecanismo.
 */

/** Brasil. O único país que este atendimento cobre — e explicitar isso é melhor que um `55` solto no meio. */
const CODIGO_DO_PAIS = '55'

/** Celular brasileiro em E.164: 55 + DDD (2) + número (9). */
const DIGITOS_ESPERADOS = 13

/**
 * O telefone como o WhatsApp o quer: **só dígitos, com o código do país, sem o `+`**.
 *
 * Aceita a forma como as pessoas escrevem — `(91) 98888-7777`, `+55 91 98888 7777`, `91988887777` — e devolve
 * sempre `5591988887777`.
 *
 * @throws quando o que sobra não é um celular brasileiro. É de propósito: um número malformado não deve virar
 * um link quebrado publicado na página, deve quebrar o build de quem o digitou.
 */
export function normalizarTelefone(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '')

  const comPais = digitos.startsWith(CODIGO_DO_PAIS) ? digitos : `${CODIGO_DO_PAIS}${digitos}`

  if (comPais.length !== DIGITOS_ESPERADOS) {
    throw new Error(
      `Telefone inválido: "${bruto}" virou ${comPais.length} dígitos, e o esperado são ${DIGITOS_ESPERADOS} ` +
        `(${CODIGO_DO_PAIS} + DDD + 9 dígitos).`,
    )
  }

  return comPais
}

/**
 * O link para abrir a conversa, opcionalmente já com a mensagem escrita.
 *
 * A mensagem passa por `encodeURIComponent` inteira — acento, quebra de linha e `&` incluídos. Sem isso, um
 * `&` no texto vira outro parâmetro e a mensagem chega cortada no ponto exato em que alguém escreveu "rede &
 * suíte".
 */
export function linkDeWhatsApp(telefone: string, mensagem?: string): string {
  const numero = normalizarTelefone(telefone)
  const base = `https://wa.me/${numero}`

  if (mensagem === undefined || mensagem.trim() === '') return base

  return `${base}?text=${encodeURIComponent(mensagem)}`
}
