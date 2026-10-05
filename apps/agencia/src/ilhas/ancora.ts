/**
 * **Quem lê mais abaixo não é empurrado quando as saídas chegam.**
 *
 * A ilha começa com "Carregando as saídas…" e cresce muito quando o catálogo chega. Se ela está **acima** de onde a
 * pessoa lê (quem tocou em "Encomendas" e deixou o fim do totem sob o cabeçalho, por exemplo), esse crescimento
 * empurraria a página para baixo. O Chromium compensa sozinho (*scroll anchoring*); o WebKit diz que suporta
 * `overflow-anchor`, mas não compensa — visto no E2E, 2026-10-05.
 *
 * Por isso não se pergunta ao navegador: **mede-se**. No momento em que o catálogo chega, a ilha cresceu `c`, e a
 * página já rolou `s` desde a última rolagem que a pessoa fez — o que o navegador compensou. Falta `c − s`, e só
 * isso é rolado. Só nesse momento, e só se a ilha inteira estava acima do primeiro quarto da tela: quem está lendo a
 * própria ilha a vê crescer no lugar.
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

interface Medida {
  readonly altura: number
  readonly carregado: boolean
}

export function useAncoraNoCarregamento(ref: RefObject<HTMLElement | null>, carregado: boolean): void {
  const anterior = useRef<Medida | null>(null)
  /* A última rolagem vista pelo evento. O ajuste do navegador ainda não disparou o evento no efeito de layout. */
  const rolagemVista = useRef(0)

  useEffect(() => {
    rolagemVista.current = window.scrollY
    const ver = () => {
      rolagemVista.current = window.scrollY
    }
    window.addEventListener('scroll', ver, { passive: true })
    return () => window.removeEventListener('scroll', ver)
  }, [])

  useLayoutEffect(() => {
    const elemento = ref.current
    if (elemento === null) return
    const antes = anterior.current
    let caixa = elemento.getBoundingClientRect()
    if (antes !== null && carregado && !antes.carregado) {
      const crescimento = caixa.height - antes.altura
      const jaCompensado = window.scrollY - rolagemVista.current
      /* Onde o fundo estava na tela antes de crescer: o de agora, menos o crescimento, mais o já compensado. */
      const fundoNaTela = caixa.bottom - crescimento + jaCompensado
      const falta = crescimento - jaCompensado
      if (crescimento > 0 && fundoNaTela <= window.innerHeight / 4 && Math.abs(falta) > 1) {
        window.scrollBy(0, falta)
        caixa = elemento.getBoundingClientRect()
      }
    }
    anterior.current = { altura: caixa.height, carregado }
  })
}
