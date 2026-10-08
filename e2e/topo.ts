/**
 * **O menu do topo, como quem usa a página o alcança.** Nas telas estreitas os itens moram dentro do menu
 * recolhido (1.1 do roteiro de UI/UX): quem quer ir a uma seção pelo topo abre o menu antes. Nas largas, o item
 * está à vista. O cenário não precisa saber em qual das duas está.
 */
import type { Locator, Page } from '@playwright/test'

/** O botão do menu recolhido — o `<summary>`, que se anuncia como "Menu". */
export const botaoDoMenu = (page: Page): Locator => page.getByRole('banner').locator('summary')

/** A navegação do topo que está à vista agora (a outra está em `display: none`). */
export const menuDoTopo = (page: Page): Locator => page.getByRole('navigation', { name: 'Seções da página' })

export async function irPeloMenu(page: Page, item: string) {
  if (await botaoDoMenu(page).isVisible()) await botaoDoMenu(page).click()
  await menuDoTopo(page).getByRole('link', { name: item }).click()
}
