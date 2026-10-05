/**
 * **O codec `ReservaDocumento ⇄ Reserva`** — a forma do documento em `reservas/{codigo}`, com a mesma
 * disciplina do `PassagemDocumento` do fluviapp.
 *
 * ### Os nomes das chaves são o contrato
 *
 * *"Foi um nome inventado (`nome` onde o documento diz `municipio`) que fez a Localidade abrir com a coluna de
 * cidade em branco, sem erro nenhum."* O aplicativo vai ler este documento para emitir a passagem, e uma chave
 * com outro nome não dá erro — dá um campo vazio na tela do atendente. Por isso [CAMPOS_DO_DOCUMENTO] é
 * exportada: é dela que a Rule deriva o `keys().hasOnly([...])`.
 *
 * ### Os campos de consulta ficam no topo
 *
 * `status`, `viagemId`, `data` e `agenciaId` são o que a consulta do aplicativo recorta e o que a Rule
 * confere. O `cliente` e o `destinatario` são os únicos **sub-objetos**, e existem para ser **ausentes ou
 * inteiros** — nunca metade.
 *
 * ### Três ramos, e as chaves de um não aparecem no outro
 *
 * `PASSAGEIRO`, `VEICULO` e `ENCOMENDA` têm chaves exclusivas. A de passagem converte em passagem
 * (`passagemId`); a de encomenda, em encomenda (`encomendaId`). A presença de uma chave de outro ramo é estado
 * misto, e o documento não vira nada — como no `ReservaDocumento.kt`.
 *
 * ### E o id não é um campo
 *
 * O código **é** o id do documento, e não se repete dentro dele: duas cópias do mesmo dado são duas
 * oportunidades de divergirem, e a que vale para as Rules é a do caminho.
 */
import { FaixaPeso, Retirada, TipoVolume } from '../encomenda/volume.js'
import { Acomodacao } from '../passagem/acomodacao.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import { TipoPassagem } from '../passagem/tipo-passagem.js'
import { InstanteLocal } from '../primitivos/calendario.js'
import { casoImpossivel, deValor } from '../primitivos/fronteira.js'
import { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'
import { codigoValido } from './codigo-da-reserva.js'
import {
  CATEGORIAS_DE_RESERVA,
  ORIGENS_DA_RESERVA,
  pendenciasDaReserva,
  type ClienteDaReserva,
  type DestinatarioDaEncomenda,
  type Reserva,
  type Tratamento,
} from './reserva.js'
import { StatusReserva } from './status-reserva.js'

/** Quem pediu, com as chaves do `ClienteDocumento` do aplicativo (`nome`, `telefone`). */
export interface ClienteDocumento {
  readonly nome: string
  readonly telefone?: string
}

/** Quem retira a encomenda — a mesma forma do [ClienteDocumento], com o celular obrigatório (C5). */
export interface DestinatarioDocumento {
  readonly nome: string
  readonly telefone: string
}

/** O carimbo de quem tratou — `{porId, em}`, escrito pelo fluviapp. */
export interface TratamentoDocumento {
  readonly porId: string
  /** ISO `yyyy-MM-ddTHH:mm:ss`, no fuso da operação. */
  readonly em: string
}

/** A forma gravada. Toda enumeração é o **valor canônico** — o mesmo texto que o Kotlin grava. */
export interface ReservaDocumento {
  /** O discriminador: `PASSAGEIRO`, `VEICULO` ou `ENCOMENDA`. Ausente ou ilegível faz o documento não virar nada. */
  readonly categoria: string
  readonly status: string
  readonly viagemId: string
  /** ISO `yyyy-MM-dd` — data de calendário, não instante. */
  readonly data: string
  readonly origem: string
  /** ISO `yyyy-MM-ddTHH:mm:ss`, no fuso da operação. */
  readonly criadoEm: string
  readonly expiraEm: string
  readonly cliente: ClienteDocumento
  readonly agenciaId?: string
  /** A passagem que nasceu da conversão — só nos ramos de passagem. */
  readonly passagemId?: string
  /** A encomenda que nasceu da conversão — só no ramo `ENCOMENDA`. */
  readonly encomendaId?: string
  readonly observacao?: string
  // --- só quando `categoria == PASSAGEIRO` ---
  readonly acomodacao?: string
  readonly tipo?: string
  /** Presente **só** quando `tipo == GRATUIDADE`. Campo de topo porque é sobre ele que a cota conta. */
  readonly gratuidade?: string
  readonly quantidadePessoas?: number
  // --- só quando `categoria == VEICULO` ---
  readonly classe?: string
  readonly cilindrada?: number
  // --- só quando `categoria == ENCOMENDA` ---
  readonly tipoVolume?: string
  readonly quantidadeVolumes?: number
  readonly complemento?: string
  readonly faixaPeso?: string
  readonly retirada?: string
  /** Presente **só** com `retirada == OUTRA_PESSOA`, e obrigatório nesse caso. */
  readonly destinatario?: DestinatarioDocumento
  // --- só do fluviapp: quem cancelou ou converteu ---
  readonly tratamento?: TratamentoDocumento
}

/**
 * Toda chave de topo que o codec pode escrever — a lista "campos previstos" da Rule, **na ordem do
 * `ReservaDocumento.kt`**, que o teste de contrato confere. `satisfies` faz esquecer uma chave aqui virar erro de
 * compilação.
 */
export const CAMPOS_DO_DOCUMENTO = [
  'categoria',
  'status',
  'viagemId',
  'data',
  'origem',
  'criadoEm',
  'expiraEm',
  'cliente',
  'agenciaId',
  'passagemId',
  'encomendaId',
  'observacao',
  'acomodacao',
  'tipo',
  'gratuidade',
  'quantidadePessoas',
  'classe',
  'cilindrada',
  'tipoVolume',
  'quantidadeVolumes',
  'complemento',
  'faixaPeso',
  'retirada',
  'destinatario',
  'tratamento',
] as const satisfies readonly (keyof ReservaDocumento)[]

/* A volta do `satisfies`: toda chave de `ReservaDocumento` está na lista. */
type ChavesNaoListadas = Exclude<keyof ReservaDocumento, (typeof CAMPOS_DO_DOCUMENTO)[number]>
const _todasAsChavesListadas: ChavesNaoListadas extends never ? true : never = true
void _todasAsChavesListadas

/** As chaves exclusivas de cada ramo — a presença de uma de outro ramo é estado misto. */
const DO_PASSAGEIRO = ['acomodacao', 'tipo', 'gratuidade', 'quantidadePessoas'] as const
const DO_VEICULO = ['classe', 'cilindrada'] as const
const DA_PASSAGEM = [...DO_PASSAGEIRO, ...DO_VEICULO, 'passagemId'] as const
const DA_ENCOMENDA = [
  'tipoVolume',
  'quantidadeVolumes',
  'complemento',
  'faixaPeso',
  'retirada',
  'destinatario',
  'encomendaId',
] as const

// ---------------------------------------------------------------------------------------------------------
// Domínio → documento
// ---------------------------------------------------------------------------------------------------------

/**
 * Domínio para documento. Campo opcional ausente **não é escrito** — nem como `null`, nem como `undefined`:
 * o Firestore recusa `undefined` por padrão, e `null` é um valor que a Rule teria de prever.
 */
export function paraDocumento(reserva: Reserva): ReservaDocumento {
  const comum = {
    categoria: reserva.categoria,
    status: reserva.status,
    viagemId: reserva.ocorrencia.viagemId,
    data: reserva.ocorrencia.data,
    origem: reserva.origem,
    criadoEm: reserva.criadoEm,
    expiraEm: reserva.expiraEm,
    cliente: {
      nome: reserva.cliente.nome,
      ...(reserva.cliente.telefone !== undefined ? { telefone: reserva.cliente.telefone } : {}),
    },
    ...(reserva.agenciaId !== undefined ? { agenciaId: reserva.agenciaId } : {}),
    ...(reserva.observacao !== undefined ? { observacao: reserva.observacao } : {}),
    ...(reserva.tratamento !== undefined
      ? { tratamento: { porId: reserva.tratamento.porId, em: reserva.tratamento.em } }
      : {}),
  }

  switch (reserva.categoria) {
    case 'PASSAGEIRO':
      return {
        ...comum,
        ...(reserva.passagemId !== undefined ? { passagemId: reserva.passagemId } : {}),
        acomodacao: reserva.acomodacao,
        tipo: reserva.tipo,
        ...(reserva.gratuidade !== undefined ? { gratuidade: reserva.gratuidade } : {}),
        quantidadePessoas: reserva.quantidadePessoas,
      }
    case 'VEICULO':
      return {
        ...comum,
        ...(reserva.passagemId !== undefined ? { passagemId: reserva.passagemId } : {}),
        classe: reserva.classe,
        ...(reserva.cilindrada !== undefined ? { cilindrada: reserva.cilindrada } : {}),
      }
    case 'ENCOMENDA':
      return {
        ...comum,
        ...(reserva.encomendaId !== undefined ? { encomendaId: reserva.encomendaId } : {}),
        tipoVolume: reserva.tipoVolume,
        quantidadeVolumes: reserva.quantidadeVolumes,
        ...(reserva.complemento !== undefined ? { complemento: reserva.complemento } : {}),
        faixaPeso: reserva.faixaPeso,
        retirada: reserva.retirada,
        ...(reserva.destinatario !== undefined
          ? { destinatario: { nome: reserva.destinatario.nome, telefone: reserva.destinatario.telefone } }
          : {}),
      }
    default:
      return casoImpossivel(reserva, 'paraDocumento')
  }
}

// ---------------------------------------------------------------------------------------------------------
// Documento → domínio
// ---------------------------------------------------------------------------------------------------------

type Dado = Readonly<Record<string, unknown>>

/** `undefined` = ausente; `null` = presente e ilegível. A diferença é o que separa "opcional" de "quebrado". */
const ILEGIVEL = null

function ehObjeto(valor: unknown): valor is Dado {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function texto(dado: Dado, chave: string): string | undefined {
  const valor = dado[chave]
  return typeof valor === 'string' ? valor : undefined
}

/** Texto opcional: ausente ou em branco → `undefined`; de outro tipo → [ILEGIVEL]. */
function textoOpcional(dado: Dado, chave: string): string | undefined | typeof ILEGIVEL {
  const valor = dado[chave]
  if (valor === undefined || valor === null) return undefined
  if (typeof valor !== 'string') return ILEGIVEL
  const aparado = valor.trim()
  return aparado.length === 0 ? undefined : aparado
}

/** Número opcional: ausente → `undefined`; não finito ou de outro tipo → [ILEGIVEL]. */
function numeroOpcional(dado: Dado, chave: string): number | undefined | typeof ILEGIVEL {
  const valor = dado[chave]
  if (valor === undefined) return undefined
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : ILEGIVEL
}

/**
 * O carimbo: inteiro, ou ausente. Pela metade ou de tipo errado é **ilegível, e ilegível aqui é ausente** —
 * "ninguém tratou que se saiba" —, e não recusa: quem cancelou não muda o que o cliente pediu. É a leitura
 * do `TratamentoDocumento` do fluviapp-kmp.
 */
function tratamentoDoDocumento(valor: unknown): Tratamento | undefined {
  if (!ehObjeto(valor)) return undefined
  const porId = textoOpcional(valor, 'porId')
  const em = InstanteLocal.de(texto(valor, 'em'))
  if (porId === undefined || porId === ILEGIVEL || em === null) return undefined
  return { porId, em }
}

function clienteDoDocumento(valor: unknown): ClienteDaReserva | null {
  if (!ehObjeto(valor)) return null
  const nome = texto(valor, 'nome')
  const telefone = textoOpcional(valor, 'telefone')
  if (nome === undefined || telefone === ILEGIVEL) return null
  return { nome, ...(telefone !== undefined ? { telefone } : {}) }
}

/**
 * O destinatário: ausente, ou inteiro. **Pela metade é recusa**, e não um destinatário inventado — numa
 * encomenda que outra pessoa retira, sem o celular dela o destino não tem como avisar. Como no KMP.
 */
function destinatarioDoDocumento(valor: unknown): DestinatarioDaEncomenda | undefined | typeof ILEGIVEL {
  if (valor === undefined || valor === null) return undefined
  if (!ehObjeto(valor)) return ILEGIVEL
  const nome = texto(valor, 'nome')
  const telefone = textoOpcional(valor, 'telefone')
  if (nome === undefined || telefone === undefined || telefone === ILEGIVEL) return ILEGIVEL
  return { nome, telefone }
}

/**
 * **Documento para domínio — e recusa o que não reconhece.** Documento que não forma uma reserva não vira
 * reserva degradada, **não vira nada** (`null`).
 *
 * ### As recusas, e a régua que as une
 *
 * Recusa-se o documento **sem sujeito, sem lugar ou sem dono** — aquilo que nenhuma tela conserta:
 *
 * 1. **id** que não é um código `NVG-XXXXXX`;
 * 2. **categoria** ilegível — não se sabe sequer que pedido é;
 * 3. **ocorrência** ilegível (sem `viagemId`, ou `data` que não existe) — pedido sem travessia;
 * 4. **status** ou **origem** ilegíveis — a FSM e a origem são o que a Rule confere;
 * 5. **instantes** ilegíveis — sem `expiraEm`, ninguém sabe se o pedido ainda vale;
 * 6. **cliente** ausente ou sem nome — a reserva existe para que alguém seja atendido;
 * 7. **o que define o pedido** ausente — acomodação, tipo e quantidade; a classe do veículo; ou o tipo do
 *    volume, a quantidade, a faixa de peso e quem retira;
 * 8. **estado misto** — reserva de passageiro com `classe`, de veículo com `acomodacao`, de passagem com chave de
 *    encomenda, de encomenda com `passagemId`; ou o destinatário pela metade;
 * 9. **incoerência** — tudo legível, mas `pendenciasDaReserva` não está vazio: meia numa suíte, quatro
 *    pessoas num camarote, gratuidade sem subtipo, moto sem cilindrada, 21 volumes, outra pessoa retira e não
 *    há destinatário.
 *
 * Chaves que o codec não usa são ignoradas na leitura — quem recusa chave extra é a Rule, na escrita.
 */
export function paraDominio(id: string, dado: unknown): Reserva | null {
  if (!codigoValido(id) || !ehObjeto(dado)) return null

  const categoria = deValor(CATEGORIAS_DE_RESERVA, texto(dado, 'categoria'))
  const ocorrencia = OcorrenciaViagem.de(texto(dado, 'viagemId'), texto(dado, 'data'))
  const status = StatusReserva.de(texto(dado, 'status'))
  const origem = deValor(ORIGENS_DA_RESERVA, texto(dado, 'origem'))
  const criadoEm = InstanteLocal.de(texto(dado, 'criadoEm'))
  const expiraEm = InstanteLocal.de(texto(dado, 'expiraEm'))
  const cliente = clienteDoDocumento(dado['cliente'])
  if (
    categoria === null ||
    ocorrencia === null ||
    status === null ||
    origem === null ||
    criadoEm === null ||
    expiraEm === null ||
    cliente === null
  ) {
    return null
  }

  const agenciaId = textoOpcional(dado, 'agenciaId')
  const observacao = textoOpcional(dado, 'observacao')
  if (agenciaId === ILEGIVEL || observacao === ILEGIVEL) return null
  const tratamento = tratamentoDoDocumento(dado['tratamento'])

  const comum = {
    codigo: id,
    ocorrencia,
    cliente,
    status,
    origem,
    criadoEm,
    expiraEm,
    ...(agenciaId !== undefined ? { agenciaId } : {}),
    ...(observacao !== undefined ? { observacao } : {}),
    ...(tratamento !== undefined ? { tratamento } : {}),
  }

  let reserva: Reserva
  switch (categoria) {
    case 'PASSAGEIRO': {
      if (DO_VEICULO.some((chave) => dado[chave] !== undefined)) return null
      if (DA_ENCOMENDA.some((chave) => dado[chave] !== undefined)) return null

      const acomodacao = Acomodacao.de(texto(dado, 'acomodacao'))
      const tipo = TipoPassagem.de(texto(dado, 'tipo'))
      const quantidadePessoas = numeroOpcional(dado, 'quantidadePessoas')
      const gratuidadeBruta = textoOpcional(dado, 'gratuidade')
      const passagemId = textoOpcional(dado, 'passagemId')
      if (
        acomodacao === null ||
        tipo === null ||
        quantidadePessoas === undefined ||
        quantidadePessoas === ILEGIVEL ||
        gratuidadeBruta === ILEGIVEL ||
        passagemId === ILEGIVEL
      ) {
        return null
      }
      const gratuidade = gratuidadeBruta === undefined ? undefined : TipoGratuidade.de(gratuidadeBruta)
      if (gratuidade === null) return null

      reserva = {
        ...comum,
        ...(passagemId !== undefined ? { passagemId } : {}),
        categoria,
        acomodacao,
        tipo,
        ...(gratuidade !== undefined ? { gratuidade } : {}),
        quantidadePessoas,
      }
      break
    }
    case 'VEICULO': {
      if (DO_PASSAGEIRO.some((chave) => dado[chave] !== undefined)) return null
      if (DA_ENCOMENDA.some((chave) => dado[chave] !== undefined)) return null

      const classe = ClasseVeiculo.de(texto(dado, 'classe'))
      const cilindrada = numeroOpcional(dado, 'cilindrada')
      const passagemId = textoOpcional(dado, 'passagemId')
      if (classe === null || cilindrada === ILEGIVEL || passagemId === ILEGIVEL) return null

      reserva = {
        ...comum,
        ...(passagemId !== undefined ? { passagemId } : {}),
        categoria,
        classe,
        ...(cilindrada !== undefined ? { cilindrada } : {}),
      }
      break
    }
    case 'ENCOMENDA': {
      if (DA_PASSAGEM.some((chave) => dado[chave] !== undefined)) return null

      const tipoVolume = TipoVolume.de(texto(dado, 'tipoVolume'))
      const quantidadeVolumes = numeroOpcional(dado, 'quantidadeVolumes')
      const complemento = textoOpcional(dado, 'complemento')
      const faixaPeso = FaixaPeso.de(texto(dado, 'faixaPeso'))
      const retirada = Retirada.de(texto(dado, 'retirada'))
      const destinatario = destinatarioDoDocumento(dado['destinatario'])
      const encomendaId = textoOpcional(dado, 'encomendaId')
      if (
        tipoVolume === null ||
        quantidadeVolumes === undefined ||
        quantidadeVolumes === ILEGIVEL ||
        complemento === ILEGIVEL ||
        faixaPeso === null ||
        retirada === null ||
        destinatario === ILEGIVEL ||
        encomendaId === ILEGIVEL
      ) {
        return null
      }

      reserva = {
        ...comum,
        ...(encomendaId !== undefined ? { encomendaId } : {}),
        categoria,
        tipoVolume,
        quantidadeVolumes,
        ...(complemento !== undefined ? { complemento } : {}),
        faixaPeso,
        retirada,
        ...(destinatario !== undefined ? { destinatario } : {}),
      }
      break
    }
    default:
      return casoImpossivel(categoria, 'paraDominio')
  }

  return pendenciasDaReserva(reserva).size === 0 ? reserva : null
}
