// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

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
export default defineConfig({
  /* Sem servidor: o build é um diretório de arquivos, servível de qualquer lugar. */
  output: 'static',
  integrations: [react()],
  vite: {
    /* Os pacotes do monorepo chegam como TypeScript-fonte por symlink de workspace. Sem isso o Vite tentaria
       tratá-los como dependência pré-compilada e não acharia o `.js` que o `exports` promete. */
    ssr: { noExternal: ['@naveg/design-system', '@naveg/domain', '@naveg/dados', '@naveg/ui'] },
  },
})
