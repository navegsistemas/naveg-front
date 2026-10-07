/**
 * **As páginas do site**, para os cenários que valem em toda página (`acessibilidade.e2e.ts`): o axe, o teclado
 * e o sem-JavaScript. Uma página nova entra no CI **só por estar aqui** — a `/privacidade` da 13.4, e as da
 * compra, cada uma no dia em que existir.
 */
export interface Rota {
  readonly caminho: string
  /**
   * Quantas ilhas a página tem. Sem JavaScript, cada uma vira um aviso com o WhatsApp
   * (`componentes/SemJavaScript.astro`); uma página sem ilha não tem aviso nenhum, e se lê inteira sem script.
   */
  readonly ilhas: number
}

export const ROTAS: readonly Rota[] = [
  { caminho: '/', ilhas: 2 },
  { caminho: '/totem/', ilhas: 1 },
  { caminho: '/privacidade/', ilhas: 0 },
]
