/**
 * **A seção "Envie sua encomenda"** (UI 1.4) — o passo a passo em esquema e o botão.
 */
import { describe, expect, it } from 'vitest'

import { DESENHOS } from '@navegsistemas/design-system'

import { ENVIE_SUA_ENCOMENDA } from '../src/conteudo/encomenda'
import { ANCORA_DA_RESERVA_DE_ENCOMENDA } from '../src/conteudo/secoes'

describe('a seção da encomenda', () => {
  it('quatro passos, na ordem: reservar, confirmar, entregar, retirar', () => {
    expect(ENVIE_SUA_ENCOMENDA.passos.map((passo) => passo.titulo)).toEqual([
      'Reserve aqui',
      'Confirme pelo WhatsApp',
      'Entregue no porto',
      'Retire no destino',
    ])
  })

  it('cada passo tem um ícone que o design system desenha, e uma frase que termina em ponto', () => {
    for (const passo of ENVIE_SUA_ENCOMENDA.passos) {
      expect(DESENHOS[passo.icone]).toBeDefined()
      expect(passo.texto).toMatch(/\.$/)
    }
  })

  it('a retirada é no porto, com documento (2.7, decisão G)', () => {
    expect(ENVIE_SUA_ENCOMENDA.passos.at(-1)?.texto).toBe('No porto, com documento.')
  })

  it('o botão abre a reserva já em "Encomenda"', () => {
    expect(ENVIE_SUA_ENCOMENDA.acao).toEqual({
      rotulo: 'Mandar uma encomenda',
      href: `#${ANCORA_DA_RESERVA_DE_ENCOMENDA}`,
    })
  })
})
