/**
 * **Das respostas à `Reserva`** — o único caminho, e ele só se abre quando o roteiro fecha.
 *
 * Sem este arquivo, quem montaria a reserva seria a ilha React — e montar a reserva é decidir **quais
 * respostas contam**, que é regra de domínio.
 *
 * ### Ele lê o roteiro, não as respostas
 *
 * A montagem percorre **os nós que o roteiro devolveu** e lê a resposta de cada um. Se o nó do subtipo de
 * gratuidade não está no caminho, a `gratuidade` que sobrou não entra; se o nó da cilindrada não está, a
 * cilindrada digitada para uma moto não vai para o carro; se a natureza tem uma classe só naquele casco, a
 * classe é a derivada. **O roteiro é a única fonte do que foi perguntado** — e só o que foi perguntado é
 * resposta.
 *
 * ### A validade vem da travessia
 *
 * `expiraEm` é `validadeDaReserva(contexto.partida)` — hoje, a própria partida. Se o navio já partiu quando
 * a pessoa confirma, a reserva nasce com a pendência `VALIDADE`.
 */
import type { InstanteLocal } from '../primitivos/calendario.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import { normalizarWhatsapp } from './contato.js'
import {
  pendenciasDaReserva,
  type ClienteDaReserva,
  type PendenciaDaReserva,
  type Reserva,
  type ReservaDePassageiro,
  type ReservaDeVeiculo,
} from './reserva.js'
import {
  classeEmVigor,
  pessoasEmVigor,
  roteiroDaReserva,
  tipoEmVigor,
  type ContextoDaReserva,
  type NoDoRoteiro,
  type RespostasDaReserva,
} from './roteiro-da-reserva.js'
import { STATUS_DA_WEB } from './status-reserva.js'
import { validadeDaReserva } from './validade-da-reserva.js'

/** O que a reserva recebe de fora das respostas e do contexto: a identidade e o carimbo de tempo. */
export interface IdentidadeDaReserva {
  /** O código gerado para esta tentativa. Colidiu? Gera-se outro e monta-se de novo. */
  readonly codigo: string
  /** O relógio **no fuso da operação**, lido por quem chama: a montagem é pura. */
  readonly criadoEm: InstanteLocal
  /** Constante da implantação, quando houver. Ver a nota em `Reserva.agenciaId`. */
  readonly agenciaId?: string
}

export interface MontagemOk {
  readonly caso: 'OK'
  readonly reserva: Reserva
}

/** O roteiro ainda não fechou. `faltando` é o nó em foco — é para lá que a tela leva a pessoa. */
export interface MontagemIncompleta {
  readonly caso: 'INCOMPLETA'
  readonly faltando: NoDoRoteiro
}

/** O roteiro fechou, mas o que foi respondido não forma uma reserva. `pendencias` diz o quê. */
export interface MontagemIncoerente {
  readonly caso: 'INCOERENTE'
  readonly pendencias: ReadonlySet<PendenciaDaReserva>
}

/** Fail-closed: só [MontagemOk] carrega uma reserva. `caso`, e não `tipo`, como no `ResultadoEmissao`. */
export type ResultadoDaMontagem = MontagemOk | MontagemIncompleta | MontagemIncoerente

type No<P extends NoDoRoteiro['passo']> = Extract<NoDoRoteiro, { passo: P }>

function aparado(texto: string | undefined): string {
  return (texto ?? '').trim()
}

function noDoPasso<P extends NoDoRoteiro['passo']>(nos: readonly NoDoRoteiro[], passo: P): No<P> | undefined {
  return nos.find((no): no is No<P> => no.passo === passo)
}

function montarCliente(respostas: RespostasDaReserva): ClienteDaReserva {
  const nome = aparado(respostas.cliente?.nome)
  const bruto = aparado(respostas.cliente?.telefone)
  if (bruto.length === 0) return { nome }
  /* O telefone que não normaliza entra **como foi digitado**: o agregado o recusa por `CLIENTE_TELEFONE`,
     em vez de a montagem o descartar em silêncio — quem digitou quer ser procurado nele. */
  return { nome, telefone: normalizarWhatsapp(bruto) ?? bruto }
}

type Base = Omit<ReservaDePassageiro, 'categoria' | 'acomodacao' | 'tipo' | 'gratuidade' | 'quantidadePessoas'>

function montarBase(
  respostas: RespostasDaReserva,
  contexto: ContextoDaReserva,
  identidade: IdentidadeDaReserva,
): Base {
  const observacao = aparado(respostas.observacao)
  const agenciaId = aparado(identidade.agenciaId)
  return {
    codigo: identidade.codigo,
    ocorrencia: contexto.ocorrencia,
    cliente: montarCliente(respostas),
    status: STATUS_DA_WEB,
    origem: 'TOTEM_WEB',
    criadoEm: identidade.criadoEm,
    expiraEm: validadeDaReserva(contexto.partida),
    ...(agenciaId.length > 0 ? { agenciaId } : {}),
    ...(observacao.length > 0 ? { observacao } : {}),
  }
}

function deReservaDePassageiro(nos: readonly NoDoRoteiro[], respostas: RespostasDaReserva, base: Base): ReservaDePassageiro | null {
  const acomodacao = respostas.acomodacao
  /* O roteiro fechou, então estes existem — é o compilador pedindo a prova. */
  if (acomodacao === undefined) return null
  const tipo = tipoEmVigor(respostas, acomodacao)
  const quantidadePessoas = pessoasEmVigor(respostas, acomodacao)
  if (tipo === undefined || quantidadePessoas === undefined) return null

  /* O subtipo entra **só se o nó dele estava no caminho**. */
  const gratuidade = noDoPasso(nos, 'TIPO_GRATUIDADE') === undefined ? undefined : respostas.gratuidade

  return {
    ...base,
    categoria: 'PASSAGEIRO',
    acomodacao,
    tipo,
    ...(gratuidade !== undefined ? { gratuidade } : {}),
    quantidadePessoas,
  }
}

function deReservaDeVeiculo(
  nos: readonly NoDoRoteiro[],
  respostas: RespostasDaReserva,
  base: Base,
  contexto: ContextoDaReserva,
): ReservaDeVeiculo | null {
  const natureza = respostas.naturezaVeiculo
  if (natureza === undefined) return null
  /* A mesma derivação que o roteiro usa: a classe escolhida entre as ofertadas, ou a única que a natureza
     tem neste casco. A van que sobrou de um ferry não vira van num navio. */
  const classe = classeEmVigor(respostas, natureza, contexto.tipoEmbarcacao)
  if (classe === undefined) return null

  return {
    ...base,
    categoria: 'VEICULO',
    classe,
    /* A cilindrada entra **só se o nó dela estava no caminho**: a digitada para uma moto não vai para o carro. */
    ...(noDoPasso(nos, 'CILINDRADA') !== undefined && respostas.cilindrada !== undefined
      ? { cilindrada: respostas.cilindrada }
      : {}),
  }
}

/**
 * **A reserva, se as respostas formam uma.** Pura: o código e o instante vêm de fora, e as mesmas entradas
 * dão a mesma reserva — o que permite tentar gravar, colidir, gerar outro código e montar de novo.
 */
export function montarReserva(
  respostas: RespostasDaReserva,
  contexto: ContextoDaReserva,
  identidade: IdentidadeDaReserva,
): ResultadoDaMontagem {
  const roteiro = roteiroDaReserva(respostas, contexto)
  if (!roteiro.prontoParaConferir && roteiro.atual !== null) return { caso: 'INCOMPLETA', faltando: roteiro.atual }

  const primeiro = roteiro.nos[0] as NoDoRoteiro
  const categoria = noDoPasso(roteiro.nos, 'CATEGORIA')
  const escolhida = respostas.categoria
  if (categoria === undefined || escolhida === undefined || !categoria.opcoes.includes(escolhida)) {
    return { caso: 'INCOMPLETA', faltando: primeiro }
  }

  const base = montarBase(respostas, contexto, identidade)
  let reserva: Reserva | null
  switch (escolhida) {
    case 'PASSAGEIRO':
      reserva = deReservaDePassageiro(roteiro.nos, respostas, base)
      break
    case 'VEICULO':
      reserva = deReservaDeVeiculo(roteiro.nos, respostas, base, contexto)
      break
    default:
      return casoImpossivel(escolhida, 'montarReserva')
  }
  if (reserva === null) return { caso: 'INCOMPLETA', faltando: primeiro }

  const pendencias = pendenciasDaReserva(reserva)
  return pendencias.size > 0 ? { caso: 'INCOERENTE', pendencias } : { caso: 'OK', reserva }
}
