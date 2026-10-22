/**
 * **As telas que não são passo** — a lista de travessias, o indicador, a conferência e a conclusão.
 *
 * Todas controladas: recebem o que mostrar e devolvem o gesto. Nenhuma lê relógio, catálogo ou repositório.
 */
import { useState, type ReactNode } from 'react'

import type { PendenciaDaReserva, TravessiaOfertada } from '@navegsistemas/domain'

import { chaveDaEmbarcacao, textoDoCartao } from './cartao-da-saida.js'
import type { FotoDoCartao } from './OQueVaiEmbarcar.js'
import type { AlvoDoBloco, BlocoDoResumo, LinhaDoResumo } from './resumo.js'
import { TEXTO_DA_PENDENCIA } from './textos.js'

// ---------------------------------------------------------------------------------------------------------

export interface PropsDaLista {
  readonly travessias: readonly TravessiaOfertada[]
  readonly aoEscolher: (travessia: TravessiaOfertada) => void
  /** O botão de cada saída. O padrão é o do totem de passagem. */
  readonly rotuloDaEscolha?: string
  /** As fotos das embarcações, pela `chaveDaEmbarcacao` do nome (decisão C). Sem a foto, o desenho de um barco. */
  readonly fotos?: Readonly<Record<string, FotoDoCartao>>
  /**
   * O dia em cada cartão. Na página, o título "Saídas de …" já o diz (decisão A); a lista sem calendário, a do
   * quiosque, mistura os dias e precisa dele.
   */
  readonly comODia?: boolean
}

/**
 * **As saídas disponíveis**, na ordem da partida — a ordem e o recorte vêm de `travessiasOfertadas`, e a lista
 * só desenha. Vazia, ela diz que não há saída nos próximos dias, em vez de sumir.
 *
 * Cada cartão (UI 2.1, decidida pelo PO em 2026-10-22): a foto da embarcação em faixa, no alto, com o nome sobre ela
 * (C, na alternativa que o PO preferiu ao ver no ar); a data alterada (D); a saída e a chegada em números grandes,
 * com a cidade e a duração (A); o cais de embarque e o de desembarque, menores, antes de escolher (B); e o botão (E).
 */
export function ListaDeTravessias({
  travessias,
  aoEscolher,
  rotuloDaEscolha = 'Reservar esta saída',
  fotos = {},
  comODia = false,
}: PropsDaLista) {
  if (travessias.length === 0) {
    return <p className="totem-vazio">Não há saídas disponíveis nos próximos sete dias.</p>
  }
  return (
    <ul className="totem-travessias" role="list">
      {travessias.map((travessia) => {
        const { rotulos } = travessia
        const texto = textoDoCartao(travessia)
        const foto = fotos[chaveDaEmbarcacao(travessia.embarcacao.nome)]
        return (
          <li key={travessia.id} className="totem-travessia">
            {/* A foto em faixa, no alto, com o nome sobre ela (C, revista pelo PO em 2026-10-22). É decoração: o nome
                vem escrito. Sem foto, uma faixa baixa com o desenho de um barco — nunca a foto de outra embarcação. */}
            <div className={foto !== undefined ? 'totem-travessia__capa' : 'totem-travessia__capa totem-travessia__capa--sem'}>
              {foto !== undefined ? (
                <img
                  className="totem-travessia__foto"
                  src={foto.src}
                  srcSet={foto.srcset}
                  sizes="(min-width: 64rem) 36rem, 100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <svg aria-hidden="true" viewBox="0 0 34 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 15h28l-4 6H7z" />
                  <path d="M8 15V9h16v6" />
                  <path d="M12 9V5h7v4" />
                </svg>
              )}
              <p className="totem-travessia__embarcacao">
                <span className="totem-travessia__barco">{texto.embarcacao}</span>
                <span className="totem-travessia__tipo"> · {texto.tipo}</span>
              </p>
            </div>
            <div className="totem-travessia__corpo">
              {rotulos.alteracao !== null && <p className="totem-travessia__alterada">{rotulos.alteracao}</p>}
              <div className="totem-travessia__horario">
                <p className="totem-travessia__ponta">
                  <span className="totem-travessia__rotulo">Saída</span>
                  <span className="totem-travessia__hora">{texto.saida}</span>
                  <span className="totem-travessia__cidade">{rotulos.origem}</span>
                  {comODia && <span className="totem-travessia__dia">{texto.diaDaSaida}</span>}
                </p>
                <p className="totem-travessia__duracao">
                  <span>
                    <span aria-hidden="true">≈ </span>
                    <span className="apenas-leitor">cerca de </span>
                    {texto.duracao}
                    <span className="apenas-leitor"> de viagem</span>
                  </span>
                </p>
                <p className="totem-travessia__ponta totem-travessia__ponta--chegada">
                  <span className="totem-travessia__rotulo">Chegada prevista</span>
                  <span className="totem-travessia__hora">{texto.chegada}</span>
                  <span className="totem-travessia__cidade">{rotulos.destino}</span>
                  {texto.diaDaChegada !== null && <span className="totem-travessia__dia">{texto.diaDaChegada}</span>}
                </p>
              </div>
              <div className="totem-travessia__rodape">
                <dl className="totem-travessia__cais">
                  <dt>Embarque</dt>
                  <dd>{rotulos.embarque}</dd>
                  <dt>Desembarque</dt>
                  <dd>{rotulos.desembarque}</dd>
                </dl>
                <button type="button" className="acao" onClick={() => aoEscolher(travessia)}>
                  {rotuloDaEscolha}
                </button>
              </div>
            </div>
          </li>
        )
      })}
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
  /**
   * Na página, a conferência em blocos (2.4, A), cada um com o "Mudar" que leva ao passo dele (B). Sem eles, as
   * linhas — o quiosque não muda.
   */
  readonly blocos?: readonly BlocoDoResumo[]
  readonly aoMudar?: (alvo: AlvoDoBloco) => void
  /** O que acontece ao confirmar, embaixo do botão (2.4, D). */
  readonly nota?: ReactNode
  /**
   * O envio que falhou (2.6, A): a frase num quadro de aviso, logo acima do botão — que então diz "Tentar de novo". O
   * que vem depois dele (a saída pelo WhatsApp, na página) é da tela.
   */
  readonly erro?: string
  readonly depoisDoBotao?: ReactNode
  /** Uma pendência com texto próprio desta reserva: a saída fechada da encomenda (2.6, D). */
  readonly textoDaPendencia?: Partial<Record<PendenciaDaReserva, string>>
  /**
   * A verificação contra robô (2.8, PO, 2026-10-21): um passo visível, logo acima do botão. Com `verificada` falso, o
   * botão espera e diz "Verificando…" — diz por quê, e por isso pode ficar desativado. Sem ela (a demonstração), nada.
   */
  readonly verificacao?: { readonly elemento: ReactNode; readonly verificada: boolean }
}

/** O rótulo do "Mudar" de cada bloco: a saída se troca; o resto se muda. */
const ROTULO_DO_MUDAR: Readonly<Record<AlvoDoBloco, string>> = {
  EMBARQUE: 'Mudar',
  SAIDA: 'Trocar',
  CLIENTE: 'Mudar',
  DESTINATARIO: 'Mudar',
}

/** Os blocos da reserva — na conferência, com o "Mudar"; na conclusão, sem ele. */
export function BlocosDoResumo({
  blocos,
  aoMudar,
}: {
  readonly blocos: readonly BlocoDoResumo[]
  readonly aoMudar?: (alvo: AlvoDoBloco) => void
}) {
  return (
    <div className="totem-blocos">
      {blocos.map((bloco) => (
        <section key={bloco.alvo} className="totem-bloco" aria-label={bloco.titulo}>
          <div className="totem-bloco__cabeca">
            <h4 className="totem-bloco__titulo">{bloco.titulo}</h4>
            {aoMudar !== undefined && (
              <button
                type="button"
                className="totem-saida__trocar"
                aria-label={`${ROTULO_DO_MUDAR[bloco.alvo]}: ${bloco.titulo.toLowerCase()}`}
                onClick={() => aoMudar(bloco.alvo)}
              >
                {ROTULO_DO_MUDAR[bloco.alvo]}
              </button>
            )}
          </div>
          {bloco.linhas.map((linha) => (
            <p key={linha.texto} className={`totem-bloco__linha totem-bloco__linha--${linha.peso}`}>
              {linha.texto}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
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
  blocos,
  aoMudar,
  nota,
  erro,
  depoisDoBotao,
  textoDaPendencia,
  verificacao,
}: PropsDaConferencia) {
  const aVerificar = verificacao !== undefined && !verificacao.verificada
  return (
    <div className="totem-conferencia">
      {blocos !== undefined ? (
        <BlocosDoResumo blocos={blocos} {...(aoMudar !== undefined ? { aoMudar } : {})} />
      ) : (
        <dl className="totem-resumo">
          {linhas.map((linha) => (
            <div key={linha.rotulo} className="totem-resumo__linha">
              <dt>{linha.rotulo}</dt>
              <dd>{linha.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {pendencias.length > 0 ? (
        <ul className="totem-pendencias" role="alert">
          {pendencias.map((pendencia) => (
            <li key={pendencia}>{textoDaPendencia?.[pendencia] ?? TEXTO_DA_PENDENCIA[pendencia]}</li>
          ))}
        </ul>
      ) : (
        <>
          {verificacao?.elemento}
          {erro !== undefined && (
            <p className="totem-aviso totem-erro-do-envio" role="alert">
              {erro}
            </p>
          )}
          <button type="button" className="acao totem-continuar" onClick={aoConfirmar} disabled={enviando || aVerificar}>
            {enviando ? 'Enviando…' : aVerificar ? 'Verificando…' : erro !== undefined ? 'Tentar de novo' : rotuloDoConfirmar}
          </button>
          {depoisDoBotao}
          {nota !== undefined && erro === undefined && <p className="totem-ajuda totem-nota">{nota}</p>}
        </>
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
  /**
   * Na página (2.4, E, PO, 2026-10-16): o "Copiar" ao lado do código, sem a frase, e a reserva em blocos, sem o
   * "Mudar". O quiosque segue com a frase, o botão embaixo e as linhas.
   */
  readonly blocos?: readonly BlocoDoResumo[]
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
  blocos,
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

  const botaoDeCopiar = (
    <button type="button" className="acao acao--secundaria" onClick={copiar}>
      {copiado ? 'Código copiado' : blocos !== undefined ? 'Copiar' : 'Copiar código'}
    </button>
  )

  /* Na página (2.4, E): o código com o "Copiar" ao lado, e logo o passo que falta; a reserva em blocos, embaixo. */
  if (blocos !== undefined) {
    return (
      <div className="totem-conclusao">
        <div className="totem-codigo-e-copiar">
          <p className="totem-codigo">{codigo}</p>
          {botaoDeCopiar}
        </div>
        {atendimento}
        <BlocosDoResumo blocos={blocos} />
        <button type="button" className="acao acao--secundaria" onClick={aoRecomecar}>
          {rotuloDoRecomecar}
        </button>
      </div>
    )
  }

  return (
    <div className="totem-conclusao">
      <p>{registrada}</p>
      <p className="totem-codigo">
        {codigo}
      </p>
      {botaoDeCopiar}
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
