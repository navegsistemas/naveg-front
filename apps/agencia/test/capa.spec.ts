/**
 * **A capa (1.2).** As decisões do PO que um dia alguém desfaz sem perceber.
 */
import { describe, expect, it } from 'vitest'

import { CAPA } from '../src/conteudo/capa.js'
import {
  EMBARCACOES,
  EMBARCACOES_DA_VITRINE,
  FOTOS_PARA_A_VITRINE,
  VITRINE_VISIVEL,
} from '../src/conteudo/embarcacoes.js'

describe('a capa', () => {
  it('nenhuma credencial repete o título', () => {
    /* O achado 4: o primeiro destaque era "Belém ⇄ Macapá", logo abaixo do título que já dizia isso. */
    for (const credencial of CAPA.credenciais) {
      expect(CAPA.titulo, credencial.valor).not.toContain(credencial.valor)
    }
  })

  it('o WhatsApp abre a conversa, e não rola até outra seção', () => {
    expect(CAPA.acaoDoWhatsapp?.href).toMatch(/^https:\/\/wa\.me\/55\d{11}\?text=/)
  })

  it('o porto de chegada não aparece: é Macapá, como se procura', () => {
    /* Decisão F: quem viaja sabe que se atraca em Santana. */
    const textos = [CAPA.titulo, CAPA.lead, ...CAPA.credenciais.flatMap((c) => [c.valor, c.rotulo])]
    for (const texto of textos) expect(texto).not.toMatch(/santana/i)
  })

  it('tem foto de fundo, e é a do Maria Ivanir', () => {
    const mariaIvanir = EMBARCACOES.find((embarcacao) => embarcacao.id === 'maria-ivanir')
    expect(CAPA.foto).not.toBeNull()
    expect(CAPA.foto).toBe(mariaIvanir?.imagem)
  })
})

describe('a vitrine', () => {
  it('só leva embarcação com foto — nada de molde "Foto pendente" para o cliente', () => {
    for (const embarcacao of EMBARCACOES_DA_VITRINE) expect(embarcacao.imagem).not.toBeNull()
  })

  it('aparece a partir da segunda foto, e não antes', () => {
    expect(VITRINE_VISIVEL).toBe(EMBARCACOES_DA_VITRINE.length >= FOTOS_PARA_A_VITRINE)
    expect(FOTOS_PARA_A_VITRINE).toBe(2)
  })
})
