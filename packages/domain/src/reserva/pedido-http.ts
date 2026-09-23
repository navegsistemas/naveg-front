/**
 * **O pedido de reserva no fio** — o que o totem manda à API, e o que ela devolve.
 *
 * O navegador **não manda uma reserva**. Ele manda o que a pessoa pode afirmar — a ocorrência escolhida, as
 * respostas e o desafio — e o servidor monta a reserva com o código e o relógio **dele**, conferindo a
 * travessia contra o catálogo ao vivo. Uma reserva pronta vinda do navegador seria um documento que o público
 * escreve, e é justamente isso que a API existe para não ser.
 *
 * ### O decodificador é estrito de propósito
 *
 * Diferente dos decodificadores do catálogo (que toleram o que o aplicativo tolera, por paridade), este lê um
 * corpo que **só o nosso totem** escreve. O totem nunca manda um enum desconhecido, um número quebrado ou um
 * nome de mil caracteres; quem manda é outra coisa, e a resposta é `400`, não uma tentativa de entender.
 *
 * - enum fora do conjunto → `null` (o roteiro recusaria também, mas mais tarde e com outra cara);
 * - número que não é inteiro positivo → `null`;
 * - texto acima do limite → `null`;
 * - **a observação é ignorada**: o totem não tem esse campo, e um texto livre aberto ao público é o primeiro
 *   lugar que um abuso usa;
 * - chave desconhecida → ignorada.
 */
import { Acomodacao } from '../passagem/acomodacao.js'
import { CategoriaPassagem } from '../passagem/categoria-passagem.js'
import { ClasseVeiculo } from '../passagem/classe-veiculo.js'
import { NaturezaVeiculo } from '../passagem/natureza-veiculo.js'
import { TipoGratuidade } from '../passagem/tipo-gratuidade.js'
import { TipoPassagem } from '../passagem/tipo-passagem.js'
import { OcorrenciaViagem } from '../viagem/ocorrencia-viagem.js'
import type { ReservaDocumento } from './documento.js'
import type { RascunhoDoCliente, RespostasDaReserva } from './roteiro-da-reserva.js'

/** O nome de quem reserva cabe nisto. O campo da tela tem o mesmo limite. */
export const LIMITE_DO_NOME = 100
/** Um telefone digitado, com máscara e tudo, cabe nisto — o que passar não é telefone. */
export const LIMITE_DO_TELEFONE = 30
/** O token do Turnstile tem até 2048 caracteres, pela documentação da Cloudflare. */
export const LIMITE_DO_DESAFIO = 2048
/** Cilindrada acima disto não é moto de passageiro; é erro de digitação ou abuso. */
export const LIMITE_DA_CILINDRADA = 10_000
/** Quantidade de pessoas acima disto não cabe em acomodação nenhuma do catálogo. */
export const LIMITE_DE_PESSOAS = 50

/** O corpo do `POST /reservas`. */
export interface PedidoDeReserva {
  readonly ocorrencia: OcorrenciaViagem
  readonly respostas: RespostasDaReserva
  /** O token do Turnstile. Quem o confere é o servidor. */
  readonly desafio: string
}

/** O corpo como ele vai no fio. */
export interface PedidoDeReservaJson {
  readonly viagemId: string
  readonly data: string
  readonly respostas: RespostasDaReserva
  readonly desafio: string
}

/** O `201` do `POST /reservas`: o código **do servidor**, e a reserva como foi gravada. */
export interface ReservaCriadaJson {
  readonly codigo: string
  readonly reserva: ReservaDocumento
}

type Dado = Readonly<Record<string, unknown>>

function ehObjeto(valor: unknown): valor is Dado {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

/** Marca de "o corpo não serve" — lançada dentro do decodificador e convertida em `null` na borda dele. */
class Recusado extends Error {}

function textoOpcional(dado: Dado, chave: string, limite: number): string | undefined {
  const valor = dado[chave]
  if (valor === undefined) return undefined
  if (typeof valor !== 'string' || valor.length > limite) throw new Recusado()
  return valor
}

function enumOpcional<T>(dado: Dado, chave: string, ler: (valor: string) => T | null): T | undefined {
  const valor = dado[chave]
  if (valor === undefined) return undefined
  if (typeof valor !== 'string') throw new Recusado()
  const lido = ler(valor)
  if (lido === null) throw new Recusado()
  return lido
}

function inteiroOpcional(dado: Dado, chave: string, maximo: number): number | undefined {
  const valor = dado[chave]
  if (valor === undefined) return undefined
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > maximo) throw new Recusado()
  return valor
}

function lerCliente(valor: unknown): RascunhoDoCliente | undefined {
  if (valor === undefined) return undefined
  if (!ehObjeto(valor)) throw new Recusado()
  const nome = textoOpcional(valor, 'nome', LIMITE_DO_NOME)
  const telefone = textoOpcional(valor, 'telefone', LIMITE_DO_TELEFONE)
  return { ...(nome !== undefined ? { nome } : {}), ...(telefone !== undefined ? { telefone } : {}) }
}

function lerRespostas(dado: Dado): RespostasDaReserva {
  const campos = {
    categoria: enumOpcional(dado, 'categoria', CategoriaPassagem.de),
    acomodacao: enumOpcional(dado, 'acomodacao', Acomodacao.de),
    tipo: enumOpcional(dado, 'tipo', TipoPassagem.de),
    gratuidade: enumOpcional(dado, 'gratuidade', TipoGratuidade.de),
    quantidadePessoas: inteiroOpcional(dado, 'quantidadePessoas', LIMITE_DE_PESSOAS),
    naturezaVeiculo: enumOpcional(dado, 'naturezaVeiculo', NaturezaVeiculo.de),
    classeVeiculo: enumOpcional(dado, 'classeVeiculo', ClasseVeiculo.de),
    cilindrada: inteiroOpcional(dado, 'cilindrada', LIMITE_DA_CILINDRADA),
    cliente: lerCliente(dado['cliente']),
  }
  /* `exactOptionalPropertyTypes`: ausente é ausente, e não `undefined` guardado numa chave. */
  return Object.fromEntries(Object.entries(campos).filter(([, valor]) => valor !== undefined)) as RespostasDaReserva
}

/** As respostas do corpo, ou `null` quando algum campo não tem a forma que o totem manda. */
export function respostasDoJson(dado: unknown): RespostasDaReserva | null {
  if (!ehObjeto(dado)) return null
  try {
    return lerRespostas(dado)
  } catch (erro) {
    if (erro instanceof Recusado) return null
    throw erro
  }
}

/** O pedido inteiro, ou `null` quando o corpo não é um pedido. */
export function pedidoDeReservaDoJson(dado: unknown): PedidoDeReserva | null {
  if (!ehObjeto(dado)) return null
  const { viagemId, data, desafio } = dado
  if (typeof viagemId !== 'string' || typeof data !== 'string' || typeof desafio !== 'string') return null
  if (viagemId.length > 200 || desafio.trim().length === 0 || desafio.length > LIMITE_DO_DESAFIO) return null

  const ocorrencia = OcorrenciaViagem.de(viagemId, data)
  const respostas = respostasDoJson(dado['respostas'])
  if (ocorrencia === null || respostas === null) return null
  return { ocorrencia, respostas, desafio }
}
