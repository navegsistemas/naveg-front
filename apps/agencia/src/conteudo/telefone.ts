/**
 * **O telefone brasileiro, normalizado num lugar só.**
 *
 * Nasceu no passo 4 dentro de `whatsapp.ts`, e saiu de lá no passo 6 por um motivo concreto: o rodapé pode
 * trazer um **fixo**, e a regra do WhatsApp é estrita a celular. Duas cópias da regra do código do país é
 * exatamente o tipo de duplicação que envelhece torta — uma delas passa a aceitar o que a outra recusa, e
 * ninguém nota até o link não abrir.
 *
 * Aqui mora o que é comum: tirar a pontuação e garantir o `55`. Quem decide **qual forma é aceitável** é o
 * chamador — [normalizarCelular] para o WhatsApp, [normalizarTelefone] para o `tel:`.
 */

/** Brasil. O único país que este atendimento cobre — melhor explícito que um `55` solto no meio do código. */
export const CODIGO_DO_PAIS = '55'

/** 55 + DDD (2) + número (9). */
export const DIGITOS_DO_CELULAR = 13
/** 55 + DDD (2) + número (8). */
export const DIGITOS_DO_FIXO = 12

/** Só os dígitos, com o código do país garantido. Não julga o comprimento — quem julga é quem chama. */
export function digitosComPais(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '')
  return digitos.startsWith(CODIGO_DO_PAIS) ? digitos : `${CODIGO_DO_PAIS}${digitos}`
}

/**
 * Celular, e só celular: `55` + DDD + 9 dígitos.
 *
 * @throws quando não é. É de propósito: o WhatsApp só conversa com celular, e um número malformado não deve
 * virar um link publicado na página — deve quebrar o build de quem o digitou.
 */
export function normalizarCelular(bruto: string): string {
  const numero = digitosComPais(bruto)

  if (numero.length !== DIGITOS_DO_CELULAR) {
    throw new Error(
      `Celular inválido: "${bruto}" virou ${numero.length} dígitos, e o esperado são ${DIGITOS_DO_CELULAR} ` +
        `(${CODIGO_DO_PAIS} + DDD + 9 dígitos).`,
    )
  }

  return numero
}

/** Fixo ou celular — o que um `tel:` aceita. @throws quando não é nenhum dos dois. */
export function normalizarTelefone(bruto: string): string {
  const numero = digitosComPais(bruto)

  if (numero.length !== DIGITOS_DO_CELULAR && numero.length !== DIGITOS_DO_FIXO) {
    throw new Error(
      `Telefone inválido: "${bruto}" virou ${numero.length} dígitos, e o esperado são ` +
        `${DIGITOS_DO_FIXO} (fixo) ou ${DIGITOS_DO_CELULAR} (celular).`,
    )
  }

  return numero
}

/** `tel:+5591988887777` — o formato que o discador entende em qualquer aparelho. */
export function linkDeTelefone(bruto: string): string {
  return `tel:+${normalizarTelefone(bruto)}`
}

/**
 * `(91) 98888-7777` ou `(91) 3333-4444` — como se lê.
 *
 * Formatar a partir do valor normalizado, e não repetir na tela o que foi digitado, é o que faz o rodapé
 * mostrar a mesma coisa quer alguém tenha escrito `91988887777` ou `+55 (91) 9 8888-7777`.
 */
export function formatarTelefone(bruto: string): string {
  const numero = normalizarTelefone(bruto)
  const ddd = numero.slice(2, 4)
  const assinante = numero.slice(4)
  const corte = assinante.length === 9 ? 5 : 4

  return `(${ddd}) ${assinante.slice(0, corte)}-${assinante.slice(corte)}`
}
