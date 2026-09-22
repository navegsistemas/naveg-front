import { defineConfig } from 'vitest/config'

/**
 * Um runner só para o monorepo inteiro.
 *
 * Os cenários moram em `test/` ao lado de cada pacote, e não junto do arquivo que exercitam, pela mesma razão
 * que o `fluviapp` os separa: o `src/` de um pacote é o que ele publica, e um `.spec` publicado junto é peso
 * que o consumidor baixa sem pedir.
 */
export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.spec.{ts,tsx}', 'apps/*/test/**/*.spec.{ts,tsx}'],
    /* Node por padrão; os cenários de tela declaram `// @vitest-environment jsdom` no topo. O domínio não
       precisa de DOM, e não ganhar um é parte de provar que ele não depende de um. */
    environment: 'node',
  },
  /* O JSX automático do React 19 — o mesmo que o tsconfig das ilhas declara. */
  esbuild: { jsx: 'automatic' },
})
