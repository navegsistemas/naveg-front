/**
 * **O WhatsApp de quem reserva** — a regra do número, do lado do domínio.
 *
 * É o campo mais importante da reserva e o mais fácil de errar sem que ninguém perceba. Número errado não
 * dá erro em lugar nenhum: a reserva grava, o atendimento abre a conversa, e a conversa não acha ninguém.
 * A clientela que a Fase 1 existe para formar se perde exatamente aqui.
 *
 * ### Por que não reaproveitar `apps/agencia/src/conteudo/telefone.ts`
 *
 * Além de o domínio não poder importar do app, a regra daquele arquivo decide se o código do país está
 * presente **pelo prefixo** (`startsWith('55')`) — e `55` também é **DDD**, o de Santa Maria e da região
 * central do Rio Grande do Sul. Um viajante de lá que digite `(55) 99999-8888` produz `55999998888`, que
 * começa com `55`, não ganha o código do país, e é recusado com 11 dígitos.
 *
 * Lá isso é inofensivo: o número conferido é **o da NAVEG**, escrito uma vez num arquivo de conteúdo. Aqui
 * o número é **do cliente**, digitado num terminal público, e o caso deixa de ser hipotético. Então a
 * decisão é pelo **comprimento**, que não tem ambiguidade: 11 dígitos são nacionais (DDD + 9), 13 são
 * internacionais (`55` + DDD + 9). O comprimento é a informação; o prefixo, não.
 */

/** `55` + DDD sem zero (nenhum DDD brasileiro tem o algarismo 0) + `9` + 8 dígitos. */
const PADRAO_DO_WHATSAPP = /^55[1-9]{2}9\d{8}$/

const DIGITOS_NACIONAIS = 11
const DIGITOS_INTERNACIONAIS = 13

/**
 * O que a pessoa digitou → E.164 sem o `+`, ou `null` quando não é um celular brasileiro.
 *
 * Aceita `(91) 98888-7777`, `91988887777`, `+55 91 98888-7777` e `5591988887777` — todos dão o mesmo
 * número. Não adivinha: sem DDD, não há como saber de onde é, e um DDD inventado é um número de outra
 * pessoa.
 */
export function normalizarWhatsapp(bruto: string | null | undefined): string | null {
  if (bruto === null || bruto === undefined) return null
  const digitos = bruto.replace(/\D/g, '')

  const comPais =
    digitos.length === DIGITOS_NACIONAIS
      ? `55${digitos}`
      : digitos.length === DIGITOS_INTERNACIONAIS
        ? digitos
        : null

  return comPais !== null && PADRAO_DO_WHATSAPP.test(comPais) ? comPais : null
}

/** O texto **já é** o número canônico? Estrito: é o que o agregado e o codec perguntam. */
export function whatsappValido(numero: string): boolean {
  return PADRAO_DO_WHATSAPP.test(numero)
}

/** `5591988887777` → `(91) 98888-7777`. Para a conferência: quem reserva confere o número que leu, não o que digitou. */
export function formatarWhatsapp(numero: string): string {
  if (!whatsappValido(numero)) return numero
  return `(${numero.slice(2, 4)}) ${numero.slice(4, 9)}-${numero.slice(9)}`
}
