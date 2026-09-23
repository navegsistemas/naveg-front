/**
 * **A ilha** — o que a página monta com `client:visible` (ou `client:load`, no quiosque).
 *
 * Propriedades de ilha atravessam do servidor para o navegador serializadas, então só entra aqui o que é dado:
 * o modo. As dependências — a fonte do catálogo e o repositório — são construídas **aqui dentro**, e é o único
 * lugar que muda nos passos 9 e 10. O `Totem` não percebe.
 *
 * - **O catálogo** (passo 9): com `PUBLIC_URL_DA_API` definida, vem da API da agência; sem ela, é o catálogo de
 *   demonstração, que se anuncia como tal. É o que mantém `npm run dev` rodável sem credencial nenhuma. A
 *   variável é pública de propósito: é um endereço, não um segredo.
 * - **A reserva** (passo 10): ainda em memória. Por isso, mesmo com a API, a faixa continua dizendo que nada é
 *   enviado ao atendimento.
 */
import { useMemo } from 'react'

import { catalogoFixo, catalogoHttp, ReservaEmMemoria } from '@navegsistemas/dados'
import '@navegsistemas/ui/totem.css'

import { CATALOGO_DE_DEMONSTRACAO } from '../conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO, INATIVIDADE_DO_QUIOSQUE_MS } from '../conteudo/operacao'
import { Totem } from './Totem'

export interface PropsDaIlha {
  readonly modo: 'pagina' | 'quiosque'
}

/** A raiz da API, ou `null` quando não configurada. Em branco conta como ausente. */
const URL_DA_API: string | null = import.meta.env.PUBLIC_URL_DA_API?.trim() || null

export default function TotemDaAgencia({ modo }: PropsDaIlha) {
  const fonte = useMemo(
    () => (URL_DA_API === null ? catalogoFixo(CATALOGO_DE_DEMONSTRACAO) : catalogoHttp(URL_DA_API)),
    [],
  )
  const repositorio = useMemo(() => new ReservaEmMemoria(), [])
  const quiosque = modo === 'quiosque'

  return (
    <Totem
      fonte={fonte}
      repositorio={repositorio}
      fuso={FUSO_DA_OPERACAO}
      inatividadeMs={quiosque ? INATIVIDADE_DO_QUIOSQUE_MS : null}
      demonstracao={URL_DA_API === null ? 'SAIDAS_E_ENVIO' : 'ENVIO'}
      quiosque={quiosque}
    />
  )
}
