/**
 * **O totem** — o único lugar da página com estado de aplicação, e ele é pequeno.
 *
 * Guarda três coisas: a travessia escolhida, as `RespostasDaReserva` e o estado do envio. Todo o resto é
 * derivado a cada desenho: as saídas vêm de `travessiasOfertadas`, o passo em foco de `roteiroDaReserva`, o
 * "voltar" de `voltar()`, a conferência de `montarReserva`. Não há pilha de telas, não há lista de passos
 * guardada — dois registros da mesma coisa divergem, e aqui só existe um.
 *
 * As dependências entram por propriedade (fonte do catálogo, envio, relógio), e é isso que deixa os
 * cenários dirigirem o totem inteiro sem rede e sem esperar o relógio. A ilha da página
 * (`TotemDaAgencia.tsx`) é quem as constrói.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  InstanteLocal,
  linkDaReserva,
  montarReserva,
  roteiroDaReserva,
  travessiasOfertadas,
  voltar,
  type DataCalendario,
  type PendenciaDaReserva,
  type Reserva,
  type RespostasDaReserva,
  type TravessiaOfertada,
} from '@navegsistemas/domain'
import type { EnvioDaReserva, FonteDoCatalogo } from '@navegsistemas/dados'
import {
  AVISO_RESERVA_NAO_VENDA,
  CalendarioDeSaidas,
  Conferencia,
  IndicadorDePasso,
  ListaDeTravessias,
  PassoDaReserva,
  ReservaConcluida,
  TEXTO_DO_PASSO,
  mesesDoCalendario,
  origensDaOferta,
  primeiroDiaReservavel,
  resumoDaReserva,
  rotuloDoDia,
  saidasDoDia,
} from '@navegsistemas/ui'

import { useAncoraNoCarregamento } from './ancora'
import { useOferta } from './oferta'

export type Demonstracao = 'SAIDAS_E_ENVIO' | 'ENVIO'

export interface PropsDoTotem {
  readonly fonte: FonteDoCatalogo
  /** Para onde a reserva vai: a API, ou — na demonstração e nos cenários — a memória. */
  readonly envio: EnvioDaReserva
  /** O fuso da operação — ver `conteudo/operacao.ts`. */
  readonly fuso: string
  /** `null` desliga o zerar por inatividade (fora do quiosque). */
  readonly inatividadeMs: number | null
  /**
   * O que ainda **não** é de verdade — e a faixa diz exatamente isso, nem mais nem menos:
   * - `'SAIDAS_E_ENVIO'`: o catálogo é o de demonstração, e nada é enviado (sem a API configurada);
   * - `'ENVIO'`: as saídas são as da operação, mas a reserva ainda não é enviada (até o passo 10);
   * - `null`: tudo de verdade, e não há faixa.
   *
   * Era um booleano só até o passo 9, quando as saídas passaram a poder ser reais antes do envio. Uma faixa
   * dizendo "as saídas são fictícias" sobre saídas reais seria mentira no sentido contrário.
   */
  readonly demonstracao: Demonstracao | null
  /**
   * O totem como a página inteira (`/totem`). Muda também o nível da pergunta do passo: na página, ela fica sob o
   * título da seção (`h2`) e é `h3`; no quiosque não há seção, e ela é `h2`, logo abaixo do `h1` — pular um nível
   * desorienta quem navega pelos títulos no leitor de tela.
   */
  readonly quiosque?: boolean
  /**
   * O WhatsApp do atendimento, como se escreve — `(91) 98888-7777`. Com ele, a conclusão abre a conversa já com
   * a reserva escrita (passo 11); `null` enquanto o número não chega, e a conclusão orienta a informar o código.
   */
  readonly atendimento?: string | null
  /**
   * Quantos dias o calendário mostra (UI 1.3). Na página, a reserva começa pelo dia, num calendário; `null` mantém
   * a lista das saídas da semana, que é o que o quiosque usa ("o totem mantém seu funcionamento", PO, 2026-10-09).
   */
  readonly alcanceDoCalendario?: number | null
  /** O relógio. Os cenários passam um fixo; a página, o do sistema. */
  readonly relogio?: () => Date
}

type Envio =
  | { readonly estado: 'OCIOSO' }
  | { readonly estado: 'ENVIANDO' }
  | { readonly estado: 'ENVIADA'; readonly reserva: Reserva; readonly travessia: TravessiaOfertada }
  | { readonly estado: 'RECUSADA'; readonly pendencias: readonly PendenciaDaReserva[] }
  | { readonly estado: 'FALHA' }

const OCIOSO: Envio = { estado: 'OCIOSO' }

/** O código provisório da prévia. É um código válido — só nunca é gravado. */
const CODIGO_DA_PREVIA = 'NVG-000000'

const relogioDoSistema = () => new Date()

export function Totem({ fonte, envio: envioDaReserva, fuso, inatividadeMs, demonstracao, quiosque = false, atendimento = null, alcanceDoCalendario = null, relogio = relogioDoSistema }: PropsDoTotem) {
  const { lerAgora, agora, catalogo, catalogoFalhou, oferta } = useOferta(fonte, fuso, relogio)

  /* O calendário guarda só os gestos — a origem do filtro, o dia e o mês que a pessoa escolheu. O dia em vigor é
     derivado: se o escolhido deixou de se reservar (partiu, ou o filtro o apagou), vale o primeiro que se reserva. */
  const [origem, setOrigem] = useState<string | null>(null)
  const [diaEscolhido, setDiaEscolhido] = useState<DataCalendario | null>(null)
  const [mesEscolhido, setMesEscolhido] = useState<number | null>(null)
  const calendario = useMemo(() => {
    if (alcanceDoCalendario === null || catalogo === null) return null
    const previstas = travessiasOfertadas(catalogo, agora, alcanceDoCalendario)
    const origens = origensDaOferta(previstas, catalogo.localidades)
    const meses = mesesDoCalendario({
      hoje: InstanteLocal.data(agora),
      alcanceDias: alcanceDoCalendario,
      reservaveis: oferta,
      previstas,
      origens,
      origemEscolhida: origem,
    })
    return { origens, meses }
  }, [alcanceDoCalendario, catalogo, agora, oferta, origem])
  const dia =
    calendario === null
      ? null
      : calendario.meses.some((m) => m.dias.some((d) => d.data === diaEscolhido && d.situacao === 'RESERVAVEL'))
        ? diaEscolhido
        : primeiroDiaReservavel(calendario.meses)
  const mesVisivel =
    calendario === null
      ? 0
      : (mesEscolhido ?? Math.max(0, calendario.meses.findIndex((m) => m.dias.some((d) => d.data === dia))))

  /* Escolhido o dia, as saídas dele: no celular a lista fica abaixo do calendário, fora da tela, e a pessoa teria
     de rolar para achar (pedido do PO na prévia da 1.3). O foco vai para o título da lista, como a cada passo do
     totem; a página só rola quando o título está na metade de baixo da tela ou além — no computador, ao lado do
     calendário, ele já está à vista. A rolagem é a do CSS (suave, com o recuo do topo; instantânea com movimento
     reduzido), e não atravessa nada que cresça: a lista já está desenhada. */
  const tituloDasSaidas = useRef<HTMLHeadingElement>(null)
  const levarAsSaidas = useRef(false)
  useEffect(() => {
    if (!levarAsSaidas.current) return
    levarAsSaidas.current = false
    const alvo = tituloDasSaidas.current
    if (alvo === null) return
    alvo.focus({ preventScroll: true })
    if (alvo.getBoundingClientRect().top > window.innerHeight / 2) alvo.scrollIntoView({ block: 'start' })
  }, [dia])
  /* A travessia fica guardada **inteira**, e não por id: se ela partir com a tela aberta, some da oferta — e
     é justamente aí que a conferência precisa dela para dizer "esta saída já partiu". */
  const [travessia, setTravessia] = useState<TravessiaOfertada | null>(null)
  const [respostas, setRespostas] = useState<RespostasDaReserva>({})
  const [envio, setEnvio] = useState<Envio>(OCIOSO)

  const raiz = useRef<HTMLDivElement>(null)
  useAncoraNoCarregamento(raiz, catalogo !== null)

  const titulo = useRef<HTMLHeadingElement>(null)
  /* Só se move o foco depois que a pessoa começou: roubá-lo no carregamento arrastaria a página até o totem. */
  const interagiu = useRef(false)

  const recomecar = useCallback(() => {
    setTravessia(null)
    setRespostas({})
    setEnvio(OCIOSO)
  }, [])

  // --- a inatividade, no quiosque: o dado do próximo cliente não nasce com o do anterior ---
  const emAndamento = travessia !== null || envio.estado !== 'OCIOSO'
  useEffect(() => {
    if (inatividadeMs === null || !emAndamento) return
    let temporizador = setTimeout(recomecar, inatividadeMs)
    const adiar = () => {
      clearTimeout(temporizador)
      temporizador = setTimeout(recomecar, inatividadeMs)
    }
    const eventos = ['pointerdown', 'keydown', 'input'] as const
    for (const evento of eventos) document.addEventListener(evento, adiar)
    return () => {
      clearTimeout(temporizador)
      for (const evento of eventos) document.removeEventListener(evento, adiar)
    }
  }, [inatividadeMs, emAndamento, recomecar])

  // --- o que se deriva ---
  const roteiro = travessia === null ? null : roteiroDaReserva(respostas, travessia.contexto)
  const atual = roteiro?.atual ?? null

  const chaveDaTela =
    envio.estado === 'ENVIADA' ? 'concluida' : travessia === null ? 'lista' : `${travessia.id}:${atual?.passo ?? ''}`

  useEffect(() => {
    if (interagiu.current) titulo.current?.focus()
  }, [chaveDaTela])

  function responder(novas: RespostasDaReserva) {
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
    if (travessia === null || roteiro === null) return
    /* No primeiro passo, voltar é voltar à lista — as respostas ficam, e valem para outra saída. */
    if (roteiro.posicaoAtual <= 1) setTravessia(null)
    else setRespostas(voltar(respostas, travessia.contexto))
  }

  async function confirmar() {
    if (travessia === null) return
    setEnvio({ estado: 'ENVIANDO' })
    const resultado = await envioDaReserva.enviar({ travessia, respostas, criadoEm: lerAgora() })
    switch (resultado.caso) {
      case 'ENVIADA':
        setEnvio({ estado: 'ENVIADA', reserva: resultado.reserva, travessia })
        break
      case 'INCOERENTE':
        setEnvio({ estado: 'RECUSADA', pendencias: [...resultado.pendencias] })
        break
      case 'INCOMPLETA':
        /* O roteiro já leva ao passo que falta; não há o que dizer além disso. */
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
    pergunta = 'Reserva feita'
    corpo = (
      <ReservaConcluida
        codigo={envio.reserva.codigo}
        linhas={resumoDaReserva(envio.reserva, envio.travessia)}
        aoRecomecar={recomecar}
        atendimento={
          demonstracao !== null ? (
            <p className="totem-aviso">
              Nesta demonstração a reserva não é enviada. Na versão final, este passo abre a conversa com o
              atendimento pelo WhatsApp, já com o código.
            </p>
          ) : atendimento !== null ? (
            <>
              <a
                className="acao"
                href={linkDaReserva(atendimento, envio.reserva, envio.travessia.rotulos)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enviar ao atendimento
              </a>
              <p className="totem-aviso">
                Abre o WhatsApp com a reserva escrita. Se não abrir, fale com o atendimento informando o código.
              </p>
            </>
          ) : (
            <p className="totem-aviso">Fale com o atendimento pelo WhatsApp informando este código.</p>
          )
        }
      />
    )
  } else if (travessia === null || roteiro === null) {
    pergunta = alcanceDoCalendario === null ? 'Escolha a saída' : 'Escolha o dia'
    corpo = catalogoFalhou ? (
      <p className="totem-vazio">Não foi possível carregar as saídas. Tente de novo em instantes.</p>
    ) : catalogo === null ? (
      <p className="totem-vazio">Carregando as saídas…</p>
    ) : calendario === null ? (
      <ListaDeTravessias travessias={oferta} aoEscolher={escolher} />
    ) : (
      <div className="totem-dia-e-saidas">
        <CalendarioDeSaidas
          meses={calendario.meses}
          mesVisivel={mesVisivel}
          aoMudarDeMes={setMesEscolhido}
          escolhido={dia}
          aoEscolher={(data) => {
            levarAsSaidas.current = data !== dia
            setDiaEscolhido(data)
            setMesEscolhido(null)
          }}
          origens={calendario.origens}
          origemEscolhida={origem}
          aoFiltrar={(escolhida) => {
            setOrigem(escolhida)
            setDiaEscolhido(null)
            setMesEscolhido(null)
          }}
          atendimento={atendimento}
        />
        <div className="totem-saidas-do-dia">
          {dia !== null && (
            <h4 ref={tituloDasSaidas} className="totem-saidas-do-dia__titulo" tabIndex={-1}>
              Saídas de {rotuloDoDia(dia)}
            </h4>
          )}
          <ListaDeTravessias travessias={dia === null ? [] : saidasDoDia(oferta, dia, origem)} aoEscolher={escolher} />
        </div>
      </div>
    )
  } else if (atual === null || atual.passo === 'CONFERENCIA') {
    pergunta = TEXTO_DO_PASSO.CONFERENCIA.pergunta
    const previa = montarReserva(respostas, travessia.contexto, { codigo: CODIGO_DA_PREVIA, criadoEm: agora })
    const pendencias =
      envio.estado === 'RECUSADA' ? envio.pendencias : previa.caso === 'INCOERENTE' ? [...previa.pendencias] : []
    const partiu = pendencias.includes('VALIDADE')
    corpo = (
      <>
        <Conferencia
          linhas={previa.caso === 'OK' ? resumoDaReserva(previa.reserva, travessia) : []}
          pendencias={pendencias}
          enviando={envio.estado === 'ENVIANDO'}
          aoConfirmar={confirmar}
        />
        {envio.estado === 'FALHA' && (
          <p className="totem-pendencias" role="alert">
            Não foi possível enviar a reserva agora. Confira a conexão e tente de novo.
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
    const texto = TEXTO_DO_PASSO[atual.passo]
    pergunta = texto.pergunta
    ajuda = texto.ajuda
    corpo = <PassoDaReserva no={atual} respostas={respostas} aoResponder={responder} />
  }

  const anuncio =
    roteiro !== null && envio.estado !== 'ENVIADA' ? `Passo ${roteiro.posicaoAtual} de ${roteiro.total}. ${pergunta}` : pergunta

  const Pergunta = quiosque ? 'h2' : 'h3'

  return (
    <div
      ref={raiz}
      className={
        quiosque ? 'totem totem--quiosque' : calendario !== null && chaveDaTela === 'lista' ? 'totem totem--calendario' : 'totem'
      }
    >
      {/* Na página, o subtítulo da seção já diz o que o aviso dizia (UI 1.3); a caixa fica no quiosque, que não tem
          subtítulo. */}
      {quiosque && <p className="totem-aviso">{AVISO_RESERVA_NAO_VENDA}</p>}
      {demonstracao !== null && (
        <p className="totem-demonstracao">
          <strong>Demonstração.</strong>{' '}
          {demonstracao === 'SAIDAS_E_ENVIO'
            ? 'As saídas abaixo são fictícias e nenhuma reserva é enviada ao atendimento.'
            : 'As saídas abaixo são as da operação, mas nenhuma reserva é enviada ao atendimento ainda.'}
        </p>
      )}

      <div className="totem-cabecalho">
        {roteiro !== null && envio.estado !== 'ENVIADA' && (
          <IndicadorDePasso posicao={roteiro.posicaoAtual} total={roteiro.total} />
        )}
        <Pergunta className="totem-pergunta" ref={titulo} tabIndex={-1}>
          {pergunta}
        </Pergunta>
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
