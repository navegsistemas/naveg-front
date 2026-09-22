/**
 * **A navegação não pode divergir da página, porque é derivada dela.**
 *
 * Estes cenários cobram do dado o que o compilador não vê: âncora apontando para seção que não existe, id
 * repetido, rótulo em branco. São exatamente os defeitos que uma lista de menu escrita à mão acumula, e o
 * motivo de ela não ser escrita à mão.
 */
import { describe, expect, it } from 'vitest'

import { ID_DO_RODAPE, SECOES, ancorasDaPagina, menuDaPagina } from '../src/conteudo/secoes.js'

describe('as seções da página', () => {
  it('há seções, e nenhuma com id vazio', () => {
    expect(SECOES.length).toBeGreaterThan(0)
    for (const secao of SECOES) {
      expect(secao.id.trim(), 'seção com id vazio').not.toBe('')
    }
  })

  it('os ids são únicos — dois `id` iguais fazem a âncora cair no primeiro', () => {
    const ids = ancorasDaPagina()
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('o id do rodapé não colide com nenhuma seção', () => {
    expect(SECOES.map((secao) => secao.id)).not.toContain(ID_DO_RODAPE)
  })

  it('toda seção com título tem título não vazio, e subtítulo só onde há título', () => {
    for (const secao of SECOES) {
      if (secao.titulo !== null) expect(secao.titulo.trim()).not.toBe('')
      if (secao.subtitulo !== null) {
        expect(secao.titulo, `${secao.id}: subtítulo sem título`).not.toBeNull()
      }
    }
  })
})

describe('o menu', () => {
  const menu = menuDaPagina()
  const ancoras = ancorasDaPagina()

  it('todo item aponta para uma âncora que a página oferece', () => {
    for (const item of menu) {
      expect(item.href.startsWith('#'), `${item.rotulo}: href não é âncora`).toBe(true)
      expect(ancoras, `${item.rotulo} aponta para ${item.href}, que não existe`).toContain(
        item.href.slice(1),
      )
    }
  })

  it('nenhum rótulo é vazio', () => {
    for (const item of menu) {
      expect(item.rotulo.trim()).not.toBe('')
    }
  })

  it('a capa não entra no menu — o logo já leva ao topo', () => {
    expect(menu.map((item) => item.href)).not.toContain('#capa')
  })

  it('há exatamente um item por seção que pede menu, mais o contato', () => {
    /* A contagem existe porque os outros cenários passariam com o menu **incompleto**: apontar só para
       âncoras válidas é condição necessária e não suficiente. Uma seção que sumisse do menu não quebraria
       nada — e é assim que ela sumiria em silêncio. */
    const pedemMenu = SECOES.filter((secao) => secao.rotuloNoMenu !== null)

    expect(menu).toHaveLength(pedemMenu.length + 1)

    for (const secao of pedemMenu) {
      expect(menu, `${secao.id} pede menu e não está nele`).toContainEqual({
        href: `#${secao.id}`,
        rotulo: secao.rotuloNoMenu,
      })
    }
  })

  it('o contato é o último item', () => {
    expect(menu.at(-1)?.href).toBe(`#${ID_DO_RODAPE}`)
  })

  it('não há item repetido', () => {
    const hrefs = menu.map((item) => item.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
