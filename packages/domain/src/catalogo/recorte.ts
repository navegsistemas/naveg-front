/**
 * **O catálogo recortado pela concessão** — o que sai do servidor para o navegador.
 *
 * O pool do fluviapp é compartilhado: viagens, portos e embarcações de todas as empresas moram nas mesmas
 * coleções. O totem só precisa do pedaço que a NAVEG pode vender, e é **só esse pedaço** que deixa o servidor.
 * É minimização, no sentido da LGPD e no do bom senso: o que o público não precisa ver não trafega — nem o
 * cadastro das outras agências, nem as embarcações que a NAVEG não tem concessão para vender.
 *
 * ### A régua
 *
 * O recorte **não muda o que se oferta**: para qualquer `agora`, `travessiasOfertadas(recortar(c), agora)` é
 * igual a `travessiasOfertadas(c, agora)`. Ele tira o que a oferta descartaria de qualquer jeito — viagem
 * inativa, de rota inativa, fora da concessão, com porto ou embarcação que não resolve — e tudo o que só essas
 * viagens citavam. O cenário confere a igualdade, e é ela que autoriza o recorte a acontecer no servidor.
 *
 * A concessão também sai recortada: só os ids que as viagens mantidas usam. O resto da concessão da NAVEG é
 * dela, mas não é do totem.
 */
import type { Localidade } from '../localidade/localidade.js'
import type { Porto, Rota } from '../rota/rota.js'
import { AtuacaoDaEmpresa } from '../viagem/atuacao-da-empresa.js'
import type { Embarcacao } from '../viagem/embarcacao.js'
import type { CatalogoDoFluviapp } from './travessias.js'

function porId<T extends { readonly id: string }>(itens: readonly T[]): ReadonlyMap<string, T> {
  return new Map(itens.map((item) => [item.id, item]))
}

/** Sem concessão, o catálogo recortado é vazio — e continua sem concessão, que é o que o diz. */
const VAZIO: CatalogoDoFluviapp = { viagens: [], rotas: [], portos: [], localidades: [], embarcacoes: [], atuacao: null }

export function recortarPelaConcessao(catalogo: CatalogoDoFluviapp): CatalogoDoFluviapp {
  const { atuacao } = catalogo
  if (atuacao === null) return VAZIO

  const rotas = porId(catalogo.rotas)
  const portos = porId(catalogo.portos)
  const embarcacoes = porId(catalogo.embarcacoes)

  const viagens = catalogo.viagens.filter((viagem) => {
    const rota = rotas.get(viagem.rotaId)
    return (
      viagem.ativo &&
      rota !== undefined &&
      rota.ativo &&
      AtuacaoDaEmpresa.podeOfertar(atuacao, viagem, rota) &&
      portos.has(rota.portoOrigemId) &&
      portos.has(rota.portoDestinoId) &&
      embarcacoes.has(viagem.embarcacaoId)
    )
  })

  const rotasCitadas = new Set(viagens.map((viagem) => viagem.rotaId))
  const rotasMantidas: Rota[] = catalogo.rotas.filter((rota) => rotasCitadas.has(rota.id))
  const portosCitados = new Set(rotasMantidas.flatMap((rota) => [rota.portoOrigemId, rota.portoDestinoId]))
  const portosMantidos: Porto[] = catalogo.portos.filter((porto) => portosCitados.has(porto.id))
  const localidadesCitadas = new Set(portosMantidos.map((porto) => porto.localidadeId))
  const localidadesMantidas: Localidade[] = catalogo.localidades.filter((l) => localidadesCitadas.has(l.id))
  const embarcacoesCitadas = new Set(viagens.map((viagem) => viagem.embarcacaoId))
  const embarcacoesMantidas: Embarcacao[] = catalogo.embarcacoes.filter((e) => embarcacoesCitadas.has(e.id))

  return {
    viagens,
    rotas: rotasMantidas,
    portos: portosMantidos,
    localidades: localidadesMantidas,
    embarcacoes: embarcacoesMantidas,
    atuacao: { embarcacaoIds: embarcacoesCitadas, portoIds: portosCitados },
  }
}
