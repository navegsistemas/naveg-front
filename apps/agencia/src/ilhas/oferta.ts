/**
 * **As saídas ofertadas agora** — o que o totem de passagem e a seção de encomenda dividem.
 *
 * Carrega o catálogo uma vez, lê o relógio a cada minuto (uma saída pode partir com a tela aberta) e deriva a
 * oferta de `travessiasOfertadas`. Toda saída ofertada aceita encomenda (C7), então as duas ilhas mostram a
 * mesma lista.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import { InstanteLocal, travessiasOfertadas, type CatalogoDoFluviapp, type TravessiaOfertada } from '@navegsistemas/domain'
import type { FonteDoCatalogo } from '@navegsistemas/dados'

export interface Oferta {
  /** O relógio no fuso da operação, lido agora — é o `criadoEm` do envio. */
  readonly lerAgora: () => InstanteLocal
  /** O último minuto lido. É com ele que a oferta e a prévia da conferência são calculadas. */
  readonly agora: InstanteLocal
  readonly catalogo: CatalogoDoFluviapp | null
  readonly catalogoFalhou: boolean
  readonly oferta: readonly TravessiaOfertada[]
}

export function useOferta(fonte: FonteDoCatalogo, fuso: string, relogio: () => Date): Oferta {
  const lerAgora = useCallback(() => InstanteLocal.emFuso(relogio(), fuso), [relogio, fuso])

  const [catalogo, setCatalogo] = useState<CatalogoDoFluviapp | null>(null)
  const [catalogoFalhou, setCatalogoFalhou] = useState(false)
  const [agora, setAgora] = useState(lerAgora)

  // --- o catálogo, uma vez ---
  useEffect(() => {
    let vivo = true
    fonte.carregar().then(
      (lido) => vivo && setCatalogo(lido),
      () => vivo && setCatalogoFalhou(true),
    )
    return () => {
      vivo = false
    }
  }, [fonte])

  // --- o relógio, a cada minuto: uma saída pode partir com a tela aberta ---
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(lerAgora()), 60_000)
    return () => clearInterval(intervalo)
  }, [lerAgora])

  const oferta = useMemo(() => (catalogo === null ? [] : travessiasOfertadas(catalogo, agora)), [catalogo, agora])

  return { lerAgora, agora, catalogo, catalogoFalhou, oferta }
}
