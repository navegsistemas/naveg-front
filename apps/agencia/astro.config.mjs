// @ts-check
import { defineConfig } from 'astro/config'

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
 * ### Por que a integração do React ainda não está aqui
 *
 * Porque nada a usa. A ilha do totem é o passo 8, e declarar a integração agora acrescentaria uma dependência
 * que o build não exercita — o mesmo raciocínio que o manifesto do app KMP aplica às permissões: *declarada sem
 * uso, é custo cobrado por nada*. Ela entra junto com a funcionalidade que a justifica, e o orçamento de 0 kB de
 * JavaScript desta fase deixa de ser uma promessa e passa a ser o que o `dist/` mede.
 */
export default defineConfig({
  /* Sem servidor: o build é um diretório de arquivos, servível de qualquer lugar. */
  output: 'static',
  vite: {
    /* Os pacotes do monorepo chegam como TypeScript-fonte por symlink de workspace. Sem isso o Vite tentaria
       tratá-los como dependência pré-compilada e não acharia o `.js` que o `exports` promete. */
    ssr: { noExternal: ['@naveg/design-system'] },
  },
})
