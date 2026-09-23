/**
 * **A ilha** — o que a página monta com `client:visible` (ou `client:load`, no quiosque).
 *
 * Propriedades de ilha atravessam do servidor para o navegador serializadas, então só entra aqui o que é dado:
 * o modo. As dependências — a fonte do catálogo e o repositório — são construídas **aqui dentro**, e é o único
 * lugar que muda nos passos 9 e 10. O `Totem` não percebe.
 *
 * - **O catálogo**: da API da agência, por padrão; o de demonstração só quando pedido
 *   (`PUBLIC_URL_DA_API=demonstracao`). A regra está em `conteudo/api.ts`.
 * - **A reserva** (passo 10): ainda em memória. Por isso, mesmo com a API, a faixa continua dizendo que nada é
 *   enviado ao atendimento.
 */
import { useMemo } from 'react'

import { catalogoFixo, catalogoHttp, ReservaEmMemoria } from '@navegsistemas/dados'
import '@navegsistemas/ui/totem.css'

import { fonteConfigurada } from '../conteudo/api'
import { CATALOGO_DE_DEMONSTRACAO } from '../conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO, INATIVIDADE_DO_QUIOSQUE_MS } from '../conteudo/operacao'
import { Totem } from './Totem'

export interface PropsDaIlha {
  readonly modo: 'pagina' | 'quiosque'
}

/* Lida no build: um valor inválido quebra o build aqui, e não no navegador de quem abre a página. */
const FONTE = fonteConfigurada(import.meta.env.PUBLIC_URL_DA_API)

export default function TotemDaAgencia({ modo }: PropsDaIlha) {
  const fonte = useMemo(
    () => (FONTE.tipo === 'API' ? catalogoHttp(FONTE.url) : catalogoFixo(CATALOGO_DE_DEMONSTRACAO)),
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
      demonstracao={FONTE.tipo === 'API' ? 'ENVIO' : 'SAIDAS_E_ENVIO'}
      quiosque={quiosque}
    />
  )
}
