/**
 * **As saídas ofertadas agora** — o que o totem de passagem e a seção de encomenda dividem.
 *
 * Carrega o catálogo uma vez, lê o relógio a cada minuto (uma saída pode partir com a tela aberta) e deriva a
 * oferta de `travessiasOfertadas`. Toda saída ofertada aceita encomenda (C7); o que muda entre as ilhas é o
 * alcance (fluviapp-kmp#44): a passagem na página vai a 90 dias, a encomenda e o quiosque ficam na semana.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  DIAS_DA_JANELA,
  InstanteLocal,
  travessiasOfertadas,
  type CatalogoDoFluviapp,
  type TravessiaOfertada,
} from '@navegsistemas/domain'
import type { FonteDoCatalogo } from '@navegsistemas/dados'

export interface Oferta {
  /** O relógio no fuso da operação, lido agora — é o `criadoEm` do envio. */
  readonly lerAgora: () => InstanteLocal
  /** O último minuto lido. É com ele que a oferta e a prévia da conferência são calculadas. */
  readonly agora: InstanteLocal
  readonly catalogo: CatalogoDoFluviapp | null
  readonly catalogoFalhou: boolean
  readonly oferta: readonly TravessiaOfertada[]
  /** Carrega o catálogo de novo, depois de uma falha (2.6, C). O que foi escolhido fica: é estado de quem chama. */
  readonly recarregar: () => void
}

/** `dias`: o alcance do que se reserva — `alcanceEmDias(categoria)`, ou a semana. */
export function useOferta(fonte: FonteDoCatalogo, fuso: string, relogio: () => Date, dias = DIAS_DA_JANELA): Oferta {
  const lerAgora = useCallback(() => InstanteLocal.emFuso(relogio(), fuso), [relogio, fuso])

  const [catalogo, setCatalogo] = useState<CatalogoDoFluviapp | null>(null)
  const [catalogoFalhou, setCatalogoFalhou] = useState(false)
  const [agora, setAgora] = useState(lerAgora)
  const [tentativa, setTentativa] = useState(0)
  const recarregar = useCallback(() => {
    setCatalogoFalhou(false)
    setTentativa((n) => n + 1)
  }, [])

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
  }, [fonte, tentativa])

  // --- o relógio, a cada minuto: uma saída pode partir com a tela aberta ---
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(lerAgora()), 60_000)
    return () => clearInterval(intervalo)
  }, [lerAgora])

  const oferta = useMemo(
    () => (catalogo === null ? [] : travessiasOfertadas(catalogo, agora, dias)),
    [catalogo, agora, dias],
  )

  return { lerAgora, agora, catalogo, catalogoFalhou, oferta, recarregar }
}
