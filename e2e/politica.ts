/**
 * **Nenhum cenário passa se a página bateu na própria política** — a `Content-Security-Policy` do passo 13.1
 * (`apps/agencia/src/conteudo/seguranca.ts`), conferida no navegador de verdade.
 *
 * A política barra em silêncio: um script do Turnstile recusado vira "não foi possível enviar agora", e um
 * `<style>` recusado vira uma vitrine parada — nada que um `expect` sobre o texto pegue com certeza. Por isso
 * todo cenário do E2E usa este `test`: ele ouve o `securitypolicyviolation` de cada página aberta e, no fim,
 * falha listando o que foi barrado. O que entra na página nova da compra entra coberto só por existir.
 */
import { expect, test as base } from '@playwright/test'

export { expect }

export const test = base.extend<{ violacoesDaPolitica: string[] }>({
  violacoesDaPolitica: [
    async ({ page }, usar) => {
      const violacoes: string[] = []
      /* `exposeFunction` sobrevive à navegação; o ouvinte entra antes de qualquer script da página. */
      await page.exposeFunction('registrarViolacaoDaPolitica', (texto: string) => violacoes.push(texto))
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (evento) => {
          const registrar = (window as unknown as { registrarViolacaoDaPolitica: (texto: string) => void }).registrarViolacaoDaPolitica
          registrar(`${evento.effectiveDirective} barrou ${evento.blockedURI || '(inline)'} em ${evento.documentURI}`)
        })
      })
      await usar(violacoes)
      expect(violacoes, 'a página bateu na própria Content-Security-Policy').toEqual([])
    },
    { auto: true },
  ],
})
