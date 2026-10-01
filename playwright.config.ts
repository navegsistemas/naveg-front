import { defineConfig, devices } from '@playwright/test'

import { URL_DA_API_FALSA } from './e2e/api-falsa'

/**
 * **O E2E** — o totem num navegador de verdade, sobre o build estático que vai ao ar.
 *
 * O site é construído no **modo que envia** (o mesmo da homologação): a URL da API e a chave pública **de teste**
 * do Turnstile, a que sempre passa. A diferença é a URL: ela aponta para um endereço onde nada escuta, e a API é
 * respondida pelo próprio teste (`e2e/api-falsa.ts`). O Turnstile é o de verdade — o script carrega da
 * Cloudflare —, então o E2E precisa de rede para `challenges.cloudflare.com`.
 *
 * Chromium e WebKit, cada um no desktop e no celular: o WebKit é o Safari do iPhone, que é por onde boa parte de
 * quem reserva vai chegar.
 */
const PORTA = 4321

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-celular', use: { ...devices['Pixel 7'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-celular', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview --workspace=@navegsistemas/agencia -- --port ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    /* Nunca reaproveita: um `astro dev` aberto na porta seria outro build, com outra API. */
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PUBLIC_URL_DA_API: URL_DA_API_FALSA,
      PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    },
  },
})
