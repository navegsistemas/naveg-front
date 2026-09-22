/**
 * **O codec `ReservaDocumento ⇄ Reserva`** — a forma do documento em `reservas/{codigo}`, com a mesma
 * disciplina do `PassagemDocumento` do fluviapp.
 *
 * ### Os nomes das chaves são o contrato
 *
 * A nota daquele arquivo vale aqui palavra por palavra: *"foi um nome inventado (`nome` onde o documento
 * diz `municipio`) que fez a Localidade abrir com a coluna de cidade em branco, sem erro nenhum"*. O
 * aplicativo vai ler este documento para emitir a passagem, e uma chave com outro nome não dá erro — dá um
 * campo vazio na tela do atendente. Por isso [CAMPOS_DO_DOCUMENTO] é exportada: é dela que a Rule do passo 9
 * deriva o `keys().hasOnly([...])`, e é contra ela que o cenário confere o que [paraDocumento] escreve.
 *
 * ### Os campos de consulta ficam no topo
 *
 * `status`, `viagemId`, `data` e `agenciaId` são o que a consulta do aplicativo recorta e o que a Rule
 * confere. Aninhá-los custaria caminho em cada índice composto e em cada linha de regra. Os
 * **sub-objetos** (`contato`, `veiculo`, cada item de `passageiros`) existem pela razão oposta: para serem
 * **ausentes ou inteiros** — nunca metade.
 *
 * ### O que o domínio não escreve: `criadoPor`
 *
 * A Rule do passo 9 exige `criadoPor == request.auth.uid`. Esse campo é do **adaptador** (`packages/dados`),
 * que conhece a autenticação; o domínio não conhece e não deve conhecer. Na leitura, chaves que o codec não
 * usa são ignoradas — quem **recusa chave extra** é a Rule, na escrita, que é onde a recusa protege.
 *
 * ### E o id não é um campo
 *
 * O código **é** o id do documento, e não se repete dentro dele: duas cópias do mesmo dado são duas
 * oportunidades de divergirem, e a que vale para as Rules é a do caminho.
 */
import { Acomodacao } from '../passagem/acomodacao.js'
import { CategoriaPassagem } from '../passagem/categoria-passagem.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import { TipoPassagem } from '../passagem/tipo-passagem.js'
import { TipoDocumento } from '../documento/tipo-documento.js'
import { DataCalendario, InstanteLocal } from '../primitivos/calendario.js'
import { casoImpossivel, deValor } from '../primitivos/fronteira.js'
import { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'
import { codigoValido } from './codigo-da-reserva.js'
import {
  ORIGENS_DA_RESERVA,
  pendenciasDaReserva,
  type ContatoDaReserva,
  type PessoaDaReserva,
  type Reserva,
  type VeiculoDaReserva,
} from './reserva.js'
import { StatusReserva } from './status-reserva.js'

export interface ContatoDocumento {
  readonly nome: string
  readonly whatsapp: string
}

/**
 * Uma pessoa, com **as chaves do `ClienteDocumento`** do aplicativo — `tipoDocumento`, `numeroDocumento`,
 * `dataNascimento` — e o número na forma canônica. Na conversão, o aplicativo lê cada item como leria um
 * cliente, e `clientes/{TIPO:numero}` é o documento certo sem consulta.
 */
export interface PessoaDocumento {
  readonly nome: string
  readonly tipoDocumento: string
  readonly numeroDocumento: string
  /** ISO `yyyy-MM-dd`, como o `ClienteDocumento` grava. */
  readonly dataNascimento: string
}

export interface VeiculoDocumento {
  readonly placa: string
  readonly modelo?: string
  readonly cor?: string
  readonly cilindrada?: number
}

/** A forma gravada. Toda enumeração é o **valor canônico** — o mesmo texto que o Kotlin grava. */
export interface ReservaDocumento {
  /** O discriminador: `PASSAGEIRO` ou `VEICULO`. Ausente ou ilegível faz o documento não virar nada. */
  readonly categoria: string
  readonly status: string
  readonly viagemId: string
  /** ISO `yyyy-MM-dd` — data de calendário, não instante. */
  readonly data: string
  readonly origem: string
  /** ISO `yyyy-MM-ddTHH:mm:ss`. */
  readonly criadoEm: string
  readonly expiraEm: string
  readonly contato: ContatoDocumento
  readonly agenciaId?: string
  readonly passagemId?: string
  readonly observacao?: string
  // --- só quando `categoria == PASSAGEIRO` ---
  readonly acomodacao?: string
  readonly tipo?: string
  /** Presente **só** quando `tipo == GRATUIDADE`. Campo de topo porque é sobre ele que a cota conta. */
  readonly gratuidade?: string
  /** Ordenados: o primeiro é o titular. */
  readonly passageiros?: readonly PessoaDocumento[]
  // --- só quando `categoria == VEICULO` ---
  readonly classe?: string
  readonly veiculo?: VeiculoDocumento
  /** Quem retira — ausente ou **inteiro**, como todo sub-objeto. */
  readonly responsavel?: PessoaDocumento
}

/**
 * Toda chave de topo que o codec pode escrever. É a lista "campos previstos" da Rule do passo 9 — mais o
 * `criadoPor`, que é do adaptador. `satisfies` é o que faz esquecer uma chave aqui virar erro de compilação.
 */
export const CAMPOS_DO_DOCUMENTO = [
  'categoria',
  'status',
  'viagemId',
  'data',
  'origem',
  'criadoEm',
  'expiraEm',
  'contato',
  'agenciaId',
  'passagemId',
  'observacao',
  'acomodacao',
  'tipo',
  'gratuidade',
  'passageiros',
  'classe',
  'veiculo',
  'responsavel',
] as const satisfies readonly (keyof ReservaDocumento)[]

/* A volta do `satisfies`: toda chave de `ReservaDocumento` está na lista. Se alguém acrescentar um campo à
   interface e esquecer a lista, esta linha deixa de compilar. */
type ChavesNaoListadas = Exclude<keyof ReservaDocumento, (typeof CAMPOS_DO_DOCUMENTO)[number]>
const _todasAsChavesListadas: ChavesNaoListadas extends never ? true : never = true
void _todasAsChavesListadas

// ---------------------------------------------------------------------------------------------------------
// Domínio → documento
// ---------------------------------------------------------------------------------------------------------

function contatoParaDocumento(contato: ContatoDaReserva): ContatoDocumento {
  return { nome: contato.nome, whatsapp: contato.whatsapp }
}

function pessoaParaDocumento(pessoa: PessoaDaReserva): PessoaDocumento {
  return {
    nome: pessoa.nome,
    tipoDocumento: pessoa.tipoDocumento,
    numeroDocumento: pessoa.numeroDocumento,
    dataNascimento: pessoa.dataNascimento,
  }
}

function veiculoParaDocumento(veiculo: VeiculoDaReserva): VeiculoDocumento {
  return {
    placa: veiculo.placa,
    ...(veiculo.modelo !== undefined ? { modelo: veiculo.modelo } : {}),
    ...(veiculo.cor !== undefined ? { cor: veiculo.cor } : {}),
    ...(veiculo.cilindrada !== undefined ? { cilindrada: veiculo.cilindrada } : {}),
  }
}

/**
 * Domínio para documento. Campo opcional ausente **não é escrito** — nem como `null`, nem como
 * `undefined`: o Firestore recusa `undefined` por padrão, e `null` é um valor que a Rule teria de prever.
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
    contato: contatoParaDocumento(reserva.contato),
    ...(reserva.agenciaId !== undefined ? { agenciaId: reserva.agenciaId } : {}),
    ...(reserva.passagemId !== undefined ? { passagemId: reserva.passagemId } : {}),
    ...(reserva.observacao !== undefined ? { observacao: reserva.observacao } : {}),
  }

  switch (reserva.categoria) {
    case 'PASSAGEIRO':
      return {
        ...comum,
        acomodacao: reserva.acomodacao,
        tipo: reserva.tipo,
        ...(reserva.gratuidade !== undefined ? { gratuidade: reserva.gratuidade } : {}),
        passageiros: reserva.passageiros.map(pessoaParaDocumento),
      }
    case 'VEICULO':
      return {
        ...comum,
        classe: reserva.classe,
        veiculo: veiculoParaDocumento(reserva.veiculo),
        ...(reserva.responsavel !== undefined ? { responsavel: pessoaParaDocumento(reserva.responsavel) } : {}),
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

/**
 * Campo opcional de texto: ausente → `undefined`; em branco → `undefined` (o formulário que manda `''`
 * não inventou um valor); presente e de outro tipo → [ILEGIVEL].
 */
function textoOpcional(dado: Dado, chave: string): string | undefined | typeof ILEGIVEL {
  const valor = dado[chave]
  if (valor === undefined || valor === null) return undefined
  if (typeof valor !== 'string') return ILEGIVEL
  const aparado = valor.trim()
  return aparado.length === 0 ? undefined : aparado
}

function contatoDoDocumento(valor: unknown): ContatoDaReserva | null {
  if (!ehObjeto(valor)) return null
  const nome = texto(valor, 'nome')
  const whatsapp = texto(valor, 'whatsapp')
  if (nome === undefined || whatsapp === undefined) return null
  return { nome, whatsapp }
}

/** Uma pessoa, com as recusas do `ClienteDocumento`: sem tipo de documento, o número não se interpreta. */
function pessoaDoDocumento(valor: unknown): PessoaDaReserva | null {
  if (!ehObjeto(valor)) return null
  const nome = texto(valor, 'nome')
  const tipoDocumento = TipoDocumento.de(texto(valor, 'tipoDocumento'))
  const numeroDocumento = texto(valor, 'numeroDocumento')
  const dataNascimento = DataCalendario.de(texto(valor, 'dataNascimento'))
  if (nome === undefined || tipoDocumento === null || numeroDocumento === undefined || dataNascimento === null) {
    return null
  }
  return { nome, tipoDocumento, numeroDocumento, dataNascimento }
}

function veiculoDoDocumento(valor: unknown): VeiculoDaReserva | null {
  if (!ehObjeto(valor)) return null
  const placa = texto(valor, 'placa')
  const modelo = textoOpcional(valor, 'modelo')
  const cor = textoOpcional(valor, 'cor')
  const cilindrada = valor['cilindrada']
  if (placa === undefined || modelo === ILEGIVEL || cor === ILEGIVEL) return null
  if (cilindrada !== undefined && (typeof cilindrada !== 'number' || !Number.isFinite(cilindrada))) {
    return null
  }
  return {
    placa,
    ...(modelo !== undefined ? { modelo } : {}),
    ...(cor !== undefined ? { cor } : {}),
    ...(cilindrada !== undefined ? { cilindrada } : {}),
  }
}

/**
 * **Documento para domínio — e recusa o que não reconhece.**
 *
 * Não há padrão inventado em lugar nenhum: documento que não forma uma reserva não vira reserva degradada,
 * **não vira nada** (`null`). Quem lista reservas descarta o `null`; quem abre uma pelo código mostra "não
 * encontrada". Os dois são melhores do que mostrar ao atendente uma reserva com um campo que ninguém
 * gravou.
 *
 * ### As recusas, e a régua que as une
 *
 * Recusa-se o documento **sem sujeito, sem lugar ou sem dono** — aquilo que nenhuma tela conserta:
 *
 * 1. **id** que não é um código `NVG-XXXXXX` — o documento não está onde uma reserva estaria;
 * 2. **categoria** ilegível — não se sabe sequer que pedido é;
 * 3. **ocorrência** ilegível (sem `viagemId`, ou `data` que não existe) — pedido sem travessia;
 * 4. **status** ou **origem** ilegíveis — a FSM e a origem são o que a Rule confere;
 * 5. **instantes** ilegíveis — sem `expiraEm`, ninguém sabe se o pedido ainda vale;
 * 6. **contato** ausente ou pela metade — a reserva existe para que alguém seja procurado;
 * 7. **sujeito** ausente — nenhum passageiro, ou nenhum veículo;
 * 8. **estado misto** — reserva de passageiro com `veiculo`, ou de veículo com `passageiros`. É
 *    exatamente o estado que o discriminador de categoria existe para tornar irrepresentável;
 * 9. **incoerência** — tudo legível, mas `pendenciasDaReserva` não está vazio: meia numa suíte, quatro
 *    pessoas num camarote, gratuidade sem subtipo.
 *
 * ### E a décima, que é a mais dura: um passageiro ilegível recusa a reserva inteira
 *
 * Seria possível descartar só aquele item e seguir com os outros. Não se faz, pela mesma razão que no
 * `PassagemDocumento` um lançamento ilegível recusa a passagem: **descartar em silêncio faz o pedido
 * valer menos do que valeu.** Uma suíte para três que chega ao atendente como suíte para dois vira uma
 * família com um membro sem bilhete no dia do embarque. Uma reserva que não aparece é um problema
 * visível; uma reserva com uma pessoa a menos é um problema invisível — e invisível é o que não se
 * conserta.
 */
export function paraDominio(id: string, dado: unknown): Reserva | null {
  if (!codigoValido(id) || !ehObjeto(dado)) return null

  const categoria = CategoriaPassagem.de(texto(dado, 'categoria'))
  const ocorrencia = OcorrenciaViagem.de(texto(dado, 'viagemId'), texto(dado, 'data'))
  const status = StatusReserva.de(texto(dado, 'status'))
  const origem = deValor(ORIGENS_DA_RESERVA, texto(dado, 'origem'))
  const criadoEm = InstanteLocal.de(texto(dado, 'criadoEm'))
  const expiraEm = InstanteLocal.de(texto(dado, 'expiraEm'))
  const contato = contatoDoDocumento(dado['contato'])
  if (
    categoria === null ||
    ocorrencia === null ||
    status === null ||
    origem === null ||
    criadoEm === null ||
    expiraEm === null ||
    contato === null
  ) {
    return null
  }

  const agenciaId = textoOpcional(dado, 'agenciaId')
  const passagemId = textoOpcional(dado, 'passagemId')
  const observacao = textoOpcional(dado, 'observacao')
  if (agenciaId === ILEGIVEL || passagemId === ILEGIVEL || observacao === ILEGIVEL) return null

  const comum = {
    codigo: id,
    ocorrencia,
    contato,
    status,
    origem,
    criadoEm,
    expiraEm,
    ...(agenciaId !== undefined ? { agenciaId } : {}),
    ...(passagemId !== undefined ? { passagemId } : {}),
    ...(observacao !== undefined ? { observacao } : {}),
  }

  let reserva: Reserva
  switch (categoria) {
    case 'PASSAGEIRO': {
      if (dado['veiculo'] !== undefined || dado['classe'] !== undefined) return null

      const acomodacao = Acomodacao.de(texto(dado, 'acomodacao'))
      const tipo = TipoPassagem.de(texto(dado, 'tipo'))
      const gratuidadeBruta = textoOpcional(dado, 'gratuidade')
      if (acomodacao === null || tipo === null || gratuidadeBruta === ILEGIVEL) return null
      const gratuidade = gratuidadeBruta === undefined ? undefined : TipoGratuidade.de(gratuidadeBruta)
      if (gratuidade === null) return null

      const lista = dado['passageiros']
      if (!Array.isArray(lista)) return null
      const passageiros = lista.map(pessoaDoDocumento)
      /* A décima recusa: um ilegível derruba todos. Ver o KDoc acima. */
      if (passageiros.some((passageiro) => passageiro === null)) return null
      const [titular, ...acompanhantes] = passageiros as PessoaDaReserva[]
      if (titular === undefined) return null

      reserva = {
        ...comum,
        categoria,
        acomodacao,
        tipo,
        ...(gratuidade !== undefined ? { gratuidade } : {}),
        passageiros: [titular, ...acompanhantes],
      }
      break
    }
    case 'VEICULO': {
      if (dado['passageiros'] !== undefined || dado['acomodacao'] !== undefined) return null

      const classe = ClasseVeiculo.de(texto(dado, 'classe'))
      const veiculo = veiculoDoDocumento(dado['veiculo'])
      /* Ausente é a forma normal; presente e ilegível recusa — sub-objeto é ausente ou inteiro. */
      const brutoResponsavel = dado['responsavel']
      const responsavel = brutoResponsavel === undefined ? undefined : pessoaDoDocumento(brutoResponsavel)
      if (classe === null || veiculo === null || responsavel === null) return null

      reserva = {
        ...comum,
        categoria,
        classe,
        veiculo,
        ...(responsavel !== undefined ? { responsavel } : {}),
      }
      break
    }
    default:
      return casoImpossivel(categoria, 'paraDominio')
  }

  return pendenciasDaReserva(reserva).size === 0 ? reserva : null
}
