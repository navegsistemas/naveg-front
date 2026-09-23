/**
 * **A fronteira de serialização do catálogo** — o que atravessa a rede entre a API e o totem.
 *
 * O `CatalogoDoFluviapp` quase sobrevive a `JSON.stringify` sozinho. O "quase" é a concessão: ela é feita de
 * `ReadonlySet`, e um `Set` serializado vira `{}`. Do outro lado, `{}.has` não existe, ou — pior, com uma
 * checagem frouxa — a concessão chega **vazia**, e o totem não oferta nada, em silêncio, com cara de dia sem
 * saída. Este par existe para esse erro não ter onde acontecer.
 *
 * ### A volta passa pelos decodificadores
 *
 * Cada item do JSON tem **a mesma forma do documento do Firestore**, mais o `id`. Então `catalogoDoJson` não
 * confia no que chega: lê cada item com os mesmos `xDoDocumento` que leem o banco, e o que eles recusam não
 * entra. Um JSON adulterado, truncado ou de uma versão antiga da API recebe as mesmas recusas que um documento
 * torto do fluviapp — e nenhuma regra de leitura nova precisa existir.
 */
import type { Localidade } from '../localidade/localidade.js'
import type { Porto, Rota } from '../rota/rota.js'
import type { AtuacaoDaEmpresa } from '../viagem/atuacao-da-empresa.js'
import type { Embarcacao } from '../viagem/embarcacao.js'
import type { Viagem } from '../viagem/viagem.js'
import {
  atuacaoDoDocumento,
  embarcacaoDoDocumento,
  localidadeDoDocumento,
  portoDoDocumento,
  rotaDoDocumento,
  viagemDoDocumento,
} from './documentos.js'
import type { CatalogoDoFluviapp } from './travessias.js'

/** A forma do catálogo no fio. A concessão vira listas; o resto já é JSON. */
export interface CatalogoJson {
  readonly viagens: readonly Viagem[]
  readonly rotas: readonly Rota[]
  readonly portos: readonly Porto[]
  readonly localidades: readonly Localidade[]
  readonly embarcacoes: readonly Embarcacao[]
  readonly atuacao: { readonly embarcacaoIds: readonly string[]; readonly portoIds: readonly string[] } | null
}

export function catalogoParaJson(catalogo: CatalogoDoFluviapp): CatalogoJson {
  return {
    viagens: catalogo.viagens,
    rotas: catalogo.rotas,
    portos: catalogo.portos,
    localidades: catalogo.localidades,
    embarcacoes: catalogo.embarcacoes,
    atuacao:
      catalogo.atuacao === null
        ? null
        : { embarcacaoIds: [...catalogo.atuacao.embarcacaoIds], portoIds: [...catalogo.atuacao.portoIds] },
  }
}

type Dado = Readonly<Record<string, unknown>>

function ehObjeto(valor: unknown): valor is Dado {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

/** Lê uma lista de itens com `{ id, … }`, pelo decodificador do documento. Item sem id, ou recusado, some. */
function lerLista<T>(valor: unknown, decodificar: (id: string, dado: unknown) => T | null): T[] {
  return (valor as unknown[]).flatMap((item) => {
    if (!ehObjeto(item) || typeof item['id'] !== 'string' || item['id'].trim().length === 0) return []
    const lido = decodificar(item['id'], item)
    return lido === null ? [] : [lido]
  })
}

const LISTAS = ['viagens', 'rotas', 'portos', 'localidades', 'embarcacoes'] as const

/**
 * O catálogo de volta, ou `null` quando o JSON **não é um catálogo** — sem uma das listas, ou com a concessão
 * em forma que não se lê. `null`, e não um catálogo vazio: quem chama tem de tratar como falha de carga, e o
 * totem diz "não foi possível carregar", em vez de "não há saídas".
 */
export function catalogoDoJson(dado: unknown): CatalogoDoFluviapp | null {
  if (!ehObjeto(dado)) return null
  if (!LISTAS.every((lista) => Array.isArray(dado[lista]))) return null

  let atuacao: AtuacaoDaEmpresa | null = null
  if (dado['atuacao'] !== null) {
    const bruta = dado['atuacao']
    if (!ehObjeto(bruta) || !Array.isArray(bruta['embarcacaoIds']) || !Array.isArray(bruta['portoIds'])) return null
    atuacao = atuacaoDoDocumento(bruta)
  }

  return {
    viagens: lerLista(dado['viagens'], viagemDoDocumento),
    rotas: lerLista(dado['rotas'], rotaDoDocumento),
    portos: lerLista(dado['portos'], portoDoDocumento),
    localidades: lerLista(dado['localidades'], localidadeDoDocumento),
    embarcacoes: lerLista(dado['embarcacoes'], embarcacaoDoDocumento),
    atuacao,
  }
}
