/**
 * **As travessias que a agência pode oferecer agora** — o "Viagens Disponíveis" do aplicativo, para o público.
 *
 * É a composição que o Início do painel faz no fluviapp-kmp, com as mesmas peças do domínio e na mesma ordem:
 *
 * 1. o **escopo** — só viagens de rota ativa que a concessão da agência cobre, **pelos cais da viagem**
 *    (`AtuacaoDaEmpresa.podeOfertar(viagem)`);
 * 2. a **disponibilidade** — `disponiveisAPartirDe(agora)`, pela hora **daquela data**, menos as suspensas;
 * 3. a **saída do dia** — o cais e a hora da alteração, quando há; senão, os da viagem (`saidaEm`);
 * 4. os **rótulos** — as cidades da rota, o cais do dia, o dia, a hora, a chegada estimada.
 *
 * ### A rota é o trecho que se vende; o cais é detalhe da saída
 *
 * Decisão do PO (2026-10-13, ADR-0021 do fluviapp-kmp): **a rota é o marketing**. As cidades dela são o que o
 * cliente procura — Belém → Macapá —, e o cais é detalhe da saída: "atraca no Porto do Grego, Santana/AP". Por isso
 * [TravessiaOfertada.origem] e [TravessiaOfertada.destino] são as **cidades da rota**, e o cais mora em `embarque` e
 * `desembarque`. Nada aqui deduz a cidade do município do porto.
 *
 * Cada travessia sai com o [ContextoDaReserva] pronto: é ele que o roteiro do totem recebe, e é da partida
 * dentro dele — já com a hora da alteração — que nasce a validade da reserva. O totem não monta contexto nenhum.
 *
 * ### O que o público não vê, e o balcão vê
 *
 * O aplicativo mostra uma saída mesmo com referência quebrada. No balcão isso é razoável: há um funcionário que sabe
 * o que está vendendo. No site não há, e duas coisas deixam de ser oferecidas:
 *
 * - **embarcação que não resolve** — sem o tipo, não se sabe se ela leva veículo, e oferecer veículo numa
 *   lancha é exatamente o erro que o `TipoEmbarcacao` existe para impedir;
 * - **cidade ou cais que não resolve** — uma travessia que não se consegue nomear não é uma travessia que alguém
 *   escolha com confiança.
 *
 * É a única divergência deliberada em relação ao aplicativo, e ela só **esconde**: nada aparece aqui que lá
 * não apareça.
 */
import { DataCalendario, type InstanteLocal } from '../primitivos/calendario.js'
import { DiaSemana } from '../primitivos/dia-semana.js'
import { rotuloDaLocalidade, type Localidade } from '../localidade/localidade.js'
import type { ContextoDaReserva } from '../reserva/roteiro-da-reserva.js'
import type { Porto, Rota } from '../rota/rota.js'
import {
  alteracoesPorId,
  mudancasSobre,
  saidaEm,
  type AlteracaoDaSaida,
  type MudancaNaSaida,
} from '../viagem/alteracao-da-saida.js'
import { AtuacaoDaEmpresa } from '../viagem/atuacao-da-empresa.js'
import type { Embarcacao } from '../viagem/embarcacao.js'
import { formatarHora } from '../viagem/hora-do-dia.js'
import { idDaSuspensao } from '../viagem/alcance-da-reserva.js'
import type { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'
import { TipoEmbarcacao } from '../viagem/tipo-embarcacao.js'
import {
  chegadaEstimada,
  DIAS_DA_JANELA,
  disponiveisAPartirDe,
  ViagemSemana,
  type Chegada,
  type Viagem,
} from '../viagem/viagem.js'

/** Tudo o que o fluviapp fornece, já decodificado. */
export interface CatalogoDoFluviapp {
  readonly viagens: readonly Viagem[]
  readonly rotas: readonly Rota[]
  readonly portos: readonly Porto[]
  readonly localidades: readonly Localidade[]
  readonly embarcacoes: readonly Embarcacao[]
  /** A concessão da agência (`empresas/{id}/atuacoes/AGENCIAMENTO`). Ausente = não oferta nada. */
  readonly atuacao: AtuacaoDaEmpresa | null
  /** As saídas suspensas (`suspensoes`): a data em que a viagem não sai. Não são oferecidas (fluviapp-kmp#44). */
  readonly suspensas: readonly OcorrenciaViagem[]
  /** As saídas alteradas (`alteracoes`): a data em que a viagem sai de outro cais ou hora (fluviapp-kmp#52). */
  readonly alteracoes: readonly AlteracaoDaSaida[]
}

/** O aviso de uma data alterada: o que mudou e por quê. */
export interface AvisoDeAlteracao {
  readonly mudancas: readonly MudancaNaSaida[]
  /** "Cais em obra". Pode vir vazio: o KMP exige motivo, mas o site não inventa um. */
  readonly motivo: string
}

export interface TravessiaOfertada {
  /** `viagemId@yyyy-MM-dd` — estável, serve de chave de lista e de rota. */
  readonly id: string
  readonly ocorrencia: ViagemSemana
  readonly rota: Rota
  /** A cidade de partida **da rota** — a que o cliente procura. */
  readonly origem: Localidade
  /** A cidade de chegada da rota. */
  readonly destino: Localidade
  /** O cais de embarque **daquela data**: o da alteração, se houver; senão, o da viagem. */
  readonly embarque: Porto
  readonly desembarque: Porto
  readonly embarcacao: Embarcacao
  /** A partida daquela data, já com a hora da alteração. */
  readonly partida: InstanteLocal
  readonly chegada: Chegada
  /** Presente quando a data foi alterada e algo de fato mudou em relação à viagem. */
  readonly alteracao: AvisoDeAlteracao | null
  /** O que o roteiro do totem recebe. */
  readonly contexto: ContextoDaReserva
  readonly rotulos: {
    /** "Belém/PA" — a cidade da rota. */
    readonly origem: string
    readonly destino: string
    /** "Terminal Hidroviário · Belém/PA" — o cais do dia, com a cidade dele. */
    readonly embarque: string
    readonly desembarque: string
    /** "Terça-feira, 14/10 · 18:00" */
    readonly partida: string
    /** "02:00" ou, se chega noutro dia, "Qua 02:00" — como o aplicativo escreve. */
    readonly chegada: string
    /** "Nome · Ferry Boat" */
    readonly embarcacao: string
  }
}

function porId<T extends { readonly id: string }>(itens: readonly T[]): ReadonlyMap<string, T> {
  return new Map(itens.map((item) => [item.id, item]))
}

/** "Nome · Município/UF", pulando o que estiver em branco. O `Porto.rotuloCom` do Kotlin. */
function rotuloDoPorto(porto: Porto, localidades: ReadonlyMap<string, Localidade>): string {
  const localidade = localidades.get(porto.localidadeId)
  return [porto.nome, localidade === undefined ? '' : rotuloDaLocalidade(localidade)]
    .filter((parte) => parte.trim().length > 0)
    .join(' · ')
}

function rotuloDaChegada(chegada: Chegada): string {
  const hora = formatarHora(chegada.horaMin)
  return chegada.diasDepois > 0 ? `${DiaSemana.rotuloCurto(chegada.diaSemana)} ${hora}` : hora
}

/**
 * **O catálogo público**: as travessias ofertáveis a partir de `agora`, ordenadas pela partida.
 *
 * `agora` é o relógio **no fuso da operação** (`InstanteLocal.emFuso`), pela razão escrita lá. `dias` é o
 * alcance — `alcanceEmDias(categoria)` para o que se pode pedir. A saída suspensa nunca é ofertada, nem alterada: é
 * o `reservaveisAPartirDe` do Kotlin, com o escopo e os rótulos do site.
 */
export function travessiasOfertadas(
  catalogo: CatalogoDoFluviapp,
  agora: InstanteLocal,
  dias: number = DIAS_DA_JANELA,
): readonly TravessiaOfertada[] {
  const { atuacao } = catalogo
  if (atuacao === null) return []

  const rotas = porId(catalogo.rotas)
  const portos = porId(catalogo.portos)
  const localidades = porId(catalogo.localidades)
  const embarcacoes = porId(catalogo.embarcacoes)
  const alteracoes = alteracoesPorId(catalogo.alteracoes)
  const horaDoDia = new Map([...alteracoes].map(([id, alteracao]) => [id, alteracao.horaMin]))

  /* 1 · o escopo — rota ativa e a concessão pelos cais da viagem. */
  const noEscopo = catalogo.viagens.filter((viagem) => {
    const rota = rotas.get(viagem.rotaId)
    return rota !== undefined && rota.ativo && AtuacaoDaEmpresa.podeOfertar(atuacao, viagem)
  })

  /* 2 · a disponibilidade, pela hora do dia, menos as suspensas — a suspensão vence a alteração. */
  const suspensas = new Set(catalogo.suspensas.map(idDaSuspensao))
  const disponiveis = disponiveisAPartirDe(noEscopo, agora, dias, horaDoDia).filter(
    (o) => !suspensas.has(ViagemSemana.id(o)),
  )
  return disponiveis.flatMap((ocorrencia): TravessiaOfertada[] => {
    const { viagem } = ocorrencia
    const rota = rotas.get(viagem.rotaId) as Rota
    /* 3 · a saída do dia. */
    const saida = saidaEm(viagem, ViagemSemana.ocorrencia(ocorrencia), alteracoes)
    const origem = localidades.get(rota.localidadeOrigemId)
    const destino = localidades.get(rota.localidadeDestinoId)
    const embarque = portos.get(saida.portoEmbarqueId)
    const desembarque = portos.get(saida.portoDesembarqueId)
    const embarcacao = embarcacoes.get(viagem.embarcacaoId)
    /* A divergência deliberada — ver o cabeçalho. */
    if (
      origem === undefined ||
      destino === undefined ||
      embarque === undefined ||
      desembarque === undefined ||
      embarcacao === undefined
    ) {
      return []
    }

    const partida = ViagemSemana.partida(ocorrencia)
    /* A chegada parte da hora do dia: a saída adiada uma hora chega uma hora depois. O `comAHoraDoDia` do Início. */
    const chegada = chegadaEstimada({ ...viagem, horaMin: ocorrencia.horaMin }, rota)
    const mudancas = saida.alteracao === null ? [] : mudancasSobre(saida.alteracao, viagem)
    const { dia, mes } = DataCalendario.partes(ocorrencia.data)

    return [
      {
        id: ViagemSemana.id(ocorrencia),
        ocorrencia,
        rota,
        origem,
        destino,
        embarque,
        desembarque,
        embarcacao,
        partida,
        chegada,
        alteracao:
          saida.alteracao === null || mudancas.length === 0 ? null : { mudancas, motivo: saida.alteracao.motivo.trim() },
        contexto: {
          ocorrencia: ViagemSemana.ocorrencia(ocorrencia),
          tipoEmbarcacao: embarcacao.tipo,
          partida,
        },
        /* 4 · os rótulos. */
        rotulos: {
          origem: rotuloDaLocalidade(origem),
          destino: rotuloDaLocalidade(destino),
          embarque: rotuloDoPorto(embarque, localidades),
          desembarque: rotuloDoPorto(desembarque, localidades),
          partida: `${DiaSemana.rotulo(viagem.diaSemana)}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(
            2,
            '0',
          )} · ${formatarHora(ocorrencia.horaMin)}`,
          chegada: rotuloDaChegada(chegada),
          embarcacao: [embarcacao.nome, TipoEmbarcacao.rotulo(embarcacao.tipo)]
            .filter((parte) => parte.trim().length > 0)
            .join(' · '),
        },
      },
    ]
  })
}
