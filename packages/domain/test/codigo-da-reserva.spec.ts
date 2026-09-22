/**
 * **O código `NVG-XXXXXX`** — alfabeto, tamanho, e a ausência do que se confunde ao ditar.
 *
 * A fonte de aleatoriedade entra por parâmetro, e é isso que permite asserir o **código exato** em vez de só
 * o formato: um gerador que sempre devolvesse `NVG-000000` passaria em qualquer cenário de formato.
 */
import { describe, expect, it } from 'vitest'

import {
  ALFABETO_DO_CODIGO,
  codigoValido,
  COMPRIMENTO_DO_SUFIXO,
  gerarCodigoDaReserva,
  normalizarCodigo,
  PREFIXO_DO_CODIGO,
  type FonteDeAleatoriedade,
} from '../src/reserva/codigo-da-reserva.js'

function fonteFixa(...bytes: number[]): FonteDeAleatoriedade {
  return () => Uint8Array.from(bytes)
}

describe('o alfabeto', () => {
  it('é a base32 de Crockford: 32 símbolos, sem repetição', () => {
    expect(ALFABETO_DO_CODIGO).toHaveLength(32)
    expect(new Set(ALFABETO_DO_CODIGO).size).toBe(32)
  })

  it('não tem I, L, O nem U — os que se confundem ao ditar, e o que forma palavrão', () => {
    for (const ambiguo of 'ILOU') {
      expect(ALFABETO_DO_CODIGO, ambiguo).not.toContain(ambiguo)
    }
  })

  it('é só dígito e maiúscula', () => {
    expect(ALFABETO_DO_CODIGO).toMatch(/^[0-9A-Z]+$/)
  })

  it('divide 256 — é o que torna `byte % 32` uniforme, sem viés de módulo', () => {
    expect(256 % ALFABETO_DO_CODIGO.length).toBe(0)
  })
})

describe('o gerador', () => {
  it('mapeia cada byte para um símbolo — o código é determinado pela fonte', () => {
    /* 0→'0', 31→'Z', 32→'0' (volta), 10→'A', 18→'J' (pula o I), 255→'Z' */
    expect(gerarCodigoDaReserva(fonteFixa(0, 31, 32, 10, 18, 255))).toBe('NVG-0Z0AJZ')
  })

  it('tem prefixo e seis caracteres do alfabeto', () => {
    for (let tentativa = 0; tentativa < 200; tentativa += 1) {
      const codigo = gerarCodigoDaReserva()
      expect(codigo.startsWith(PREFIXO_DO_CODIGO)).toBe(true)
      expect(codigo).toHaveLength(PREFIXO_DO_CODIGO.length + COMPRIMENTO_DO_SUFIXO)
      expect(codigoValido(codigo), codigo).toBe(true)
    }
  })

  it('com a fonte segura, não repete em mil tentativas', () => {
    /* Não é prova de aleatoriedade — é o alarme para o gerador que ficou constante. Com 32⁶ códigos, a
       chance de colisão legítima em mil é da ordem de 1 em 2 mil. */
    const gerados = new Set(Array.from({ length: 1000 }, () => gerarCodigoDaReserva()))
    expect(gerados.size).toBeGreaterThanOrEqual(999)
  })

  it('usa todo o alfabeto — nenhum símbolo fica de fora da distribuição', () => {
    const vistos = new Set<string>()
    for (let byte = 0; byte < 256; byte += 1) {
      vistos.add(gerarCodigoDaReserva(fonteFixa(byte, 0, 0, 0, 0, 0)).charAt(4))
    }
    expect([...vistos].sort().join('')).toBe([...ALFABETO_DO_CODIGO].sort().join(''))
  })

  it('recusa uma fonte que devolve bytes de menos, em vez de gerar um código curto', () => {
    expect(() => gerarCodigoDaReserva(fonteFixa(1, 2, 3))).toThrow(/3 bytes/)
  })
})

describe('a leitura do que alguém digitou', () => {
  it('tolera caixa, espaços, hífen e o prefixo ausente', () => {
    for (const grafia of ['NVG-7K3QP2', 'nvg-7k3qp2', '  NVG-7K3QP2 ', 'NVG7K3QP2', '7K3QP2', '7k3-qp2', 'NVG 7K3 QP2']) {
      expect(normalizarCodigo(grafia), grafia).toBe('NVG-7K3QP2')
    }
  })

  it('um sufixo que começa com "NVG" não perde três caracteres quando o prefixo é omitido', () => {
    /* N, V e G estão no alfabeto: `NVG-NVGABC` é um código legítimo, e quem dita diz só "NVGABC". */
    expect(normalizarCodigo('NVGABC')).toBe('NVG-NVGABC')
    expect(normalizarCodigo('NVG-NVGABC')).toBe('NVG-NVGABC')
    expect(normalizarCodigo('nvgnvgabc')).toBe('NVG-NVGABC')
  })

  it('faz as trocas de Crockford: I e L viram 1, O vira 0', () => {
    expect(normalizarCodigo('NVG-O1IZQ4')).toBe('NVG-011ZQ4')
    expect(normalizarCodigo('nvg-lo0000')).toBe('NVG-100000')
  })

  it('recusa o U — ele foi excluído de propósito e não é a grafia errada de nada', () => {
    expect(normalizarCodigo('NVG-UUUUUU')).toBeNull()
  })

  it('recusa comprimento errado e símbolo fora do alfabeto — aí não é grafia, é outro código', () => {
    for (const errado of ['NVG-7K3QP', 'NVG-7K3QP22', 'NVG-7K3QP!', '', '   ', 'NVG-']) {
      expect(normalizarCodigo(errado), errado).toBeNull()
    }
    expect(normalizarCodigo(null)).toBeNull()
    expect(normalizarCodigo(undefined)).toBeNull()
  })

  it('o que a leitura devolve é sempre um código válido', () => {
    for (const grafia of ['7k3qp2', 'NVG-O1IZQ4', 'nvg lo0000']) {
      const lido = normalizarCodigo(grafia)
      expect(lido !== null && codigoValido(lido), grafia).toBe(true)
    }
  })
})

describe('a validação estrita', () => {
  it('não normaliza: é o que o codec pergunta', () => {
    expect(codigoValido('NVG-7K3QP2')).toBe(true)
    expect(codigoValido('nvg-7k3qp2')).toBe(false)
    expect(codigoValido('7K3QP2')).toBe(false)
    expect(codigoValido('NVG-7K3QPI')).toBe(false)
    expect(codigoValido(null)).toBe(false)
  })
})
