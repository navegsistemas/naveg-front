/**
 * **O passo visível da verificação contra robô** (2.8, PO, 2026-10-21), dentro da conferência, logo acima do botão.
 *
 * O quadro é o da Cloudflare: ao abrir a conferência ele começa sozinho e, quase sempre, mostra o visto em um ou dois
 * segundos; às vezes pede um toque. Ele sai da tela com a conferência. Quando não resolve, a frase diz por quê, e
 * "Verificar de novo" desenha outro.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react'

import { TEXTO_DA_VERIFICACAO } from '@navegsistemas/ui'

import type { EstadoDaVerificacao, VerificacaoContraRobo } from './turnstile'

/** O estado da verificação, para a tela: muda o botão e a frase. */
export function useEstadoDaVerificacao(verificacao: VerificacaoContraRobo | null): EstadoDaVerificacao | null {
  return useSyncExternalStore(
    (aoMudar) => verificacao?.ouvir(aoMudar) ?? (() => undefined),
    () => verificacao?.estado() ?? null,
    () => null,
  )
}

export function PassoDaVerificacao({
  verificacao,
  estado,
}: {
  readonly verificacao: VerificacaoContraRobo
  readonly estado: EstadoDaVerificacao
}) {
  const alvo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (alvo.current === null) return undefined
    return verificacao.montar(alvo.current)
  }, [verificacao])

  const falha = estado === 'SEM_CONEXAO' ? TEXTO_DA_VERIFICACAO.semConexao : estado === 'FALHOU' ? TEXTO_DA_VERIFICACAO.falhou : null

  return (
    <div className="totem-verificacao">
      <p className="totem-verificacao__titulo">{TEXTO_DA_VERIFICACAO.titulo}</p>
      <div ref={alvo} className="totem-verificacao__quadro" />
      {falha !== null && (
        <div className="totem-aviso totem-verificacao__falha" role="alert">
          <p>{falha}</p>
          <button type="button" className="acao acao--secundaria" onClick={() => verificacao.tentarDeNovo()}>
            {TEXTO_DA_VERIFICACAO.tentarDeNovo}
          </button>
        </div>
      )}
    </div>
  )
}
