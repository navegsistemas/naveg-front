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
    include: ['packages/*/test/**/*.spec.ts', 'apps/*/test/**/*.spec.{ts,tsx}'],
    environment: 'node',
  },
})
