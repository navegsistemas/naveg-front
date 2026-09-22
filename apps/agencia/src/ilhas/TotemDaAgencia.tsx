/**
 * **A ilha** — o que a página monta com `client:visible` (ou `client:load`, no quiosque).
 *
 * Propriedades de ilha atravessam do servidor para o navegador serializadas, então só entra aqui o que é dado:
 * o modo. As dependências — a fonte do catálogo e o repositório — são construídas **aqui dentro**, e é o único
 * lugar que muda nos passos 9 e 10: o catálogo de demonstração vira o JSON do build, e o repositório em memória
 * vira o do Firestore. O `Totem` não percebe.
 */
import { useMemo } from 'react'

import { catalogoFixo, ReservaEmMemoria } from '@naveg/dados'
import '@naveg/ui/totem.css'

import { CATALOGO_DE_DEMONSTRACAO } from '../conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO, INATIVIDADE_DO_QUIOSQUE_MS } from '../conteudo/operacao'
import { Totem } from './Totem'

export interface PropsDaIlha {
  readonly modo: 'pagina' | 'quiosque'
}

export default function TotemDaAgencia({ modo }: PropsDaIlha) {
  const fonte = useMemo(() => catalogoFixo(CATALOGO_DE_DEMONSTRACAO), [])
  const repositorio = useMemo(() => new ReservaEmMemoria(), [])
  const quiosque = modo === 'quiosque'

  return (
    <Totem
      fonte={fonte}
      repositorio={repositorio}
      fuso={FUSO_DA_OPERACAO}
      inatividadeMs={quiosque ? INATIVIDADE_DO_QUIOSQUE_MS : null}
      demonstracao
      quiosque={quiosque}
    />
  )
}
