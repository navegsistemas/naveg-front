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
 * inativa, de rota inativa, fora da concessão, com cidade, cais ou embarcação que não resolve — e tudo o que só essas
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
const VAZIO: CatalogoDoFluviapp = {
  viagens: [],
  rotas: [],
  portos: [],
  localidades: [],
  embarcacoes: [],
  atuacao: null,
  suspensas: [],
  alteracoes: [],
}

export function recortarPelaConcessao(catalogo: CatalogoDoFluviapp): CatalogoDoFluviapp {
  const { atuacao } = catalogo
  if (atuacao === null) return VAZIO

  const rotas = porId(catalogo.rotas)
  const localidades = porId(catalogo.localidades)
  const embarcacoes = porId(catalogo.embarcacoes)

  /* A viagem fica se a oferta puder nomeá-la em alguma data: as cidades da rota e a embarcação resolvem. O cais não
     entra aqui — o planejado que não resolve ainda pode ter uma data alterada para um cais que resolve, e a oferta
     decide data a data. */
  const viagens = catalogo.viagens.filter((viagem) => {
    const rota = rotas.get(viagem.rotaId)
    return (
      viagem.ativo &&
      rota !== undefined &&
      rota.ativo &&
      AtuacaoDaEmpresa.podeOfertar(atuacao, viagem) &&
      localidades.has(rota.localidadeOrigemId) &&
      localidades.has(rota.localidadeDestinoId) &&
      embarcacoes.has(viagem.embarcacaoId)
    )
  })

  const viagensMantidas = new Set(viagens.map((viagem) => viagem.id))
  /* A suspensão e a alteração de viagem que não fica não dizem nada ao totem — e as de outra transportadora não são
     dele. */
  const suspensas = catalogo.suspensas.filter((s) => viagensMantidas.has(s.viagemId))
  const alteracoes = catalogo.alteracoes.filter((a) => viagensMantidas.has(a.ocorrencia.viagemId))

  const rotasCitadas = new Set(viagens.map((viagem) => viagem.rotaId))
  const rotasMantidas: Rota[] = catalogo.rotas.filter((rota) => rotasCitadas.has(rota.id))
  /* A concessão recortada é a dos cais planejados; os portos que saem incluem os das alterações, para o totem nomear o
     cais do dia. */
  const portosConcedidos = new Set(viagens.flatMap((viagem) => [viagem.portoEmbarqueId, viagem.portoDesembarqueId]))
  const portosCitados = new Set([
    ...portosConcedidos,
    ...alteracoes.flatMap((a) => [a.portoEmbarqueId, a.portoDesembarqueId]),
  ])
  const portosMantidos: Porto[] = catalogo.portos.filter((porto) => portosCitados.has(porto.id))
  const localidadesCitadas = new Set([
    ...rotasMantidas.flatMap((rota) => [rota.localidadeOrigemId, rota.localidadeDestinoId]),
    ...portosMantidos.map((porto) => porto.localidadeId),
  ])
  const localidadesMantidas: Localidade[] = catalogo.localidades.filter((l) => localidadesCitadas.has(l.id))
  const embarcacoesCitadas = new Set(viagens.map((viagem) => viagem.embarcacaoId))
  const embarcacoesMantidas: Embarcacao[] = catalogo.embarcacoes.filter((e) => embarcacoesCitadas.has(e.id))

  return {
    viagens,
    rotas: rotasMantidas,
    portos: portosMantidos,
    localidades: localidadesMantidas,
    embarcacoes: embarcacoesMantidas,
    atuacao: { embarcacaoIds: embarcacoesCitadas, portoIds: portosConcedidos },
    suspensas,
    alteracoes,
  }
}
