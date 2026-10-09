/**
 * **O calendário das saídas** — a escolha pelo dia da UI 1.3. Controlado: recebe os meses de
 * `mesesDoCalendario` e devolve os gestos (escolher o dia, filtrar a origem, trocar o mês).
 *
 * Decisões do PO (2026-10-09), na ficha da 1.3:
 *
 * - **A:** o dia vem primeiro; cada dia mostra a sigla da cidade de onde o barco sai, e o sentido é um filtro
 *   opcional, não um passo. Com os sentidos alternando, o dia já diz para onde se vai;
 * - **B:** o calendário mostra o alcance inteiro desde já; o que passa da janela do domínio aparece tracejado,
 *   com o WhatsApp no lugar da reserva;
 * - **D:** no computador, ao lado da lista de saídas (a folha do totem cuida disso).
 *
 * **O teclado:** só um dia da grade entra no Tab (o escolhido, ou o primeiro que se reserva); as setas andam entre
 * os dias que se reservam, e Enter ou espaço escolhe — o padrão de grade de data do APG, recortado aos dias com
 * saída.
 */
import { useRef, type KeyboardEvent } from 'react'

import { linkDeWhatsApp, type DataCalendario } from '@navegsistemas/domain'

import {
  NOMES_DOS_MESES,
  rotuloDoDia,
  type DiaDoCalendario,
  type MesDoCalendario,
  type OrigemDaOferta,
} from './calendario.js'

export interface PropsDoCalendario {
  readonly meses: readonly MesDoCalendario[]
  /** O índice do mês à mostra em `meses`. */
  readonly mesVisivel: number
  readonly aoMudarDeMes: (indice: number) => void
  readonly escolhido: DataCalendario | null
  readonly aoEscolher: (data: DataCalendario) => void
  readonly origens: readonly OrigemDaOferta[]
  readonly origemEscolhida: string | null
  readonly aoFiltrar: (origem: string | null) => void
  /** O WhatsApp do atendimento, como se escreve. Sem ele, o aviso dos dias tracejados não tem link. */
  readonly atendimento: string | null
}

const INICIAIS_DA_SEMANA = [
  ['D', 'domingo'],
  ['S', 'segunda'],
  ['T', 'terça'],
  ['Q', 'quarta'],
  ['Q', 'quinta'],
  ['S', 'sexta'],
  ['S', 'sábado'],
] as const

/** O que vai na casa, abaixo do número: a sigla, ou o sinal de "os dois sentidos". */
function marcaDoDia(dia: DiaDoCalendario): string {
  if (dia.origens.length === 0) return dia.situacao === 'SEM_SAIDA' ? '—' : ''
  return dia.origens.length === 1 ? (dia.origens[0] as OrigemDaOferta).sigla : '⇄'
}

/** O que o leitor de tela ouve: o dia, e de onde sai ou por que não se escolhe. */
function rotuloAcessivel(dia: DiaDoCalendario): string {
  const cidades = dia.origens.map((origem) => origem.cidade).join(' e ')
  switch (dia.situacao) {
    case 'RESERVAVEL':
      return `${rotuloDoDia(dia.data)}, saídas de ${cidades}`
    case 'ALEM_DO_ALCANCE':
      return `${rotuloDoDia(dia.data)}, saídas de ${cidades}, reserva pelo atendimento`
    case 'SEM_SAIDA':
      return `${rotuloDoDia(dia.data)}, sem saída`
    case 'PASSADO':
    case 'FORA_DO_CALENDARIO':
      return rotuloDoDia(dia.data)
  }
}

export function CalendarioDeSaidas({
  meses,
  mesVisivel,
  aoMudarDeMes,
  escolhido,
  aoEscolher,
  origens,
  origemEscolhida,
  aoFiltrar,
  atendimento,
}: PropsDoCalendario) {
  const grade = useRef<HTMLDivElement>(null)
  const mes = meses[mesVisivel]
  if (mes === undefined) return null

  const reservaveis = mes.dias.filter((dia) => dia.situacao === 'RESERVAVEL')
  const noTab =
    reservaveis.find((dia) => dia.data === escolhido)?.data ?? reservaveis[0]?.data ?? null
  const temAlem = meses.some((m) => m.dias.some((dia) => dia.situacao === 'ALEM_DO_ALCANCE'))

  function andar(evento: KeyboardEvent<HTMLDivElement>) {
    const atual = (evento.target as HTMLElement).dataset['data'] as DataCalendario | undefined
    if (atual === undefined) return
    const indice = reservaveis.findIndex((dia) => dia.data === atual)
    const destino = (() => {
      switch (evento.key) {
        case 'ArrowRight':
          return reservaveis[indice + 1]
        case 'ArrowLeft':
          return reservaveis[indice - 1]
        /* Uma semana para baixo ou para cima — e, se aquele dia não se reserva, o foco fica onde está. */
        case 'ArrowDown':
          return reservaveis.find((d) => d.dia === Number(atual.slice(8)) + 7)
        case 'ArrowUp':
          return reservaveis.find((d) => d.dia === Number(atual.slice(8)) - 7)
        case 'Home':
          return reservaveis[0]
        case 'End':
          return reservaveis[reservaveis.length - 1]
        default:
          return undefined
      }
    })()
    if (destino === undefined) return
    evento.preventDefault()
    grade.current?.querySelector<HTMLButtonElement>(`[data-data="${destino.data}"]`)?.focus()
  }

  return (
    <div className="calendario">
      {origens.length > 1 && (
        <div className="calendario-filtro" role="group" aria-label="Saindo de">
          <span aria-hidden="true">Saindo de:</span>
          <button type="button" aria-pressed={origemEscolhida === null} onClick={() => aoFiltrar(null)}>
            Todas
          </button>
          {origens.map((origem) => (
            <button
              key={origem.id}
              type="button"
              aria-pressed={origemEscolhida === origem.id}
              onClick={() => aoFiltrar(origem.id)}
            >
              {origem.cidade}
            </button>
          ))}
        </div>
      )}

      <div className="calendario-mes">
        <button
          type="button"
          className="calendario-seta"
          aria-label="Mês anterior"
          disabled={mesVisivel === 0}
          onClick={() => aoMudarDeMes(mesVisivel - 1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <p className="calendario-nome-do-mes" aria-live="polite">
          {NOMES_DOS_MESES[mes.mes - 1]} de {mes.ano}
        </p>
        <button
          type="button"
          className="calendario-seta"
          aria-label="Próximo mês"
          disabled={mesVisivel === meses.length - 1}
          onClick={() => aoMudarDeMes(mesVisivel + 1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div
        ref={grade}
        className="calendario-grade"
        role="group"
        aria-label={`Dias de ${NOMES_DOS_MESES[mes.mes - 1]}`}
        onKeyDown={andar}
      >
        {INICIAIS_DA_SEMANA.map(([inicial, nome]) => (
          <abbr key={nome} className="calendario-semana" title={nome}>
            {inicial}
          </abbr>
        ))}
        {Array.from({ length: mes.deslocamento }, (_, i) => (
          <span key={`vazio-${i}`} aria-hidden="true" />
        ))}
        {mes.dias.map((dia) => {
          const classe = `calendario-dia calendario-dia--${dia.situacao.toLowerCase().replace(/_/g, '-')}`
          const conteudo = (
            <>
              <span className="calendario-dia__numero" aria-hidden="true">
                {dia.dia}
              </span>
              <span className="calendario-dia__marca" aria-hidden="true">
                {marcaDoDia(dia)}
              </span>
            </>
          )
          return dia.situacao === 'RESERVAVEL' ? (
            <button
              key={dia.data}
              type="button"
              className={classe}
              data-data={dia.data}
              aria-pressed={dia.data === escolhido}
              aria-label={rotuloAcessivel(dia)}
              tabIndex={dia.data === noTab ? 0 : -1}
              onClick={() => aoEscolher(dia.data)}
            >
              {conteudo}
            </button>
          ) : (
            <span key={dia.data} className={classe}>
              {conteudo}
              <span className="apenas-leitor">{rotuloAcessivel(dia)}</span>
            </span>
          )
        })}
      </div>

      <ul className="calendario-legenda" aria-label="Legenda">
        {origens.map((origem) => (
          <li key={origem.id}>
            <span className="calendario-legenda__sigla">{origem.sigla}</span> sai de {origem.cidade}
          </li>
        ))}
        {origens.length > 1 && (
          <li>
            <span className="calendario-legenda__sigla">⇄</span> saídas nos dois sentidos
          </li>
        )}
        <li>
          <span className="calendario-legenda__sigla">—</span> sem saída
        </li>
      </ul>

      {temAlem && (
        <p className="calendario-alem">
          Os dias tracejados ainda não abrem para reserva pelo site.{' '}
          {atendimento === null ? (
            'Para viajar nesses dias, fale com o atendimento.'
          ) : (
            <>
              Para viajar nesses dias,{' '}
              <a href={linkDeWhatsApp(atendimento)} target="_blank" rel="noopener noreferrer">
                fale com o atendimento pelo WhatsApp
              </a>
              : {atendimento}.
            </>
          )}
        </p>
      )}
    </div>
  )
}
