/**
 * **Os exemplos que os cenários compartilham.**
 *
 * Mora em `test/`, e não em `src/`, por um motivo deste projeto: o README proíbe conteúdo inventado que
 * possa chegar à página parecendo pronto. Dado de exemplo dentro de `src/` é importável pela ilha.
 */
import { DataCalendario, InstanteLocal } from '../src/primitivos/calendario.js'
import type { OcorrenciaViagem } from '../src/viagem/ocorrencia-viagem.js'
import type { TipoEmbarcacao } from '../src/viagem/tipo-embarcacao.js'
import type { ContextoDaReserva, RespostasDaReserva } from '../src/reserva/roteiro-da-reserva.js'
import type { IdentidadeDaReserva } from '../src/reserva/montagem-da-reserva.js'
import type { CatalogoDoFluviapp } from '../src/catalogo/travessias.js'

/** CPFs com dígito verificador correto — números de exemplo de documentação, não de pessoas. */
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

export const CLIENTE = { nome: 'Maria Souza', telefone: '(91) 98888-7777' } as const

/** Uma rede inteira, respondida até o cliente. O caminho mais curto que fecha. */
export const REDE_COMPLETA: RespostasDaReserva = {
  categoria: 'PASSAGEIRO',
  acomodacao: 'REDE',
  tipo: 'INTEIRA',
  cliente: CLIENTE,
}

/**
 * Um catálogo com um pouco de tudo o que a oferta descarta: viagem de embarcação concedida que não existe na
 * coleção, rota com porto fora da concessão, rota inativa. Uma terça-feira às 08:00 (2026-10-13) vê as saídas
 * de quarta.
 */
export const CATALOGO_DE_EXEMPLO: CatalogoDoFluviapp = {
  localidades: [
    { id: 'bel', municipio: 'Belém', uf: 'PA', codigoIbge: '1501402', ativo: true },
    { id: 'sou', municipio: 'Soure', uf: 'PA', codigoIbge: '1507904', ativo: true },
  ],
  portos: [
    { id: 'p-bel', nome: 'Terminal Hidroviário', localidadeId: 'bel', ativo: true },
    { id: 'p-sou', nome: 'Porto de Camará', localidadeId: 'sou', ativo: true },
    { id: 'p-fora', nome: 'Porto sem concessão', localidadeId: 'bel', ativo: true },
  ],
  rotas: [
    { id: 'r-ida', portoOrigemId: 'p-bel', portoDestinoId: 'p-sou', distanciaMn: 40, tempoMedioH: 3.5, ativo: true },
    { id: 'r-fora', portoOrigemId: 'p-bel', portoDestinoId: 'p-fora', distanciaMn: 10, tempoMedioH: 1, ativo: true },
    { id: 'r-inativa', portoOrigemId: 'p-sou', portoDestinoId: 'p-bel', distanciaMn: 40, tempoMedioH: 3.5, ativo: false },
  ],
  embarcacoes: [
    {
      id: 'e-ferry', nome: 'Ferry Exemplo', tipo: 'FERRY_BOAT', capacidadeVeiculo: 40,
      capacidadeSuite2: 0, capacidadeSuite3: 0, capacidadeCamarote: 4, empresaId: 'x',
    },
    {
      id: 'e-lancha', nome: 'Lancha Exemplo', tipo: 'LANCHA', capacidadeVeiculo: 0,
      capacidadeSuite2: 0, capacidadeSuite3: 0, capacidadeCamarote: 0, empresaId: 'x',
    },
  ],
  viagens: [
    { id: 'v-ferry', rotaId: 'r-ida', embarcacaoId: 'e-ferry', diaSemana: 'WEDNESDAY', horaMin: 21 * 60 + 30, ativo: true },
    { id: 'v-lancha', rotaId: 'r-ida', embarcacaoId: 'e-lancha', diaSemana: 'WEDNESDAY', horaMin: 7 * 60, ativo: true },
    { id: 'v-nao-concedida', rotaId: 'r-ida', embarcacaoId: 'e-outra', diaSemana: 'WEDNESDAY', horaMin: 9 * 60, ativo: true },
    { id: 'v-porto-fora', rotaId: 'r-fora', embarcacaoId: 'e-ferry', diaSemana: 'WEDNESDAY', horaMin: 10 * 60, ativo: true },
    { id: 'v-rota-inativa', rotaId: 'r-inativa', embarcacaoId: 'e-ferry', diaSemana: 'WEDNESDAY', horaMin: 11 * 60, ativo: true },
  ],
  atuacao: { embarcacaoIds: new Set(['e-ferry', 'e-lancha', 'e-outra']), portoIds: new Set(['p-bel', 'p-sou']) },
}
