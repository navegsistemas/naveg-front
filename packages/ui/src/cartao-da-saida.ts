/**
 * **O cartão da saída, em texto** (UI 2.1, decidida pelo PO em 2026-10-22) — o que cada cartão da lista mostra, já
 * escrito. A lista só desenha; as contas ficam aqui, com cenário.
 *
 * A hora é o que se escolhe, e vem sozinha: o dia já está no título "Saídas de …" (decisão A). A chegada traz o dia,
 * porque a travessia de 30 horas sempre chega no dia seguinte, e a duração vem da mesma conta que a chegada, para os
 * três números nunca discordarem.
 */
import {
  DataCalendario,
  DiaSemana,
  formatarHora,
  InstanteLocal,
  MINUTOS_POR_DIA,
  TipoEmbarcacao,
  type TravessiaOfertada,
} from '@navegsistemas/domain'

export interface TextoDoCartao {
  /** "10:00" */
  readonly saida: string
  /** "quinta, 22/10" — só para a lista sem calendário (o quiosque), que mistura os dias. */
  readonly diaDaSaida: string
  /** "16:00" */
  readonly chegada: string
  /** "sexta, 23/10", ou `null` quando chega no mesmo dia. */
  readonly diaDaChegada: string | null
  /** "30 h", "3 h 30" — sem o "≈", que é da tela. */
  readonly duracao: string
  /** "F/B Maria Ivanir" */
  readonly embarcacao: string
  /** "Ferry Boat" */
  readonly tipo: string
}

/** "quinta, 22/10": o nome do dia sem o "-feira", que o cartão não tem largura para levar. */
export function diaCurto(data: DataCalendario): string {
  const { dia, mes } = DataCalendario.partes(data)
  const nome = DiaSemana.rotulo(DataCalendario.diaDaSemana(data)).toLowerCase().replace(/-feira$/, '')
  return `${nome}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
}

/** 1800 → "30 h"; 210 → "3 h 30"; 45 → "45 min". */
export function rotuloDaDuracao(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')}`
}

/** Pedaços em caixa alta que ficam como estão: a sigla do tipo ("F/B") e os algarismos romanos. */
const SIGLA = /^([A-Z]\/[A-Z]|[IVX]+)$/
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/**
 * "F/B MARIA IVANIR" vira "F/B Maria Ivanir". No casco o nome vai em caixa alta; em texto corrido, capitulado lê
 * melhor (`conteudo/embarcacoes.ts`). Um nome que já veio capitulado fica como veio.
 */
export function nomeDaEmbarcacao(nome: string): string {
  const limpo = nome.trim()
  if (limpo !== limpo.toUpperCase()) return limpo
  return limpo
    .split(/\s+/)
    .map((parte, i) => {
      if (SIGLA.test(parte)) return parte
      const minuscula = parte.toLowerCase()
      if (i > 0 && MINUSCULAS.has(minuscula)) return minuscula
      return minuscula.charAt(0).toUpperCase() + minuscula.slice(1)
    })
    .join(' ')
}

/**
 * **A chave da foto de uma embarcação**: o nome sem caixa nem acento. É por ela que a página casa a foto que tem
 * (`conteudo/embarcacoes.ts`, pelo nome do site) com a embarcação do catálogo, que tem outro `id`.
 */
export function chaveDaEmbarcacao(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function textoDoCartao(travessia: TravessiaOfertada): TextoDoCartao {
  const data = InstanteLocal.data(travessia.partida)
  const partidaMin = InstanteLocal.horaMin(travessia.partida)
  const { horaMin, diasDepois } = travessia.chegada
  return {
    saida: formatarHora(partidaMin),
    diaDaSaida: diaCurto(data),
    chegada: formatarHora(horaMin),
    diaDaChegada: diasDepois > 0 ? diaCurto(DataCalendario.maisDias(data, diasDepois)) : null,
    duracao: rotuloDaDuracao(diasDepois * MINUTOS_POR_DIA + horaMin - partidaMin),
    embarcacao: nomeDaEmbarcacao(travessia.embarcacao.nome),
    tipo: TipoEmbarcacao.rotulo(travessia.embarcacao.tipo),
  }
}
