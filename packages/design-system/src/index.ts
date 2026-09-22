/**
 * **`@naveg/design-system`** — os primitivos visuais da agência virtual da NAVEG.
 *
 * O pacote tem duas metades, e a divisão é intencional:
 *
 * - **CSS** (`tokens.css`, `base.css`), consumido por subcaminho. São folhas, não módulos: quem as importa é a
 *   página, e o bundler as trata como asset;
 * - **TypeScript** (este ponto de entrada). É a parte que **decide** alguma coisa — qual desenho um slug tem.
 *   Tudo aqui é dado ou função pura.
 *
 * ### A regra estrutural
 *
 * Este pacote **não conhece o domínio**, e a `package.json` não o lista em dependências. A invariante é a mesma
 * que o domínio tem em relação a framework, apontada na outra direção.
 */

export * from './icones.js'
export * from './marca.js'
