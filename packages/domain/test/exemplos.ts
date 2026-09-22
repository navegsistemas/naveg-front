/**
 * **Os exemplos que os cenários compartilham.**
 *
 * Mora em `test/`, e não em `src/`, por um motivo deste projeto: o README proíbe conteúdo inventado que
 * possa chegar à página parecendo pronto. Dado de exemplo dentro de `src/` é importável pela ilha — e um CPF
 * de teste num formulário pré-preenchido é exatamente como isso acontece.
 *
 * Os CPFs abaixo têm **dígito verificador correto**, conferido pelo próprio algoritmo — são os números de
 * exemplo de uso corrente em documentação, não de pessoas.
 */
import { DataCalendario, InstanteLocal } from '../src/primitivos/calendario.js'
import type { OcorrenciaViagem } from '../src/viagem/ocorrencia-viagem.js'
import type { TipoEmbarcacao } from '../src/viagem/tipo-embarcacao.js'
import type {
  ContextoDaReserva,
  RascunhoDePessoa,
  RespostasDaReserva,
} from '../src/reserva/roteiro-da-reserva.js'
import type { IdentidadeDaReserva } from '../src/reserva/montagem-da-reserva.js'

export const CPFS_VALIDOS = ['52998224725', '11144477735', '39053344705'] as const

export function data(texto: string): DataCalendario {
  const lida = DataCalendario.de(texto)
  if (lida === null) throw new Error(`exemplo com data inválida: ${texto}`)
  return lida
}

export function instante(texto: string): InstanteLocal {
  const lido = InstanteLocal.de(texto)
  if (lido === null) throw new Error(`exemplo com instante inválido: ${texto}`)
  return lido
}

/** Uma quarta-feira. A saída é às 18:00 — é a partida, e portanto a validade da reserva. */
export const OCORRENCIA: OcorrenciaViagem = { viagemId: 'viagem-quarta-18h', data: data('2026-10-14') }
export const PARTIDA = instante('2026-10-14T18:00:00')

export function contexto(tipoEmbarcacao: TipoEmbarcacao = 'FERRY_BOAT'): ContextoDaReserva {
  return { ocorrencia: OCORRENCIA, tipoEmbarcacao, partida: PARTIDA }
}

export const IDENTIDADE: IdentidadeDaReserva = {
  codigo: 'NVG-7K3QP2',
  criadoEm: instante('2026-10-01T23:30:00'),
}

export function pessoa(indice: number): RascunhoDePessoa {
  return {
    nome: `Passageiro ${indice + 1}`,
    tipoDocumento: 'CPF',
    numeroDocumento: CPFS_VALIDOS[indice % CPFS_VALIDOS.length] as string,
    dataNascimento: '1980-05-17',
  }
}

export const CONTATO = { nome: 'Maria Souza', whatsapp: '(91) 98888-7777' } as const

/** Uma rede inteira para uma pessoa, respondida até o contato. O caminho mais curto que fecha. */
export const REDE_COMPLETA: RespostasDaReserva = {
  categoria: 'PASSAGEIRO',
  acomodacao: 'REDE',
  tipo: 'INTEIRA',
  passageiros: [pessoa(0)],
  contato: CONTATO,
}
