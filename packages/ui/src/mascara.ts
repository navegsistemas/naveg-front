/**
 * **A máscara do celular** — "(91) 98888-7777" enquanto se digita (pedido do PO na prévia da 2.2, 2026-10-15).
 *
 * É só apresentação: quem decide se o número vale é o domínio (`normalizarWhatsapp`), que lê qualquer grafia. A
 * máscara guarda os dígitos e os escreve no formato de sempre, e por isso apagar um parêntese ou um traço não trava
 * a edição: ele volta, e o dígito ao lado é que sai na tecla seguinte.
 *
 * O preenchimento automático do navegador e quem cola o número com o país (`+55 91 98888-7777`) chegam com 13
 * dígitos: o 55 sai, e fica o DDD e o número.
 */

/** DDD e 9 dígitos: o celular brasileiro. */
const DIGITOS_DO_CELULAR = 11

export function mascaraDoCelular(digitado: string): string {
  let digitos = digitado.replace(/\D/g, '')
  if (digitos.length > DIGITOS_DO_CELULAR && digitos.startsWith('55')) digitos = digitos.slice(2)
  digitos = digitos.slice(0, DIGITOS_DO_CELULAR)

  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`
  const ddd = digitos.slice(0, 2)
  const numero = digitos.slice(2)
  if (numero.length <= 4) return `(${ddd}) ${numero}`
  /* Com os 9 dígitos, 5 e 4; antes disso, 4 e o resto — é o que a pessoa vê enquanto digita. */
  const corte = numero.length === 9 ? 5 : 4
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`
}
