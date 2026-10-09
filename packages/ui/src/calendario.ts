/**
 * **O calendário das saídas** — a conta por trás da reserva que começa pelo dia (UI 1.3, decisão do PO em
 * 2026-10-09).
 *
 * O cliente escolhe o dia e depois a saída daquele dia. O calendário vai até `alcanceDias` à frente (90), mas só
 * o que o domínio oferta hoje se reserva: a janela de `DIAS_DA_JANELA`, porque a ocorrência além da semana ainda
 * não existe no centralizador (o arcabouço está em andamento no fluviapp-kmp). Os dias depois da janela aparecem
 * com as saídas previstas pela viagem semanal e mandam para o atendimento. Quando a janela crescer, eles passam a
 * ser reserváveis sem mudar nada aqui.
 *
 * Tudo aqui é derivado: as travessias entram, os meses saem. O componente (`CalendarioDeSaidas.tsx`) só desenha.
 */
import { DataCalendario, DiaSemana, type Localidade, type TravessiaOfertada } from '@navegsistemas/domain'

/**
 * - `PASSADO`: antes de hoje, no mês corrente;
 * - `RESERVAVEL`: tem saída dentro da janela do domínio — o único dia que recebe clique;
 * - `ALEM_DO_ALCANCE`: tem saída prevista, mas depois da janela; a reserva é pelo atendimento;
 * - `SEM_SAIDA`: dentro do calendário, sem saída (ou sem saída da cidade escolhida no filtro);
 * - `FORA_DO_CALENDARIO`: depois do último dia do alcance, no último mês.
 */
export type SituacaoDoDia = 'PASSADO' | 'RESERVAVEL' | 'ALEM_DO_ALCANCE' | 'SEM_SAIDA' | 'FORA_DO_CALENDARIO'

/** Uma cidade de onde sai alguma travessia. É a opção do filtro e a sigla de cada dia. */
export interface OrigemDaOferta {
  /** O `localidadeId` do porto de origem. */
  readonly id: string
  /** "Belém" */
  readonly cidade: string
  /** "BEL" — três letras, para caber na casa do dia. */
  readonly sigla: string
}

export interface DiaDoCalendario {
  readonly data: DataCalendario
  readonly dia: number
  readonly situacao: SituacaoDoDia
  /** As cidades de onde saem as travessias do dia (já com o filtro aplicado). Vazio quando não há saída. */
  readonly origens: readonly OrigemDaOferta[]
}

export interface MesDoCalendario {
  readonly ano: number
  /** 1 a 12. */
  readonly mes: number
  /** Casas vazias antes do dia 1, com a semana começando no domingo, como no calendário de parede. */
  readonly deslocamento: number
  readonly dias: readonly DiaDoCalendario[]
}

export const NOMES_DOS_MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** As três primeiras letras da cidade: "Belém" → "BEL". */
function siglaCurta(cidade: string): string {
  return semAcento(cidade).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
}

/** As iniciais, quando as três letras empatam: "Cidade Exemplo A" → "CEA". */
function siglaPorIniciais(cidade: string): string {
  const iniciais = semAcento(cidade)
    .split(/\s+/)
    .map((palavra) => palavra.replace(/[^A-Za-z]/g, '').charAt(0))
    .join('')
    .slice(0, 3)
    .toUpperCase()
  return iniciais.length >= 2 ? iniciais : siglaCurta(cidade)
}

/**
 * **As cidades de origem da oferta**, em ordem alfabética. A cidade vem da localidade do porto; sem ela, o nome do
 * porto. A sigla é de três letras e, quando duas cidades dariam a mesma, passa a ser pelas iniciais.
 */
export function origensDaOferta(
  travessias: readonly TravessiaOfertada[],
  localidades: readonly Localidade[],
): readonly OrigemDaOferta[] {
  const municipios = new Map(localidades.map((localidade) => [localidade.id, localidade.municipio]))
  const cidades = new Map<string, string>()
  for (const travessia of travessias) {
    const id = travessia.origem.localidadeId
    if (!cidades.has(id)) cidades.set(id, municipios.get(id) ?? travessia.origem.nome)
  }
  const curtas = [...cidades.values()].map(siglaCurta)
  const empata = (sigla: string) => curtas.filter((outra) => outra === sigla).length > 1
  return [...cidades.entries()]
    .map(([id, cidade]) => ({ id, cidade, sigla: empata(siglaCurta(cidade)) ? siglaPorIniciais(cidade) : siglaCurta(cidade) }))
    .sort((a, b) => a.cidade.localeCompare(b.cidade, 'pt-BR'))
}

function daOrigem(origemEscolhida: string | null) {
  return (travessia: TravessiaOfertada) =>
    origemEscolhida === null || travessia.origem.localidadeId === origemEscolhida
}

/** As travessias reserváveis de um dia, na ordem da partida, com o filtro de origem aplicado. */
export function saidasDoDia(
  reservaveis: readonly TravessiaOfertada[],
  data: DataCalendario,
  origemEscolhida: string | null,
): readonly TravessiaOfertada[] {
  return reservaveis.filter((travessia) => travessia.ocorrencia.data === data).filter(daOrigem(origemEscolhida))
}

export interface EntradaDoCalendario {
  /** O dia de hoje no fuso da operação. */
  readonly hoje: DataCalendario
  /** Quantos dias o calendário mostra, contando hoje. */
  readonly alcanceDias: number
  /** O que o domínio oferta agora: a janela que se reserva pelo site. */
  readonly reservaveis: readonly TravessiaOfertada[]
  /** As mesmas travessias calculadas para o alcance inteiro: o que a viagem semanal prevê. */
  readonly previstas: readonly TravessiaOfertada[]
  readonly origens: readonly OrigemDaOferta[]
  /** O `id` de uma `OrigemDaOferta`, ou `null` para todas. */
  readonly origemEscolhida: string | null
}

/** Os meses do calendário, de hoje até o último dia do alcance. */
export function mesesDoCalendario(entrada: EntradaDoCalendario): readonly MesDoCalendario[] {
  const { hoje, alcanceDias, origemEscolhida } = entrada
  if (alcanceDias <= 0) return []
  const ultimo = DataCalendario.maisDias(hoje, alcanceDias - 1)
  const filtro = daOrigem(origemEscolhida)

  const agrupar = (travessias: readonly TravessiaOfertada[]) => {
    const porDia = new Map<DataCalendario, TravessiaOfertada[]>()
    for (const travessia of travessias.filter(filtro)) {
      const lista = porDia.get(travessia.ocorrencia.data) ?? []
      lista.push(travessia)
      porDia.set(travessia.ocorrencia.data, lista)
    }
    return porDia
  }
  const reservaveis = agrupar(entrada.reservaveis)
  const previstas = agrupar(entrada.previstas)

  const origensDe = (travessias: readonly TravessiaOfertada[]): readonly OrigemDaOferta[] => {
    const ids = new Set(travessias.map((travessia) => travessia.origem.localidadeId))
    return entrada.origens.filter((origem) => ids.has(origem.id))
  }

  const situacaoDe = (data: DataCalendario): { situacao: SituacaoDoDia; origens: readonly OrigemDaOferta[] } => {
    if (DataCalendario.comparar(data, hoje) < 0) return { situacao: 'PASSADO', origens: [] }
    if (DataCalendario.comparar(data, ultimo) > 0) return { situacao: 'FORA_DO_CALENDARIO', origens: [] }
    const doDia = reservaveis.get(data)
    if (doDia !== undefined) return { situacao: 'RESERVAVEL', origens: origensDe(doDia) }
    const previstasDoDia = previstas.get(data)
    if (previstasDoDia !== undefined) return { situacao: 'ALEM_DO_ALCANCE', origens: origensDe(previstasDoDia) }
    return { situacao: 'SEM_SAIDA', origens: [] }
  }

  const meses: MesDoCalendario[] = []
  let { ano, mes } = DataCalendario.partes(hoje)
  const fim = DataCalendario.partes(ultimo)
  while (ano < fim.ano || (ano === fim.ano && mes <= fim.mes)) {
    const primeiro = DataCalendario.deAnoMesDia(ano, mes, 1) as DataCalendario
    const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
    const dias: DiaDoCalendario[] = []
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = DataCalendario.deAnoMesDia(ano, mes, dia) as DataCalendario
      dias.push({ data, dia, ...situacaoDe(data) })
    }
    /* ISO conta da segunda (1) ao domingo (7); a grade começa no domingo. */
    meses.push({ ano, mes, deslocamento: DiaSemana.numeroIso(DataCalendario.diaDaSemana(primeiro)) % 7, dias })
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return meses
}

/** O primeiro dia que se reserva, ou `null` quando nenhum se reserva. É o dia que já vem escolhido (decisão E). */
export function primeiroDiaReservavel(meses: readonly MesDoCalendario[]): DataCalendario | null {
  for (const mes of meses) for (const dia of mes.dias) if (dia.situacao === 'RESERVAVEL') return dia.data
  return null
}

/** "terça-feira, 13 de outubro" */
export function rotuloDoDia(data: DataCalendario): string {
  const { dia, mes } = DataCalendario.partes(data)
  return `${DiaSemana.rotulo(DataCalendario.diaDaSemana(data)).toLowerCase()}, ${dia} de ${NOMES_DOS_MESES[mes - 1]}`
}
