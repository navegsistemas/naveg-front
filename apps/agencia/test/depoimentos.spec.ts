/**
 * **As avaliações e as redes.**
 *
 * Os dois cenários que importam aqui protegem contra o mesmo tipo de defeito: conteúdo que **parece certo** e
 * não é. Uma nota 7 de 5 desenha sete estrelas e ninguém estranha; um link de Instagram colado errado leva a
 * página institucional da empresa para o perfil de outra pessoa, e ninguém confere clicando.
 */
import { describe, expect, it } from 'vitest'

import {
  DEPOIMENTOS,
  MOLDES_DA_VITRINE,
  NOTA_MAXIMA,
  REDES,
} from '../src/conteudo/depoimentos.js'

describe('as avaliações', () => {
  it('a vitrine nunca fica visualmente vazia', () => {
    /* Com a lista vazia, é o molde que dá forma à seção. Zero moldes deixaria um título solto no nada. */
    expect(MOLDES_DA_VITRINE).toBeGreaterThan(0)
  })

  it('os ids são únicos', () => {
    const ids = DEPOIMENTOS.map((depoimento) => depoimento.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toda avaliação tem autor, origem e texto', () => {
    for (const depoimento of DEPOIMENTOS) {
      expect(depoimento.autor.trim(), `${depoimento.id} sem autor`).not.toBe('')
      expect(depoimento.cidade.trim(), `${depoimento.id} sem cidade`).not.toBe('')
      expect(depoimento.travessia.trim(), `${depoimento.id} sem travessia`).not.toBe('')
      expect(depoimento.texto.trim(), `${depoimento.id} sem texto`).not.toBe('')
    }
  })

  it('a nota é um inteiro dentro da escala', () => {
    /* Nota 7 numa escala de 5 desenha sete estrelas sem erro nenhum — e a página passa a afirmar uma
       avaliação que a escala não comporta. */
    for (const depoimento of DEPOIMENTOS) {
      expect(Number.isInteger(depoimento.nota), `${depoimento.id}: nota não inteira`).toBe(true)
      expect(depoimento.nota, `${depoimento.id}: nota fora da escala`).toBeGreaterThanOrEqual(1)
      expect(depoimento.nota, `${depoimento.id}: nota fora da escala`).toBeLessThanOrEqual(NOTA_MAXIMA)
    }
  })
})

describe('as redes', () => {
  it('há redes declaradas, com id único, nome e domínio', () => {
    expect(REDES.length).toBeGreaterThan(0)

    const ids = REDES.map((rede) => rede.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const rede of REDES) {
      expect(rede.nome.trim(), `${rede.id} sem nome`).not.toBe('')
      expect(rede.dominio.trim(), `${rede.id} sem domínio`).not.toBe('')
    }
  })

  it('todo endereço declarado é https e aponta para o domínio daquela rede', () => {
    /* É o cenário que impede o link do Instagram da NAVEG de levar ao Facebook de outra pessoa — um erro
       de copiar e colar que a página não acusa e que ninguém confere clicando. */
    for (const rede of REDES) {
      if (rede.url === null) continue

      const endereco = new URL(rede.url)

      expect(endereco.protocol, `${rede.id}: não é https`).toBe('https:')
      expect(
        endereco.hostname === rede.dominio || endereco.hostname.endsWith(`.${rede.dominio}`),
        `${rede.id}: ${endereco.hostname} não pertence a ${rede.dominio}`,
      ).toBe(true)
    }
  })

  it('perfil sem endereço não existe — o arroba só aparece onde há para onde clicar', () => {
    for (const rede of REDES) {
      if (rede.perfil !== null) {
        expect(rede.url, `${rede.id}: perfil declarado sem endereço`).not.toBeNull()
      }
    }
  })

  it('o WhatsApp não está entre as redes — ele é canal de atendimento', () => {
    /* Repeti-lo aqui daria dois caminhos para a mesma conversa, e o daqui iria sem contexto nenhum. */
    expect(REDES.map((rede) => rede.id)).not.toContain('whatsapp')
  })
})
