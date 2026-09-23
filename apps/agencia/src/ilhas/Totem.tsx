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
  montarReserva,
  roteiroDaReserva,
  travessiasOfertadas,
  voltar,
  type CatalogoDoFluviapp,
  type PendenciaDaReserva,
  type Reserva,
  type RespostasDaReserva,
  type TravessiaOfertada,
} from '@navegsistemas/domain'
import type { EnvioDaReserva, FonteDoCatalogo } from '@navegsistemas/dados'
import {
  AVISO_RESERVA_NAO_VENDA,
  Conferencia,
  IndicadorDePasso,
  ListaDeTravessias,
  PassoDaReserva,
  ReservaConcluida,
  TEXTO_DO_PASSO,
  resumoDaReserva,
} from '@navegsistemas/ui'

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
  readonly quiosque?: boolean
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

export function Totem({ fonte, envio: envioDaReserva, fuso, inatividadeMs, demonstracao, quiosque = false, relogio = relogioDoSistema }: PropsDoTotem) {
  const lerAgora = useCallback(() => InstanteLocal.emFuso(relogio(), fuso), [relogio, fuso])

  const [catalogo, setCatalogo] = useState<CatalogoDoFluviapp | null>(null)
  const [catalogoFalhou, setCatalogoFalhou] = useState(false)
  const [agora, setAgora] = useState(lerAgora)
  /* A travessia fica guardada **inteira**, e não por id: se ela partir com a tela aberta, some da oferta — e
     é justamente aí que a conferência precisa dela para dizer "esta saída já partiu". */
  const [travessia, setTravessia] = useState<TravessiaOfertada | null>(null)
  const [respostas, setRespostas] = useState<RespostasDaReserva>({})
  const [envio, setEnvio] = useState<Envio>(OCIOSO)

  const titulo = useRef<HTMLHeadingElement>(null)
  /* Só se move o foco depois que a pessoa começou: roubá-lo no carregamento arrastaria a página até o totem. */
  const interagiu = useRef(false)

  const recomecar = useCallback(() => {
    setTravessia(null)
    setRespostas({})
    setEnvio(OCIOSO)
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
  }, [fonte])

  // --- o relógio, a cada minuto: uma saída pode partir com a tela aberta ---
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(lerAgora()), 60_000)
    return () => clearInterval(intervalo)
  }, [lerAgora])

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
  const oferta = useMemo(() => (catalogo === null ? [] : travessiasOfertadas(catalogo, agora)), [catalogo, agora])
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
          <p className="totem-aviso">
            {demonstracao !== null
              ? 'Nesta demonstração a reserva não é enviada. Na versão final, este passo abre a conversa com o atendimento pelo WhatsApp, já com o código.'
              : 'Fale com o atendimento pelo WhatsApp informando este código.'}
          </p>
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
      <ListaDeTravessias travessias={oferta} aoEscolher={escolher} />
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

  return (
    <div className={quiosque ? 'totem totem--quiosque' : 'totem'}>
      <p className="totem-aviso">{AVISO_RESERVA_NAO_VENDA}</p>
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
