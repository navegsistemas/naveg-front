/**
 * **A seção "Envie sua encomenda"** — o totem da encomenda, com o mesmo jeito do de passagem
 * (`docs/plano-da-reserva-de-encomenda.md`).
 *
 * Guarda três coisas: a saída escolhida, as `RespostasDaEncomenda` e o estado do envio. O resto é derivado: as
 * saídas de `useOferta` (as mesmas do totem — toda saída aceita encomenda, C7), o passo em foco de
 * `roteiroDaEncomenda`, o "voltar" de `voltarNaEncomenda`, a conferência de `montarEncomenda`.
 *
 * Não há quiosque aqui (C9): no saguão quem chega quer passagem, e a ilha só existe na página.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import {
  linkDaEncomenda,
  montarEncomenda,
  roteiroDaEncomenda,
  voltarNaEncomenda,
  type PendenciaDaReserva,
  type ReservaDeEncomenda,
  type RespostasDaEncomenda,
  type TravessiaOfertada,
} from '@navegsistemas/domain'
import type { EnvioDaEncomenda, FonteDoCatalogo } from '@navegsistemas/dados'
import {
  AJUDA_DO_REMETENTE,
  AVISO_ENCOMENDA_NAO_VENDA,
  Conferencia,
  IndicadorDePasso,
  ListaDeTravessias,
  PassoDaEncomenda,
  ReservaConcluida,
  TEXTO_DO_PASSO_DA_ENCOMENDA,
  resumoDaEncomenda,
} from '@navegsistemas/ui'

import { useAncoraNoCarregamento } from './ancora'
import { useOferta } from './oferta'
import type { Demonstracao } from './Totem'

export interface PropsDaEncomenda {
  readonly fonte: FonteDoCatalogo
  /** Para onde a reserva de encomenda vai: a API, ou — na demonstração e nos cenários — a memória. */
  readonly envio: EnvioDaEncomenda
  readonly fuso: string
  /** O que ainda não é de verdade, como no totem — ver `PropsDoTotem.demonstracao`. */
  readonly demonstracao: Demonstracao | null
  /** O WhatsApp do atendimento, como se escreve. `null`: a conclusão orienta a informar o código. */
  readonly atendimento?: string | null
  readonly relogio?: () => Date
}

type Envio =
  | { readonly estado: 'OCIOSO' }
  | { readonly estado: 'ENVIANDO' }
  | { readonly estado: 'ENVIADA'; readonly reserva: ReservaDeEncomenda; readonly travessia: TravessiaOfertada }
  | { readonly estado: 'RECUSADA'; readonly pendencias: readonly PendenciaDaReserva[] }
  | { readonly estado: 'FALHA' }

const OCIOSO: Envio = { estado: 'OCIOSO' }

/** O código provisório da prévia. É um código válido — só nunca é gravado. */
const CODIGO_DA_PREVIA = 'NVG-000000'

const relogioDoSistema = () => new Date()

export function Encomenda({
  fonte,
  envio: envioDaEncomenda,
  fuso,
  demonstracao,
  atendimento = null,
  relogio = relogioDoSistema,
}: PropsDaEncomenda) {
  const { lerAgora, agora, catalogo, catalogoFalhou, oferta } = useOferta(fonte, fuso, relogio)
  /* Guardada inteira, como no totem: se partir com a tela aberta, a conferência ainda precisa dela. */
  const [travessia, setTravessia] = useState<TravessiaOfertada | null>(null)
  const [respostas, setRespostas] = useState<RespostasDaEncomenda>({})
  const [envio, setEnvio] = useState<Envio>(OCIOSO)

  const raiz = useRef<HTMLDivElement>(null)
  useAncoraNoCarregamento(raiz, catalogo !== null)

  const titulo = useRef<HTMLHeadingElement>(null)
  /* Só se move o foco depois que a pessoa começou: roubá-lo no carregamento arrastaria a página até a seção. */
  const interagiu = useRef(false)

  const recomecar = useCallback(() => {
    interagiu.current = true
    setTravessia(null)
    setRespostas({})
    setEnvio(OCIOSO)
  }, [])

  const roteiro = travessia === null ? null : roteiroDaEncomenda(respostas)
  const atual = roteiro?.atual ?? null

  const chaveDaTela =
    envio.estado === 'ENVIADA' ? 'concluida' : travessia === null ? 'lista' : `${travessia.id}:${atual?.passo ?? ''}`

  useEffect(() => {
    if (interagiu.current) titulo.current?.focus()
  }, [chaveDaTela])

  function responder(novas: RespostasDaEncomenda) {
    interagiu.current = true
    setEnvio(OCIOSO)
    setRespostas(novas)
  }

  function escolher(escolhida: TravessiaOfertada) {
    interagiu.current = true
    setTravessia(escolhida)
  }

  function passoAnterior() {
    interagiu.current = true
    setEnvio(OCIOSO)
    if (roteiro === null) return
    /* No primeiro passo, voltar é voltar à lista — as respostas ficam, e valem para outra saída. */
    if (roteiro.posicaoAtual <= 1) setTravessia(null)
    else setRespostas(voltarNaEncomenda(respostas))
  }

  async function confirmar() {
    if (travessia === null) return
    setEnvio({ estado: 'ENVIANDO' })
    const resultado = await envioDaEncomenda.enviar({ travessia, respostas, criadoEm: lerAgora() })
    switch (resultado.caso) {
      case 'ENVIADA':
        setEnvio({ estado: 'ENVIADA', reserva: resultado.reserva, travessia })
        break
      case 'INCOERENTE':
        setEnvio({ estado: 'RECUSADA', pendencias: [...resultado.pendencias] })
        break
      case 'INCOMPLETA':
        setEnvio(OCIOSO)
        break
      case 'FALHA':
        setEnvio({ estado: 'FALHA' })
        break
    }
  }

  // --- o desenho ---
  let pergunta: string
  let ajuda: string | undefined
  let corpo: ReactNode

  if (envio.estado === 'ENVIADA') {
    pergunta = 'Encomenda reservada'
    corpo = (
      <ReservaConcluida
        codigo={envio.reserva.codigo}
        linhas={resumoDaEncomenda(envio.reserva, envio.travessia)}
        aoRecomecar={recomecar}
        registrada="Encomenda registrada. Guarde este código:"
        rotuloDoRecomecar="Enviar outra encomenda"
        atendimento={
          demonstracao !== null ? (
            <p className="totem-aviso">
              Nesta demonstração a encomenda não é enviada. Na versão final, este passo abre a conversa com o
              atendimento pelo WhatsApp, já com o código.
            </p>
          ) : atendimento !== null ? (
            <>
              <a
                className="acao"
                href={linkDaEncomenda(atendimento, envio.reserva, envio.travessia.rotulos)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enviar ao atendimento
              </a>
              <p className="totem-aviso">
                Abre o WhatsApp com a encomenda escrita. Se não abrir, fale com o atendimento informando o código.
              </p>
            </>
          ) : (
            <p className="totem-aviso">Fale com o atendimento pelo WhatsApp informando este código.</p>
          )
        }
      />
    )
  } else if (travessia === null || roteiro === null) {
    pergunta = 'Escolha a saída'
    corpo = catalogoFalhou ? (
      <p className="totem-vazio">Não foi possível carregar as saídas. Tente de novo em instantes.</p>
    ) : catalogo === null ? (
      <p className="totem-vazio">Carregando as saídas…</p>
    ) : (
      <ListaDeTravessias travessias={oferta} aoEscolher={escolher} rotuloDaEscolha="Enviar nesta saída" />
    )
  } else if (atual === null || atual.passo === 'CONFERENCIA') {
    pergunta = TEXTO_DO_PASSO_DA_ENCOMENDA.CONFERENCIA.pergunta
    const previa = montarEncomenda(respostas, travessia.contexto, { codigo: CODIGO_DA_PREVIA, criadoEm: agora })
    const pendencias =
      envio.estado === 'RECUSADA' ? envio.pendencias : previa.caso === 'INCOERENTE' ? [...previa.pendencias] : []
    const partiu = pendencias.includes('VALIDADE')
    corpo = (
      <>
        <Conferencia
          linhas={previa.caso === 'OK' ? resumoDaEncomenda(previa.reserva, travessia) : []}
          pendencias={pendencias}
          enviando={envio.estado === 'ENVIANDO'}
          aoConfirmar={confirmar}
          rotuloDoConfirmar="Confirmar"
        />
        {envio.estado === 'FALHA' && (
          <p className="totem-pendencias" role="alert">
            Não foi possível enviar a encomenda agora. Confira a conexão e tente de novo.
          </p>
        )}
        {partiu && (
          <button
            type="button"
            className="acao"
            onClick={() => {
              setEnvio(OCIOSO)
              setTravessia(null)
            }}
          >
            Escolher outra saída
          </button>
        )}
      </>
    )
  } else {
    const texto = TEXTO_DO_PASSO_DA_ENCOMENDA[atual.passo]
    pergunta = texto.pergunta
    ajuda =
      atual.passo === 'REMETENTE'
        ? atual.telefoneObrigatorio
          ? AJUDA_DO_REMETENTE.retira
          : AJUDA_DO_REMETENTE.naoRetira
        : texto.ajuda
    corpo = <PassoDaEncomenda no={atual} respostas={respostas} aoResponder={responder} />
  }

  const anuncio =
    roteiro !== null && envio.estado !== 'ENVIADA' ? `Passo ${roteiro.posicaoAtual} de ${roteiro.total}. ${pergunta}` : pergunta

  return (
    <div ref={raiz} className="totem totem--encomenda">
      <p className="totem-aviso">{AVISO_ENCOMENDA_NAO_VENDA}</p>
      {demonstracao !== null && (
        <p className="totem-demonstracao">
          <strong>Demonstração.</strong>{' '}
          {demonstracao === 'SAIDAS_E_ENVIO'
            ? 'As saídas abaixo são fictícias e nenhuma encomenda é enviada ao atendimento.'
            : 'As saídas abaixo são as da operação, mas nenhuma encomenda é enviada ao atendimento ainda.'}
        </p>
      )}

      <div className="totem-cabecalho">
        {roteiro !== null && envio.estado !== 'ENVIADA' && (
          <IndicadorDePasso posicao={roteiro.posicaoAtual} total={roteiro.total} />
        )}
        <h3 className="totem-pergunta" ref={titulo} tabIndex={-1}>
          {pergunta}
        </h3>
        {ajuda !== undefined && <p className="totem-ajuda">{ajuda}</p>}
        {travessia !== null && envio.estado !== 'ENVIADA' && (
          <p className="totem-ajuda">
            {travessia.rotulos.origem} → {travessia.rotulos.destino} · {travessia.rotulos.partida}
          </p>
        )}
      </div>

      <p className="apenas-leitor" aria-live="polite">
        {anuncio}
      </p>

      {corpo}

      {travessia !== null && envio.estado !== 'ENVIADA' && (
        <div className="totem-navegacao">
          <button type="button" className="acao acao--secundaria" onClick={passoAnterior}>
            Voltar
          </button>
          <button type="button" className="acao acao--secundaria" onClick={recomecar}>
            Recomeçar
          </button>
        </div>
      )}
    </div>
  )
}
