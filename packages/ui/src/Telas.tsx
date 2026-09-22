/**
 * **As telas que não são passo** — a lista de travessias, o indicador, a conferência e a conclusão.
 *
 * Todas controladas: recebem o que mostrar e devolvem o gesto. Nenhuma lê relógio, catálogo ou repositório.
 */
import { useState, type ReactNode } from 'react'

import type { PendenciaDaReserva, TravessiaOfertada } from '@naveg/domain'

import type { LinhaDoResumo } from './resumo.js'
import { TEXTO_DA_PENDENCIA } from './textos.js'

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaLista {
  readonly travessias: readonly TravessiaOfertada[]
  readonly aoEscolher: (travessia: TravessiaOfertada) => void
}

/**
 * **As saídas disponíveis**, na ordem da partida — a ordem e o recorte vêm de `travessiasOfertadas`, e a lista
 * só desenha. Vazia, ela diz que não há saída nos próximos dias, em vez de sumir.
 */
export function ListaDeTravessias({ travessias, aoEscolher }: PropsDaLista) {
  if (travessias.length === 0) {
    return <p className="totem-vazio">Não há saídas disponíveis nos próximos sete dias.</p>
  }
  return (
    <ul className="totem-travessias" role="list">
      {travessias.map((travessia) => (
        <li key={travessia.id} className="totem-travessia">
          <p className="totem-travessia__trecho">
            {travessia.rotulos.origem} <span aria-hidden="true">→</span>
            <span className="apenas-leitor"> para </span> {travessia.rotulos.destino}
          </p>
          <p className="totem-travessia__quando">
            <span>Saída: {travessia.rotulos.partida}</span>
            <span>Chegada prevista: {travessia.rotulos.chegada}</span>
          </p>
          <p className="totem-travessia__embarcacao">{travessia.rotulos.embarcacao}</p>
          <button type="button" className="acao" onClick={() => aoEscolher(travessia)}>
            Reservar esta saída
          </button>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------------------

/** "Passo 3 de 6" — o total **cresce** conforme o caminho se revela, e isso é o comportamento certo. */
export function IndicadorDePasso({ posicao, total }: { readonly posicao: number; readonly total: number }) {
  return (
    <p className="totem-indicador">
      Passo {posicao} de {total}
    </p>
  )
}

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaConferencia {
  readonly linhas: readonly LinhaDoResumo[]
  readonly pendencias: readonly PendenciaDaReserva[]
  readonly enviando: boolean
  readonly aoConfirmar: () => void
}

/**
 * **Conferir antes de enviar.** Se o domínio achou pendência, ela aparece aqui e o botão de confirmar some —
 * não fica desabilitado: um botão cinza que não diz por quê é a forma mais comum de alguém desistir.
 */
export function Conferencia({ linhas, pendencias, enviando, aoConfirmar }: PropsDaConferencia) {
  return (
    <div className="totem-conferencia">
      <dl className="totem-resumo">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="totem-resumo__linha">
            <dt>{linha.rotulo}</dt>
            <dd>{linha.valor}</dd>
          </div>
        ))}
      </dl>
      {pendencias.length > 0 ? (
        <ul className="totem-pendencias" role="alert">
          {pendencias.map((pendencia) => (
            <li key={pendencia}>{TEXTO_DA_PENDENCIA[pendencia]}</li>
          ))}
        </ul>
      ) : (
        <button type="button" className="acao totem-continuar" onClick={aoConfirmar} disabled={enviando}>
          {enviando ? 'Enviando…' : 'Confirmar reserva'}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaConclusao {
  readonly codigo: string
  readonly linhas: readonly LinhaDoResumo[]
  readonly aoRecomecar: () => void
  /** O que leva ao atendimento — o botão do WhatsApp entra no passo 11. */
  readonly atendimento?: ReactNode
}

/**
 * **A reserva feita.** O código em destaque, copiável, e **em texto** — o redirecionamento pode falhar, e a
 * pessoa não pode sair de mãos vazias.
 */
export function ReservaConcluida({ codigo, linhas, aoRecomecar, atendimento }: PropsDaConclusao) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
    } catch {
      /* Sem permissão de área de transferência: o código continua na tela, que é o que importa. */
    }
  }

  return (
    <div className="totem-conclusao">
      <p>Reserva registrada. Guarde este código:</p>
      <p className="totem-codigo">
        {codigo}
      </p>
      <button type="button" className="acao acao--secundaria" onClick={copiar}>
        {copiado ? 'Código copiado' : 'Copiar código'}
      </button>
      {atendimento}
      <dl className="totem-resumo">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="totem-resumo__linha">
            <dt>{linha.rotulo}</dt>
            <dd>{linha.valor}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="acao acao--secundaria" onClick={aoRecomecar}>
        Fazer outra reserva
      </button>
    </div>
  )
}
