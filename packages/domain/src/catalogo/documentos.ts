/**
 * **Os documentos do fluviapp, lidos como o aplicativo os lê.**
 *
 * A agência virtual não tem catálogo próprio: rotas, portos, localidades, embarcações e viagens são os do
 * fluviapp, que é a gestão comercial. Cada função aqui é o porte de um `DocumentoBruto.toX()` de
 * `services/repository/firebase/documents/` — **mesmos nomes de chave, mesmas recusas, mesmos padrões**.
 *
 * A paridade é o requisito, e ela corta nos dois sentidos:
 *
 * - recusa-se **só** o que o aplicativo recusa (a viagem sem rota, a embarcação sem tipo). Ser mais estrito
 *   aqui faria uma saída existir no balcão e sumir do site;
 * - o resto ganha o mesmo padrão que o `DocumentoBruto` dá — texto ausente vira `''`, número ausente vira
 *   `0`, `ativo` ausente vira `true`. Ser mais tolerante faria o contrário.
 *
 * O que o **público** não deve ver por falta de dado é decidido depois, em `travessias.ts`, e declarado lá —
 * não escondido numa leitura divergente.
 */
import { DIAS_DA_SEMANA, type DiaSemana } from '../primitivos/dia-semana.js'
import { Uf, type Localidade } from '../localidade/localidade.js'
import type { Porto, Rota } from '../rota/rota.js'
import type { AtuacaoDaEmpresa } from '../viagem/atuacao-da-empresa.js'
import type { Embarcacao } from '../viagem/embarcacao.js'
import { TipoEmbarcacao } from '../viagem/tipo-embarcacao.js'
import type { Viagem } from '../viagem/viagem.js'

/** Os nomes das coleções, como o aplicativo e as Rules os escrevem. */
export const COLECOES_DO_FLUVIAPP = {
  localidades: 'localidades',
  portos: 'portos',
  rotas: 'rotas',
  embarcacoes: 'embarcacoes',
  viagens: 'viagens',
  /** `empresas/{empresaId}/atuacoes/{ATUACAO}` — o id do documento é o nome da atuação. */
  atuacoes: 'atuacoes',
} as const

/** A atuação que a agência virtual exerce. O id do documento da concessão. */
export const ATUACAO_DA_AGENCIA = 'AGENCIAMENTO'

type Dado = Readonly<Record<string, unknown>>

function ehObjeto(valor: unknown): valor is Dado {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

/* Os leitores do `DocumentoBruto`, com os mesmos padrões. */
function texto(dado: Dado, chave: string): string {
  const valor = dado[chave]
  return typeof valor === 'string' ? valor : ''
}

/** `(dados[chave] as? Number)?.toInt() ?: 0` — o `toInt` do Kotlin trunca em direção a zero. */
function inteiro(dado: Dado, chave: string): number {
  const valor = dado[chave]
  return typeof valor === 'number' && Number.isFinite(valor) ? Math.trunc(valor) : 0
}

function decimal(dado: Dado, chave: string): number {
  const valor = dado[chave]
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

function booleano(dado: Dado, chave: string, padrao: boolean): boolean {
  const valor = dado[chave]
  return typeof valor === 'boolean' ? valor : padrao
}

function listaDeTexto(dado: Dado, chave: string): ReadonlySet<string> {
  const valor = dado[chave]
  return new Set(Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : [])
}

/** `toViagem`: recusa sem rota, sem embarcação, ou com dia que não é um `DayOfWeek`. */
export function viagemDoDocumento(id: string, dado: unknown): Viagem | null {
  if (!ehObjeto(dado)) return null
  const rotaId = texto(dado, 'rotaId')
  const embarcacaoId = texto(dado, 'embarcacaoId')
  if (rotaId.trim().length === 0 || embarcacaoId.trim().length === 0) return null
  /* `DayOfWeek.valueOf` é **estrito** — sem trim, sem caixa. Tolerar aqui faria o site ler um dia que o
     aplicativo recusa. */
  const bruto = texto(dado, 'diaSemana')
  const diaSemana = DIAS_DA_SEMANA.find((d): d is DiaSemana => d === bruto)
  if (diaSemana === undefined) return null
  return {
    id,
    rotaId,
    embarcacaoId,
    diaSemana,
    horaMin: inteiro(dado, 'horaMin'),
    ativo: booleano(dado, 'ativo', true),
  }
}

/** `toRota`: recusa sem os dois portos. */
export function rotaDoDocumento(id: string, dado: unknown): Rota | null {
  if (!ehObjeto(dado)) return null
  const portoOrigemId = texto(dado, 'portoOrigemId')
  const portoDestinoId = texto(dado, 'portoDestinoId')
  if (portoOrigemId.trim().length === 0 || portoDestinoId.trim().length === 0) return null
  return {
    id,
    portoOrigemId,
    portoDestinoId,
    distanciaMn: decimal(dado, 'distanciaMn'),
    tempoMedioH: decimal(dado, 'tempoMedioH'),
    ativo: booleano(dado, 'ativo', true),
  }
}

/** `toPorto`: recusa sem localidade. */
export function portoDoDocumento(id: string, dado: unknown): Porto | null {
  if (!ehObjeto(dado)) return null
  const localidadeId = texto(dado, 'localidadeId')
  if (localidadeId.trim().length === 0) return null
  return { id, nome: texto(dado, 'nome'), localidadeId, ativo: booleano(dado, 'ativo', true) }
}

/** `toLocalidade`: recusa UF desconhecida. */
export function localidadeDoDocumento(id: string, dado: unknown): Localidade | null {
  if (!ehObjeto(dado)) return null
  const uf = Uf.de(texto(dado, 'uf'))
  if (uf === null) return null
  return {
    id,
    municipio: texto(dado, 'municipio'),
    uf,
    codigoIbge: texto(dado, 'codigoIbge'),
    ativo: booleano(dado, 'ativo', true),
  }
}

/** `toEmbarcacao`: recusa tipo desconhecido — sem tipo não se sabe se leva veículo. */
export function embarcacaoDoDocumento(id: string, dado: unknown): Embarcacao | null {
  if (!ehObjeto(dado)) return null
  const tipo = TipoEmbarcacao.de(texto(dado, 'tipo'))
  if (tipo === null) return null
  return {
    id,
    nome: texto(dado, 'nome'),
    tipo,
    capacidadeVeiculo: inteiro(dado, 'capacidadeVeiculo'),
    capacidadeSuite2: inteiro(dado, 'capacidadeSuite2'),
    capacidadeSuite3: inteiro(dado, 'capacidadeSuite3'),
    capacidadeCamarote: inteiro(dado, 'capacidadeCamarote'),
    empresaId: texto(dado, 'empresaId'),
  }
}

/** A concessão: `embarcacaoIds` e `portoIds`, como o `EmpresaFirestoreRepository` os lê. */
export function atuacaoDoDocumento(dado: unknown): AtuacaoDaEmpresa | null {
  if (!ehObjeto(dado)) return null
  return { embarcacaoIds: listaDeTexto(dado, 'embarcacaoIds'), portoIds: listaDeTexto(dado, 'portoIds') }
}
