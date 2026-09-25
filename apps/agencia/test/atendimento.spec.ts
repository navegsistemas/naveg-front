/**
 * **O atendimento, e o link que leva a ele.**
 *
 * O cenário que mais paga o próprio custo é o do telefone. Um número anotado como as pessoas o escrevem —
 * `(91) 98888-7777` — colocado cru num `wa.me` não dá erro em lugar nenhum: dá um link que **abre e não acha
 * ninguém**, na única página onde o cliente estava tentando falar com a empresa.
 */
import { describe, expect, it } from 'vitest'

import { ATENDENTES, ATENDIMENTO, NOME_PROVISORIO } from '../src/conteudo/atendimento.js'
import { linkDeWhatsApp } from '@navegsistemas/domain'
import { normalizarCelular } from '../src/conteudo/telefone.js'

describe('o celular, normalizado', () => {
  it('aceita as formas em que as pessoas escrevem', () => {
    for (const forma of [
      '(91) 98888-7777',
      '91 98888 7777',
      '91988887777',
      '+55 91 98888-7777',
      '5591988887777',
      ' 55 (91) 9 8888 7777 ',
    ]) {
      expect(normalizarCelular(forma), forma).toBe('5591988887777')
    }
  })

  it('acrescenta o código do país quando falta, e não duplica quando já está', () => {
    expect(normalizarCelular('91988887777')).toBe('5591988887777')
    expect(normalizarCelular('5591988887777')).toBe('5591988887777')
  })

  it('recusa o que não é celular brasileiro, em vez de devolver link quebrado', () => {
    for (const invalido of ['', '9999', '91 8888-7777', '5591988887777000']) {
      expect(() => normalizarCelular(invalido), invalido).toThrow()
    }
  })
})

describe('o link do WhatsApp', () => {
  it('usa wa.me com o número em dígitos', () => {
    expect(linkDeWhatsApp('(91) 98888-7777')).toBe('https://wa.me/5591988887777')
  })

  it('escapa a mensagem inteira', () => {
    const link = linkDeWhatsApp('91988887777', 'Rede & suíte: é possível?')

    expect(link).toContain('?text=')
    expect(link).not.toContain('&suíte')
    /* O `&` cru viraria outro parâmetro, e a mensagem chegaria cortada exatamente nele. */
    expect(decodeURIComponent(link.split('?text=')[1] ?? '')).toBe('Rede & suíte: é possível?')
  })

  it('preserva acento e quebra de linha na ida e volta', () => {
    const mensagem = 'Olá!\nTravessia Belém ⇄ Macapá.'
    const link = linkDeWhatsApp('91988887777', mensagem)

    expect(decodeURIComponent(link.split('?text=')[1] ?? '')).toBe(mensagem)
  })

  it('mensagem vazia não vira um `?text=` pendurado', () => {
    expect(linkDeWhatsApp('91988887777', '   ')).toBe('https://wa.me/5591988887777')
    expect(linkDeWhatsApp('91988887777')).toBe('https://wa.me/5591988887777')
  })
})

describe('o atendimento', () => {
  it('há atendentes, com id único e função declarada', () => {
    expect(ATENDENTES.length).toBeGreaterThan(0)

    const ids = ATENDENTES.map((atendente) => atendente.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const atendente of ATENDENTES) {
      expect(atendente.funcao.trim(), `${atendente.id} sem função`).not.toBe('')
      expect(atendente.horario.trim(), `${atendente.id} sem horário`).not.toBe('')
    }
  })

  it('todo número declarado é válido — o build quebra antes da página', () => {
    /* Sem este cenário, um número errado só apareceria para quem clicasse no botão. */
    for (const atendente of ATENDENTES) {
      if (atendente.whatsapp !== null) {
        expect(() => normalizarCelular(atendente.whatsapp ?? ''), atendente.id).not.toThrow()
      }
    }
  })

  it('toda foto tem texto alternativo', () => {
    for (const atendente of ATENDENTES) {
      if (atendente.foto !== null) {
        expect(atendente.alt?.trim(), `${atendente.id}: foto sem alt`).toBeTruthy()
      }
    }
  })

  it('há nome provisório para quem ainda não tem nome', () => {
    expect(NOME_PROVISORIO.trim()).not.toBe('')
  })

  it('os pontos do argumento têm título e texto', () => {
    expect(ATENDIMENTO.pontos.length).toBeGreaterThan(0)

    for (const ponto of ATENDIMENTO.pontos) {
      expect(ponto.titulo.trim(), 'ponto sem título').not.toBe('')
      expect(ponto.texto.trim(), `${ponto.titulo}: sem texto`).not.toBe('')
    }
  })

  it('a mensagem inicial existe e cabe numa primeira linha de conversa', () => {
    expect(ATENDIMENTO.mensagemInicial.trim()).not.toBe('')
    expect(ATENDIMENTO.mensagemInicial.length).toBeLessThan(200)
  })
})
