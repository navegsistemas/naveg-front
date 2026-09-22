/**
 * **Das respostas à `Reserva`** — o único caminho, e ele só se abre quando o roteiro fecha.
 *
 * Sem este arquivo, quem montaria a reserva seria a ilha React — e montar a reserva é decidir **quais
 * respostas contam**, que é regra de domínio.
 *
 * ### Ele lê o roteiro, não as respostas
 *
 * A montagem percorre **os nós que o roteiro devolveu** e lê a resposta de cada um. Se o nó do subtipo de
 * gratuidade não está no caminho, a `gratuidade` que sobrou não entra; se há dois nós `QUEM_VIAJA`, entram
 * duas pessoas; se a natureza tem uma classe só naquele casco, a classe é a derivada, não a que sobrou.
 * **O roteiro é a única fonte do que foi perguntado** — e só o que foi perguntado é resposta.
 *
 * ### A validade vem da travessia
 *
 * `expiraEm` é `validadeDaReserva(contexto.partida)` — hoje, a própria partida. Não há parâmetro de
 * validade: ela é consequência da ocorrência escolhida, calculada do catálogo do fluviapp, e não uma
 * escolha de quem monta. E se o navio já partiu quando a pessoa confirma, a reserva nasce com a pendência
 * `VALIDADE` — o terminal ficou aberto na tela de conferência, e o barco não esperou.
 */
import { DataCalendario, type InstanteLocal } from '../primitivos/calendario.js'
import { casoImpossivel } from '../primitivos/fronteira.js'
import { TipoDocumento } from '../documento/tipo-documento.js'
import { normalizarWhatsapp } from './contato.js'
import {
  pendenciasDaReserva,
  placaCanonica,
  type ContatoDaReserva,
  type PassageiroDaReserva,
  type PendenciaDaReserva,
  type PessoaDaReserva,
  type Reserva,
  type ReservaDePassageiro,
  type ReservaDeVeiculo,
  type VeiculoDaReserva,
} from './reserva.js'
import {
  pessoasDoBilhete,
  roteiroDaReserva,
  SEM_RESPONSAVEL,
  tipoEmVigor,
  type ContextoDaReserva,
  type NoDoRoteiro,
  type RascunhoDePessoa,
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

function montarContato(respostas: RespostasDaReserva): ContatoDaReserva {
  const bruto = aparado(respostas.contato?.whatsapp)
  /* O número que não normaliza entra **como foi digitado**: o agregado o recusa por `CONTATO_WHATSAPP`,
     junto com as demais pendências, em vez de a montagem parar no primeiro erro. */
  return { nome: aparado(respostas.contato?.nome), whatsapp: normalizarWhatsapp(bruto) ?? bruto }
}

/** Rascunho → pessoa. `null` só quando a data não existe no calendário — a única conversão que falha. */
function montarPessoa(rascunho: RascunhoDePessoa): PessoaDaReserva | null {
  const dataNascimento = DataCalendario.de(rascunho.dataNascimento)
  const tipoDocumento = rascunho.tipoDocumento
  if (dataNascimento === null || tipoDocumento === undefined) return null
  return {
    nome: aparado(rascunho.nome),
    tipoDocumento,
    numeroDocumento: TipoDocumento.normalizar(tipoDocumento, rascunho.numeroDocumento),
    dataNascimento,
  }
}

type Base = Omit<ReservaDePassageiro, 'categoria' | 'acomodacao' | 'tipo' | 'gratuidade' | 'passageiros'>

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
    contato: montarContato(respostas),
    status: STATUS_DA_WEB,
    origem: 'TOTEM_WEB',
    criadoEm: identidade.criadoEm,
    expiraEm: validadeDaReserva(contexto.partida),
    ...(agenciaId.length > 0 ? { agenciaId } : {}),
    ...(observacao.length > 0 ? { observacao } : {}),
  }
}

type Conversao<T> = { readonly reserva: T } | { readonly pendencias: ReadonlySet<PendenciaDaReserva> }

function deReservaDePassageiro(
  nos: readonly NoDoRoteiro[],
  respostas: RespostasDaReserva,
  base: Base,
): Conversao<ReservaDePassageiro> {
  const acomodacao = respostas.acomodacao
  /* O roteiro fechou, então estes existem — é o compilador pedindo a prova. */
  if (acomodacao === undefined) return { pendencias: new Set(['TIPO_NAO_ADMITIDO']) }
  const tipo = tipoEmVigor(respostas, acomodacao)
  if (tipo === undefined) return { pendencias: new Set(['TIPO_NAO_ADMITIDO']) }

  /* O subtipo entra **só se o nó dele estava no caminho**. */
  const gratuidade = noDoPasso(nos, 'TIPO_GRATUIDADE') === undefined ? undefined : respostas.gratuidade

  const pessoas = nos.filter((no): no is No<'QUEM_VIAJA'> => no.passo === 'QUEM_VIAJA')
  if (pessoas.length !== pessoasDoBilhete(respostas, acomodacao)) return { pendencias: new Set(['OCUPACAO_EXCEDIDA']) }

  const passageiros: PassageiroDaReserva[] = []
  for (const no of pessoas) {
    const passageiro = montarPessoa(respostas.passageiros?.[no.pessoa] ?? {})
    if (passageiro === null) return { pendencias: new Set(['NASCIMENTO']) }
    passageiros.push(passageiro)
  }
  const [titular, ...acompanhantes] = passageiros
  if (titular === undefined) return { pendencias: new Set(['PASSAGEIRO_INCOMPLETO']) }

  return {
    reserva: {
      ...base,
      categoria: 'PASSAGEIRO',
      acomodacao,
      tipo,
      ...(gratuidade !== undefined ? { gratuidade } : {}),
      passageiros: [titular, ...acompanhantes],
    },
  }
}

function deReservaDeVeiculo(
  nos: readonly NoDoRoteiro[],
  respostas: RespostasDaReserva,
  base: Base,
): Conversao<ReservaDeVeiculo> {
  /* A classe vem do nó — a escolhida ou a derivada da natureza, nunca a que sobrou nas respostas. */
  const dados = noDoPasso(nos, 'DADOS_VEICULO')
  if (dados === undefined) return { pendencias: new Set(['PLACA']) }

  const perguntados = new Set(dados.campos)
  const rascunho = respostas.veiculo ?? {}
  const modelo = aparado(rascunho.modelo)
  const cor = aparado(rascunho.cor)

  const veiculo: VeiculoDaReserva = {
    placa: placaCanonica(rascunho.placa),
    ...(modelo.length > 0 ? { modelo } : {}),
    ...(cor.length > 0 ? { cor } : {}),
    /* A cilindrada digitada para uma moto não sobrevive à troca para carro — o carro não a pergunta. */
    ...(perguntados.has('CILINDRADA') && rascunho.cilindrada !== undefined ? { cilindrada: rascunho.cilindrada } : {}),
  }

  let responsavel: PessoaDaReserva | undefined
  if (respostas.responsavel !== undefined && respostas.responsavel !== SEM_RESPONSAVEL) {
    const pessoa = montarPessoa(respostas.responsavel)
    if (pessoa === null) return { pendencias: new Set(['NASCIMENTO']) }
    responsavel = pessoa
  }

  return {
    reserva: {
      ...base,
      categoria: 'VEICULO',
      classe: dados.classe,
      veiculo,
      ...(responsavel !== undefined ? { responsavel } : {}),
    },
  }
}

/**
 * **A reserva, se as respostas formam uma.** Pura: o código e o instante vêm de fora, e as mesmas entradas
 * dão a mesma reserva — o que permite ao passo 9 tentar gravar, colidir, gerar outro código e montar de novo.
 */
export function montarReserva(
  respostas: RespostasDaReserva,
  contexto: ContextoDaReserva,
  identidade: IdentidadeDaReserva,
): ResultadoDaMontagem {
  const roteiro = roteiroDaReserva(respostas, contexto)
  if (!roteiro.prontoParaConferir && roteiro.atual !== null) return { caso: 'INCOMPLETA', faltando: roteiro.atual }

  const categoria = noDoPasso(roteiro.nos, 'CATEGORIA')
  const escolhida = respostas.categoria
  if (categoria === undefined || escolhida === undefined || !categoria.opcoes.includes(escolhida)) {
    return { caso: 'INCOMPLETA', faltando: roteiro.nos[0] as NoDoRoteiro }
  }

  const base = montarBase(respostas, contexto, identidade)
  let conversao: Conversao<Reserva>
  switch (escolhida) {
    case 'PASSAGEIRO':
      conversao = deReservaDePassageiro(roteiro.nos, respostas, base)
      break
    case 'VEICULO':
      conversao = deReservaDeVeiculo(roteiro.nos, respostas, base)
      break
    default:
      return casoImpossivel(escolhida, 'montarReserva')
  }

  if ('pendencias' in conversao) return { caso: 'INCOERENTE', pendencias: conversao.pendencias }

  const pendencias = pendenciasDaReserva(conversao.reserva)
  return pendencias.size > 0 ? { caso: 'INCOERENTE', pendencias } : { caso: 'OK', reserva: conversao.reserva }
}
