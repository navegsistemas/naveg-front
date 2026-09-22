/**
 * **As travessias que a agência pode oferecer agora** — o "Viagens Disponíveis" do aplicativo, para o público.
 *
 * É a composição que o `PesquisaViagemViewModel` e o `InicioDaTelaMapper` fazem no aplicativo, com as mesmas
 * peças do domínio e na mesma ordem:
 *
 * 1. o **escopo** — só viagens de rota ativa que a concessão da agência cobre (`EscopoDoPool.Concedido`);
 * 2. a **disponibilidade** — `disponiveisAPartirDe(agora)`, janela de sete dias, partida não vencida;
 * 3. os **rótulos** — "Porto · Município/UF", o dia, a hora, a chegada estimada.
 *
 * Cada travessia sai com o [ContextoDaReserva] pronto: é ele que o roteiro do totem recebe, e é da partida
 * dentro dele que nasce a validade da reserva. O totem não monta contexto nenhum.
 *
 * ### O que o público não vê, e o balcão vê
 *
 * O aplicativo mostra uma saída mesmo com referência quebrada — cai no id da rota, e com a embarcação não
 * resolvida o roteiro "não recorta nada". No balcão isso é razoável: há um funcionário que sabe o que está
 * vendendo. No site não há, e duas coisas deixam de ser oferecidas:
 *
 * - **embarcação que não resolve** — sem o tipo, não se sabe se ela leva veículo, e oferecer veículo numa
 *   lancha é exatamente o erro que o `TipoEmbarcacao` existe para impedir;
 * - **porto que não resolve** — uma travessia que não se consegue nomear não é uma travessia que alguém
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
import { AtuacaoDaEmpresa } from '../viagem/atuacao-da-empresa.js'
import type { Embarcacao } from '../viagem/embarcacao.js'
import { formatarHora } from '../viagem/hora-do-dia.js'
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
}

export interface TravessiaOfertada {
  /** `viagemId@yyyy-MM-dd` — estável, serve de chave de lista e de rota. */
  readonly id: string
  readonly ocorrencia: ViagemSemana
  readonly rota: Rota
  readonly origem: Porto
  readonly destino: Porto
  readonly embarcacao: Embarcacao
  readonly partida: InstanteLocal
  readonly chegada: Chegada
  /** O que o roteiro do totem recebe. */
  readonly contexto: ContextoDaReserva
  readonly rotulos: {
    /** "Porto do Sal · Belém/PA" */
    readonly origem: string
    readonly destino: string
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
 * `agora` é o relógio **no fuso da operação** (`InstanteLocal.emFuso`), pela razão escrita lá.
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

  /* 1 · o escopo — o `List<Viagem>.noEscopo(Concedido)` do Kotlin: rota ativa e concessão. */
  const noEscopo = catalogo.viagens.filter((viagem) => {
    const rota = rotas.get(viagem.rotaId)
    return rota !== undefined && rota.ativo && AtuacaoDaEmpresa.podeOfertar(atuacao, viagem, rota)
  })

  /* 2 · a disponibilidade — e 3 · os rótulos. */
  return disponiveisAPartirDe(noEscopo, agora, dias).flatMap((ocorrencia): TravessiaOfertada[] => {
    const rota = rotas.get(ocorrencia.viagem.rotaId) as Rota
    const origem = portos.get(rota.portoOrigemId)
    const destino = portos.get(rota.portoDestinoId)
    const embarcacao = embarcacoes.get(ocorrencia.viagem.embarcacaoId)
    /* A divergência deliberada — ver o cabeçalho. */
    if (origem === undefined || destino === undefined || embarcacao === undefined) return []

    const partida = ViagemSemana.partida(ocorrencia)
    const chegada = chegadaEstimada(ocorrencia.viagem, rota)
    const { dia, mes } = DataCalendario.partes(ocorrencia.data)

    return [
      {
        id: ViagemSemana.id(ocorrencia),
        ocorrencia,
        rota,
        origem,
        destino,
        embarcacao,
        partida,
        chegada,
        contexto: {
          ocorrencia: ViagemSemana.ocorrencia(ocorrencia),
          tipoEmbarcacao: embarcacao.tipo,
          partida,
        },
        rotulos: {
          origem: rotuloDoPorto(origem, localidades),
          destino: rotuloDoPorto(destino, localidades),
          partida: `${DiaSemana.rotulo(ocorrencia.viagem.diaSemana)}, ${String(dia).padStart(2, '0')}/${String(
            mes,
          ).padStart(2, '0')} · ${formatarHora(ocorrencia.viagem.horaMin)}`,
          chegada: rotuloDaChegada(chegada),
          embarcacao: [embarcacao.nome, TipoEmbarcacao.rotulo(embarcacao.tipo)]
            .filter((parte) => parte.trim().length > 0)
            .join(' · '),
        },
      },
    ]
  })
}
