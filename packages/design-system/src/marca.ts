/**
 * **As cores da marca em valor literal** — para onde o CSS não alcança.
 *
 * `<meta name="theme-color">`, o manifesto do app, a cor de fundo de uma imagem OG: nenhum deles aceita
 * `var(--navy)`. São atributos de HTML e campos de JSON, e precisam do valor.
 *
 * Este arquivo é, por isso, a **segunda e última** casa de um valor de cor no repositório — a primeira é
 * `tokens.css`. A exceção não é um furo na regra porque ela é **fechada por cenário**: `test/tokens.spec.ts`
 * resolve cada token e exige que o valor daqui seja idêntico. Divergir não é possível em silêncio; é build
 * vermelho.
 *
 * Fosse só uma constante solta, seria exatamente o problema que a regra existe para impedir: um segundo lugar
 * onde a cor mora, que envelhece quando o primeiro muda.
 */

export const COR_DA_MARCA = {
  /** `--navy`. É o `theme-color` nos dois temas: o cabeçalho é navy nos dois. */
  navy: '#103a5b',
  /** `--laranja`. */
  laranja: '#fa8b17',
  /** `--areia` — o fundo da página no tema claro. */
  fundoClaro: '#f7f4f1',
  /** `--navy-profundo` — o fundo da página no tema escuro. */
  fundoEscuro: '#0a2237',
} as const

/** O token de que cada valor acima é cópia. É esta tabela que o cenário percorre. */
export const ORIGEM_DA_COR: Readonly<Record<keyof typeof COR_DA_MARCA, string>> = {
  navy: '--navy',
  laranja: '--laranja',
  fundoClaro: '--areia',
  fundoEscuro: '--navy-profundo',
}
