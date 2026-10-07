/**
 * **O que o site diz aos buscadores** (passo 13.3): o `sitemap.xml` e o `robots.txt`.
 *
 * Os dois saem de `pages/sitemap.xml.ts` e `pages/robots.txt.ts`, gerados no build como arquivos estáticos. O
 * texto mora aqui, em funções puras, para o cenário (`test/meta.spec.ts`) ler sem build.
 *
 * ### O que entra no mapa
 *
 * Só página que se quer achar pela busca. O quiosque (`/totem`) fica fora: ele existe para o terminal do
 * saguão e leva `noindex`. As páginas da conta e dos pedidos (`/conta`, `/pedidos`, da venda online) também
 * vão ficar fora, com `noindex` — são de cada cliente, e não há o que achar nelas. As legais (`/privacidade`,
 * da 13.4, e as da compra) entram.
 *
 * A lista não confia em memória: o `conferir:build` lê o `dist/` e exige que **toda página sem `noindex` esteja
 * aqui, e toda daqui esteja no ar sem `noindex`**. Uma página nova que se esqueça desta lista é build vermelho.
 */

/** Os caminhos do mapa, com a barra final que o Astro dá a cada página. */
export const PAGINAS_DO_MAPA: readonly string[] = ['/']

export function sitemap(origem: string, caminhos: readonly string[] = PAGINAS_DO_MAPA): string {
  const urls = caminhos.map((caminho) => `  <url><loc>${new URL(caminho, origem).href}</loc></url>`)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/**
 * **Nada é proibido, e é de propósito.** O que não deve aparecer na busca leva `noindex` na própria página — e o
 * buscador só lê o `noindex` de uma página que ele pode visitar. Um `Disallow` no `/totem` faria o contrário do
 * que parece: o endereço poderia aparecer na busca, sem descrição, achado por um link de fora.
 */
export function robots(origem: string): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('/sitemap.xml', origem).href}`, ''].join('\n')
}
