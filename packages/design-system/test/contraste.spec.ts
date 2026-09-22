/**
 * **O lint da paleta.**
 *
 * Estes cenários não verificam gosto: eles resolvem cada token semântico até o primitivo e medem a razão de
 * contraste da WCAG. É o que transforma "o botão laranja com rótulo branco fica bonito" numa afirmação
 * falsificável — e falsa.
 *
 * A razão de existirem é concreta. O laranja da marca (`#FA8B17`) dá **2,42:1** com branco, quando o mínimo
 * para texto é 4,5:1. É um erro fácil de cometer, impossível de ver sem medir, e que só aparece quando alguém
 * que enxerga pouco tenta ler o botão principal da página.
 */
import { describe, expect, it } from 'vitest'

import {
  MINIMO_CONTORNO,
  MINIMO_TEXTO,
  contraste,
  cor,
  mapaDoTema,
  type Tema,
} from './cor.js'

/** Os pares em que um token **escreve** sobre o outro. Mínimo 4,5:1. */
const PARES_DE_TEXTO: ReadonlyArray<readonly [string, string]> = [
  ['--text', '--bg'],
  ['--text', '--surface'],
  ['--text', '--surface-2'],
  ['--text-body', '--bg'],
  ['--text-body', '--surface'],
  ['--text-body', '--surface-2'],
  ['--text-secondary', '--bg'],
  ['--text-secondary', '--surface'],
  ['--text-secondary', '--surface-2'],
  ['--accent', '--bg'],
  ['--accent', '--surface'],
  ['--accent', '--surface-2'],
  /* O par que guarda a armadilha da paleta: se `--acao-texto` virar `--branco`, aqui quebra. */
  ['--acao-texto', '--acao-bg'],
  ['--acao-texto-hover', '--acao-bg-hover'],
  ['--accent-contraste', '--accent-superficie'],
  ['--header-texto', '--header-bg'],
  ['--header-texto-dim', '--header-bg'],
]

/** Os pares em que um token **delimita** o outro — contorno de campo, anel de foco. Mínimo 3:1. */
const PARES_DE_CONTORNO: ReadonlyArray<readonly [string, string]> = [
  ['--border-forte', '--bg'],
  ['--border-forte', '--surface'],
  ['--foco', '--bg'],
  ['--foco', '--surface'],
  ['--header-foco', '--header-bg'],
]

const TEMAS: readonly Tema[] = ['claro', 'escuro']

describe('a paleta da marca, medida', () => {
  it('o laranja do logo reprova como texto, nos dois sentidos', () => {
    expect(contraste('#fa8b17', '#ffffff')).toBeCloseTo(2.42, 1)
    expect(contraste('#fa8b17', '#ffffff')).toBeLessThan(MINIMO_TEXTO)
  })

  it('o azul-marinho do logo é o melhor texto da marca sobre claro', () => {
    expect(contraste('#103a5b', '#ffffff')).toBeCloseTo(11.79, 1)
  })

  it('o marrom é o que se escreve em cima do laranja', () => {
    expect(contraste('#1b1006', '#fa8b17')).toBeGreaterThanOrEqual(MINIMO_TEXTO)
    expect(contraste('#3a240e', '#fa8b17')).toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })

  it('o azul-marinho também passa sobre o laranja, e é a única cor da marca que passa', () => {
    expect(contraste('#103a5b', '#fa8b17')).toBeGreaterThanOrEqual(MINIMO_TEXTO)
    expect(contraste('#ffffff', '#fa8b17')).toBeLessThan(MINIMO_TEXTO)
  })
})

describe.each(TEMAS)('o tema %s', (tema) => {
  const mapa = mapaDoTema(tema)

  it.each(PARES_DE_TEXTO)('%s lê-se sobre %s', (tinta, fundo) => {
    expect(contraste(cor(mapa, tinta), cor(mapa, fundo))).toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })

  it.each(PARES_DE_CONTORNO)('%s delimita %s', (contorno, fundo) => {
    expect(contraste(cor(mapa, contorno), cor(mapa, fundo))).toBeGreaterThanOrEqual(MINIMO_CONTORNO)
  })

  it('o laranja da marca nunca é a tinta — é por isso que `--accent` não é ele', () => {
    expect(cor(mapa, '--accent')).not.toBe(cor(mapa, '--laranja'))
    expect(cor(mapa, '--acao-texto')).not.toBe(cor(mapa, '--branco'))
  })
})

describe('o tema claro, especificamente', () => {
  const mapa = mapaDoTema('claro')

  it('o laranja puro não alcançaria o mínimo de texto sobre o fundo da página', () => {
    /* O cenário que documenta a regra: não é que `--laranja` esteja errado, é que ele não é tinta.
       Se algum dia ele passar aqui, a paleta mudou e a regra do `tokens.css` precisa ser reescrita. */
    expect(contraste(cor(mapa, '--laranja'), cor(mapa, '--bg'))).toBeLessThan(MINIMO_TEXTO)
  })
})
