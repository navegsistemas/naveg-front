/**
 * **O documento de quem viaja** — a validação e a máscara.
 *
 * A máscara importa mais aqui do que no aplicativo: o totem fica num saguão, e a tela de conferência é o
 * passo em que o CPF de quem reserva poderia ficar legível de longe.
 */
import { describe, expect, it } from 'vitest'

import { TipoDocumento } from '../src/documento/tipo-documento.js'
import { CPFS_VALIDOS } from './exemplos.js'

describe('o CPF', () => {
  it('aceita o que tem dígito verificador correto, pontuado ou não', () => {
    for (const cpf of CPFS_VALIDOS) {
      expect(TipoDocumento.validar('CPF', cpf), cpf).toBe(true)
    }
    expect(TipoDocumento.validar('CPF', '529.982.247-25')).toBe(true)
  })

  it('recusa um dígito trocado — que é o erro que ninguém enxerga', () => {
    expect(TipoDocumento.validar('CPF', '52998224726')).toBe(false)
    expect(TipoDocumento.validar('CPF', '52998224735')).toBe(false)
  })

  it('recusa sequência repetida, que passa na conta dos verificadores', () => {
    for (const algarismo of '0123456789') {
      expect(TipoDocumento.validar('CPF', algarismo.repeat(11)), algarismo).toBe(false)
    }
  })

  it('recusa incompleto sem lançar — num terminal público, incompleto é o estado normal', () => {
    for (const parcial of ['', '529', '529.982.247-2', null, undefined]) {
      expect(() => TipoDocumento.validar('CPF', parcial)).not.toThrow()
      expect(TipoDocumento.validar('CPF', parcial), String(parcial)).toBe(false)
    }
  })

  it('formata progressivamente enquanto se digita', () => {
    expect(TipoDocumento.formatarProgressivo('CPF', '529')).toBe('529')
    expect(TipoDocumento.formatarProgressivo('CPF', '5299822')).toBe('529.982.2')
    expect(TipoDocumento.formatarProgressivo('CPF', '52998224725')).toBe('529.982.247-25')
  })

  it('mascara os seis primeiros e mostra os cinco últimos — o que o balcão confere', () => {
    expect(TipoDocumento.mascarar('CPF', '52998224725')).toBe('###.###.247-25')
    expect(TipoDocumento.exibir('CPF', '52998224725', true)).toBe('###.###.247-25')
    expect(TipoDocumento.exibir('CPF', '52998224725')).toBe('529.982.247-25')
  })
})

describe('os outros documentos', () => {
  it('RG, CNH e passaporte valem pelo comprimento', () => {
    expect(TipoDocumento.validar('RG', '1234')).toBe(false)
    expect(TipoDocumento.validar('RG', '12345')).toBe(true)
    expect(TipoDocumento.validar('CNH', '12345678901')).toBe(true)
    expect(TipoDocumento.validar('PASSAPORTE', 'ab123456')).toBe(true)
    expect(TipoDocumento.validar('PASSAPORTE', 'AB12345')).toBe(false)
  })

  it('o passaporte admite letras e normaliza a caixa; os outros só dígitos', () => {
    expect(TipoDocumento.apenasDigitos('PASSAPORTE')).toBe(false)
    expect(TipoDocumento.apenasDigitos('CPF')).toBe(true)
    expect(TipoDocumento.normalizar('PASSAPORTE', 'ab-123.456')).toBe('AB123456')
    expect(TipoDocumento.normalizar('RG', '12.345-6x')).toBe('123456')
  })

  it('o CNPJ tem DV e não é mascarado — pessoa jurídica não é dado pessoal', () => {
    expect(TipoDocumento.validar('CNPJ', '11.222.333/0001-81')).toBe(true)
    expect(TipoDocumento.validar('CNPJ', '11.222.333/0001-82')).toBe(false)
    expect(TipoDocumento.mascarar('CNPJ', '11222333000181')).toBe('11.222.333/0001-81')
  })

  it('documento incompleto sai como está, em vez de sumir', () => {
    expect(TipoDocumento.formatar('CPF', '529.98')).toBe('52998')
    expect(TipoDocumento.mascarar('CPF', '529.98')).toBe('52998')
  })
})
