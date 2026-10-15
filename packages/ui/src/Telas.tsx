/**
 * **As telas que não são passo** — a lista de travessias, o indicador, a conferência e a conclusão.
 *
 * Todas controladas: recebem o que mostrar e devolvem o gesto. Nenhuma lê relógio, catálogo ou repositório.
 */
import { useState, type ReactNode } from 'react'

import type { PendenciaDaReserva, TravessiaOfertada } from '@navegsistemas/domain'

import type { LinhaDoResumo } from './resumo.js'
import { TEXTO_DA_PENDENCIA } from './textos.js'

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaLista {
  readonly travessias: readonly TravessiaOfertada[]
  readonly aoEscolher: (travessia: TravessiaOfertada) => void
  /** O botão de cada saída. O padrão é o do totem de passagem. */
  readonly rotuloDaEscolha?: string
}

/**
 * **As saídas disponíveis**, na ordem da partida — a ordem e o recorte vêm de `travessiasOfertadas`, e a lista
 * só desenha. Vazia, ela diz que não há saída nos próximos dias, em vez de sumir.
 */
export function ListaDeTravessias({ travessias, aoEscolher, rotuloDaEscolha = 'Reservar esta saída' }: PropsDaLista) {
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
            {rotuloDaEscolha}
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

/**
 * As etapas da reserva na página, pelo nome e fixas (UI 2.2, decisão C), na ordem do caminho novo: o que vai embarcar
 * vem antes do dia (naveg-front#66). O quiosque continua com o "Passo n de m".
 */
export const ETAPAS_DA_RESERVA = ['O que vai embarcar', 'Dia e saída', 'Seus dados', 'Conferir'] as const
export type EtapaDaReserva = (typeof ETAPAS_DA_RESERVA)[number]

/**
 * **Onde a pessoa está**, pelo nome: o total não cresce, porque o número de perguntas dentro de "O que vai embarcar"
 * muda com as respostas, e um "Passo 3 de 5" que vira "4 de 6" parece um formulário que não acaba.
 */
export function EtapasDaReserva({ atual }: { readonly atual: EtapaDaReserva }) {
  const posicao = ETAPAS_DA_RESERVA.indexOf(atual)
  return (
    <ol className="totem-etapas" aria-label="Etapas da reserva">
      {ETAPAS_DA_RESERVA.map((etapa, i) => (
        <li
          key={etapa}
          className={i < posicao ? 'totem-etapas__feita' : i === posicao ? 'totem-etapas__atual' : undefined}
          aria-current={i === posicao ? 'step' : undefined}
        >
          {etapa}
          {i < posicao && <span className="apenas-leitor"> (feita)</span>}
        </li>
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaSaidaEscolhida {
  readonly travessia: TravessiaOfertada
  /** Volta à escolha da saída, sem perder as respostas. Ausente, o quadro não oferece a troca. */
  readonly aoTrocar?: (() => void) | undefined
}

/**
 * **A saída escolhida, num quadro só**, igual em todas as fases até a conferência (UI 2.2, decisão A): o dia e a
 * hora, o trecho pelas cidades da rota, o cais de embarque e o de desembarque, e a embarcação. A data alterada avisa
 * aqui mesmo (decisão B), com o cais e a hora já do dia.
 */
export function SaidaEscolhida({ travessia, aoTrocar }: PropsDaSaidaEscolhida) {
  const { rotulos } = travessia
  return (
    <div className="totem-saida">
      <div className="totem-saida__topo">
        <p className="totem-saida__quando">{rotulos.partida}</p>
        {aoTrocar !== undefined && (
          <button type="button" className="totem-saida__trocar" onClick={aoTrocar}>
            Trocar a saída
          </button>
        )}
      </div>
      <p className="totem-saida__trecho">
        {rotulos.origem} <span aria-hidden="true">→</span>
        <span className="apenas-leitor"> para </span> {rotulos.destino}
      </p>
      <p className="totem-saida__detalhe">Embarque: {rotulos.embarque}</p>
      <p className="totem-saida__detalhe">
        Desembarque: {rotulos.desembarque} · {rotulos.embarcacao}
      </p>
      {rotulos.alteracao !== null && <p className="totem-saida__alterada">{rotulos.alteracao}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------

/**
 * **O que vai embarcar, já respondido**, num quadro com "Mudar" (ficha 2.2, segunda proposta, marca 7). Acompanha o
 * calendário e os dados, como o quadro da saída. "Mudar" volta à primeira pergunta.
 */
export function EmbarqueEscolhido({ texto, aoMudar }: { readonly texto: string; readonly aoMudar: () => void }) {
  return (
    <div className="totem-saida totem-embarque">
      <div className="totem-saida__topo">
        <p className="totem-saida__quando">
          <span className="apenas-leitor">Vai embarcar: </span>
          {texto}
        </p>
        <button type="button" className="totem-saida__trocar" onClick={aoMudar}>
          Mudar
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------

/**
 * **Recomeçar, sem o mesmo peso de voltar** (UI 2.2, decisão E): um link discreto que pergunta antes, na própria
 * tela, porque apaga tudo o que foi respondido.
 */
export function RecomecarComConfirmacao({ aoRecomecar }: { readonly aoRecomecar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)
  if (!confirmando) {
    return (
      <button type="button" className="totem-recomecar" onClick={() => setConfirmando(true)}>
        Recomeçar a reserva
      </button>
    )
  }
  return (
    <div className="totem-recomecar__confirmacao" role="group" aria-label="Recomeçar a reserva">
      <p>Apagar as respostas e começar de novo?</p>
      <button type="button" className="acao acao--secundaria" onClick={aoRecomecar}>
        Sim, recomeçar
      </button>
      <button type="button" className="totem-recomecar" onClick={() => setConfirmando(false)}>
        Não, continuar
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaConferencia {
  readonly linhas: readonly LinhaDoResumo[]
  readonly pendencias: readonly PendenciaDaReserva[]
  readonly enviando: boolean
  readonly aoConfirmar: () => void
  /** O botão de confirmar. O padrão é o do totem de passagem. */
  readonly rotuloDoConfirmar?: string
}

/**
 * **Conferir antes de enviar.** Se o domínio achou pendência, ela aparece aqui e o botão de confirmar some —
 * não fica desabilitado: um botão cinza que não diz por quê é a forma mais comum de alguém desistir.
 */
export function Conferencia({
  linhas,
  pendencias,
  enviando,
  aoConfirmar,
  rotuloDoConfirmar = 'Confirmar reserva',
}: PropsDaConferencia) {
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
          {enviando ? 'Enviando…' : rotuloDoConfirmar}
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
  /** O que leva ao atendimento: o botão do WhatsApp com a reserva escrita, ou a orientação sem ele (passo 11). */
  readonly atendimento?: ReactNode
  /** A frase sobre o código, e o botão de recomeçar. Os padrões são os do totem de passagem. */
  readonly registrada?: string
  readonly rotuloDoRecomecar?: string
}

/**
 * **A reserva feita.** O código em destaque, copiável, e **em texto** — o redirecionamento pode falhar, e a
 * pessoa não pode sair de mãos vazias.
 */
export function ReservaConcluida({
  codigo,
  linhas,
  aoRecomecar,
  atendimento,
  registrada = 'Reserva registrada. Guarde este código:',
  rotuloDoRecomecar = 'Fazer outra reserva',
}: PropsDaConclusao) {
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
      <p>{registrada}</p>
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
        {rotuloDoRecomecar}
      </button>
    </div>
  )
}
