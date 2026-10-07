/**
 * **O que o site diz aos buscadores** — o mapa e o `robots.txt` (passo 13.3).
 */
import { describe, expect, it } from 'vitest'

import { PAGINAS_DO_MAPA, robots, sitemap } from '../src/conteudo/meta'
import { SITE } from '../src/conteudo/site'

describe('o mapa do site', () => {
  it('lista cada página pelo endereço completo, na origem do site', () => {
    expect(sitemap('https://gruponaveg.com.br', ['/', '/privacidade/'])).toContain(
      '  <url><loc>https://gruponaveg.com.br/</loc></url>\n  <url><loc>https://gruponaveg.com.br/privacidade/</loc></url>',
    )
  })

  it('é um urlset do protocolo de sitemaps', () => {
    const xml = sitemap(SITE.origem)
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  })

  it('deixa o quiosque de fora: ele é do terminal, não da busca', () => {
    expect(PAGINAS_DO_MAPA).toContain('/')
    expect(PAGINAS_DO_MAPA).not.toContain('/totem/')
  })
})

describe('o robots.txt', () => {
  it('não proíbe nada, e aponta para o mapa', () => {
    const texto = robots('https://gruponaveg.com.br')
    expect(texto).not.toMatch(/Disallow: \S/)
    expect(texto).toContain('Sitemap: https://gruponaveg.com.br/sitemap.xml')
  })
})

describe('o endereço do site', () => {
  it('é o domínio da D4, sem www', () => {
    expect(SITE.origem).toBe('https://gruponaveg.com.br')
  })
})
