/**
 * **O rodapé, e os dados que ninguém confere.**
 *
 * Toda asserção aqui protege contra a mesma classe de defeito: um valor que **parece certo**. CNPJ com um
 * dígito trocado, telefone que o discador não abre, e-mail sem arroba, link legal apontando para o nada. Nenhum
 * deles quebra a página — todos quebram a confiança de quem tentou usar.
 *
 * Os campos estão `null` hoje, e por isso a maioria dos laços não itera. É de propósito: o cenário existe para
 * o dia em que alguém preencher, que é quando o erro entra.
 */
import { describe, expect, it } from 'vitest'

import { cnpjValido, digitosDoCnpj, formatarCnpj } from '../src/conteudo/cnpj.js'
import {
  CONTATO,
  ENCARREGADO_LGPD,
  ENDERECOS,
  IDENTIFICACAO,
  LINKS_LEGAIS,
} from '../src/conteudo/rodape.js'
import {
  DIGITOS_DO_CELULAR,
  DIGITOS_DO_FIXO,
  formatarTelefone,
  linkDeTelefone,
  normalizarCelular,
  normalizarTelefone,
} from '../src/conteudo/telefone.js'

describe('o CNPJ', () => {
  /* Válidos de verdade: os dígitos verificadores batem. */
  const VALIDOS = ['11.222.333/0001-81', '11222333000181', '04.252.011/0001-10']

  it('aceita o que tem dígito verificador correto, pontuado ou não', () => {
    for (const valido of VALIDOS) {
      expect(cnpjValido(valido), valido).toBe(true)
    }
  })

  it('recusa um dígito trocado — que é o erro que ninguém enxerga', () => {
    expect(cnpjValido('11.222.333/0001-82')).toBe(false)
    expect(cnpjValido('11.222.334/0001-81')).toBe(false)
  })

  it('recusa sequência repetida, que passa na conta dos verificadores', () => {
    /* `00000000000000` e `11111111111111` satisfazem o algoritmo, e são exatamente o que alguém digita
       para vencer um campo obrigatório. A recusa é parte da regra, não zelo extra. */
    for (const algarismo of '0123456789') {
      expect(cnpjValido(algarismo.repeat(14)), algarismo.repeat(14)).toBe(false)
    }
  })

  it('recusa comprimento errado', () => {
    expect(cnpjValido('')).toBe(false)
    expect(cnpjValido('1122233300018')).toBe(false)
    expect(cnpjValido('112223330001811')).toBe(false)
  })

  it('formata, e formata também o parcial', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatarCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81')
    expect(formatarCnpj('112223')).toBe('11.222.3')
    expect(digitosDoCnpj('11.222.333/0001-81')).toBe('11222333000181')
  })

  it('o CNPJ declarado, se houver, é válido', () => {
    /* Sem este cenário, um dígito trocado vira identificação errada publicada por meses. */
    if (IDENTIFICACAO.cnpj !== null) {
      expect(cnpjValido(IDENTIFICACAO.cnpj), `CNPJ inválido: ${IDENTIFICACAO.cnpj}`).toBe(true)
    }
  })
})

describe('o telefone', () => {
  it('aceita fixo e celular, e recusa o resto', () => {
    expect(normalizarTelefone('(91) 3333-4444')).toBe('559133334444')
    expect(normalizarTelefone('(91) 98888-7777')).toBe('5591988887777')

    expect(normalizarTelefone('(91) 3333-4444')).toHaveLength(DIGITOS_DO_FIXO)
    expect(normalizarTelefone('(91) 98888-7777')).toHaveLength(DIGITOS_DO_CELULAR)

    for (const invalido of ['', '333', '9133334444444444']) {
      expect(() => normalizarTelefone(invalido), invalido).toThrow()
    }
  })

  it('o celular é mais estrito que o telefone — fixo não abre WhatsApp', () => {
    expect(() => normalizarCelular('(91) 3333-4444')).toThrow()
    expect(() => normalizarTelefone('(91) 3333-4444')).not.toThrow()
  })

  it('formata a partir do valor normalizado, não do que foi digitado', () => {
    /* Quer alguém escreva `91988887777` ou `+55 (91) 9 8888-7777`, o rodapé mostra a mesma coisa. */
    expect(formatarTelefone('91988887777')).toBe('(91) 98888-7777')
    expect(formatarTelefone('+55 (91) 9 8888-7777')).toBe('(91) 98888-7777')
    expect(formatarTelefone('9133334444')).toBe('(91) 3333-4444')
  })

  it('o link é `tel:` com o `+`, que é o que o discador entende', () => {
    expect(linkDeTelefone('(91) 3333-4444')).toBe('tel:+559133334444')
  })

  it('o telefone declarado, se houver, é discável', () => {
    if (CONTATO.telefone !== null) {
      expect(() => linkDeTelefone(CONTATO.telefone ?? ''), CONTATO.telefone).not.toThrow()
    }
  })
})

describe('os endereços', () => {
  it('há endereços, com id único, município e UF', () => {
    expect(ENDERECOS.length).toBeGreaterThan(0)

    const ids = ENDERECOS.map((endereco) => endereco.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const endereco of ENDERECOS) {
      expect(endereco.municipio.trim(), `${endereco.id} sem município`).not.toBe('')
      expect(endereco.rotulo.trim(), `${endereco.id} sem rótulo`).not.toBe('')
      expect(endereco.uf, `${endereco.id}: UF fora do formato`).toMatch(/^[A-Z]{2}$/)
    }
  })
})

describe('o que a lei exige', () => {
  it('a política de privacidade está declarada — o totem trata dado pessoal', () => {
    /* Ela pode estar pendente, mas não pode estar ausente: sumir da lista é como ela deixa de ser
       providenciada. Ver ADR-0002 e a LGPD, art. 41. */
    expect(LINKS_LEGAIS.map((link) => link.id)).toContain('privacidade')
  })

  it('todo link legal tem rótulo e motivo, e endereço absoluto ou interno quando houver', () => {
    for (const link of LINKS_LEGAIS) {
      expect(link.rotulo.trim(), `${link.id} sem rótulo`).not.toBe('')
      expect(link.motivo.trim(), `${link.id} sem motivo`).not.toBe('')

      if (link.href !== null) {
        expect(
          link.href.startsWith('/') || link.href.startsWith('https://'),
          `${link.id}: ${link.href} não é caminho interno nem https`,
        ).toBe(true)
      }
    }
  })

  it('o canal do encarregado, se declarado, é um e-mail', () => {
    if (ENCARREGADO_LGPD.email !== null) {
      expect(ENCARREGADO_LGPD.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    }
  })

  it('o e-mail de contato, se declarado, é um e-mail', () => {
    if (CONTATO.email !== null) {
      expect(CONTATO.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    }
  })
})
