// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { loadEnv } from 'vite'

import { fonteConfigurada } from './src/conteudo/api'
import { diretivasDoSite } from './src/conteudo/seguranca'

/**
 * **A página é estática por padrão, e viva por exceção.**
 *
 * Capa, atendentes, depoimentos e rodapé são texto: nada ali muda depois do build. Mandar um runtime de
 * componente ao navegador para desenhar um parágrafo paga o custo de um app para entregar um documento — e paga
 * **antes** de o leitor chegar na única coisa que se mexe.
 *
 * O Astro renderiza tudo isso em HTML e não embarca JavaScript nenhum. O React entra só no **totem**, como ilha
 * com `client:visible`: o código da reserva desce quando alguém rola até ela.
 *
 * ### A integração do React entrou com o totem
 *
 * Ela ficou de fora até o passo 8 porque nada a usava — declarada sem uso, é custo cobrado por nada. Agora a
 * ilha existe, e o orçamento muda de "0 kB" para **"0 kB até alguém rolar até o totem"**: o `client:visible`
 * só baixa o código quando a seção entra na tela. O quiosque (`/totem`) usa `client:load`, porque lá o totem
 * **é** a página.
 */
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '')

export default defineConfig({
  /* Sem servidor: o build é um diretório de arquivos, servível de qualquer lugar. */
  output: 'static',
  integrations: [react()],
  /* A política de cada página (`src/conteudo/seguranca.ts`). A origem da API sai da mesma variável que o totem
     lê, então a homologação, o E2E e a produção levam cada um a sua. */
  security: {
    csp: {
      directives: diretivasDoSite(fonteConfigurada(env.PUBLIC_URL_DA_API)),
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'"] },
    },
  },
  /* O site não tem Markdown com código; desligado, o Shiki (que pinta com `style=""`) não briga com a política. */
  markdown: { syntaxHighlight: false },
  vite: {
    /* Os pacotes do monorepo chegam como TypeScript-fonte por symlink de workspace. Sem isso o Vite tentaria
       tratá-los como dependência pré-compilada e não acharia o `.js` que o `exports` promete. */
    ssr: { noExternal: ['@navegsistemas/design-system', '@navegsistemas/domain', '@navegsistemas/dados', '@navegsistemas/ui'] },
  },
})
