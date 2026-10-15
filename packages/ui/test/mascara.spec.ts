/**
 * **A máscara do celular** — o que a pessoa vê a cada dígito, e o que chega colado ou do preenchimento automático.
 */
import { describe, expect, it } from 'vitest'

import { mascaraDoCelular } from '../src/mascara.js'

describe('a máscara do celular', () => {
  it('cresce com os dígitos, até "(91) 98888-7777"', () => {
    const passos = ['', '(9', '(91', '(91) 9', '(91) 9888', '(91) 9888-8', '(91) 9888-8777', '(91) 98888-7777']
    const digitados = ['', '9', '91', '919', '919888', '9198888', '9198888777', '91988887777']
    expect(digitados.map(mascaraDoCelular)).toEqual(passos)
  })

  it('lê qualquer grafia, e para no 11º dígito', () => {
    expect(mascaraDoCelular('91 98888 7777')).toBe('(91) 98888-7777')
    expect(mascaraDoCelular('(91)98888-77771234')).toBe('(91) 98888-7777')
  })

  it('o número com o país (+55) perde o 55: é o que o preenchimento automático e quem cola mandam', () => {
    expect(mascaraDoCelular('+55 91 98888-7777')).toBe('(91) 98888-7777')
    expect(mascaraDoCelular('5591988887777')).toBe('(91) 98888-7777')
  })

  it('o fixo aparece como se digitou — quem o recusa é o domínio, com a mensagem', () => {
    expect(mascaraDoCelular('9132221111')).toBe('(91) 3222-1111')
  })
})
