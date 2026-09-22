/**
 * **A página é esta lista.**
 *
 * A ordem das seções, os títulos e o menu saem todos daqui. A decisão que isso codifica é a mesma que o
 * ADR-0101 do `fluviapp` registrou (D4): no material original cada tela aparecia **duas vezes** — na narrativa
 * e no índice —, e a segunda cópia existia só porque a primeira não podia ser percorrida.
 *
 * Aqui a navegação **não é escrita**, é derivada ([menuDaPagina]). Acrescentar uma seção é uma entrada nesta
 * lista; a página e o menu não têm como divergir porque não são duas coisas.
 *
 * A alternância de fundo também é derivada — do **índice**, em `index.astro`. No HTML de onde este projeto
 * herda o padrão, a alternância era escrita bloco a bloco, e a fase de cada um dependia de alguém não errar a
 * contagem.
 */

export interface SecaoDaPagina {
  /** O alvo da âncora. É o que entra no `href` do menu e no `id` do `<section>`. */
  readonly id: string
  /** Título visível da seção. A capa não tem — ela abre com o `<h1>`. */
  readonly titulo: string | null
  readonly subtitulo: string | null
  /** Como a seção se chama no menu. `null` = não vai ao menu. */
  readonly rotuloNoMenu: string | null
  /** Em que passo do plano o conteúdo desta seção entra. Some quando o passo fecha. */
  readonly pendenteDoPasso: number | null
}

/** O rodapé não é uma `<Secao>` — tem moldura própria —, mas é alvo de âncora como qualquer outra. */
export const ID_DO_RODAPE = 'contato'

export const SECOES: readonly SecaoDaPagina[] = [
  {
    id: 'capa',
    titulo: null,
    subtitulo: null,
    /* A capa não entra no menu: o logo já leva ao topo, e um item "Início" numa página só é ruído. */
    rotuloNoMenu: null,
    pendenteDoPasso: 3,
  },
  {
    id: 'totem',
    titulo: 'Reserve sua passagem',
    subtitulo:
      'Escolha a travessia, informe quem viaja e receba o código da reserva. ' +
      'Leva menos de um minuto e não pede cadastro.',
    rotuloNoMenu: 'Reservar',
    pendenteDoPasso: 8,
  },
  {
    id: 'atendentes',
    titulo: 'Quem atende você',
    subtitulo: 'A equipe das agências, com o horário e o canal de cada uma.',
    rotuloNoMenu: 'Atendentes',
    pendenteDoPasso: 4,
  },
  {
    id: 'depoimentos',
    titulo: 'O que dizem os passageiros',
    subtitulo: 'Avaliações de quem já viajou com a gente.',
    rotuloNoMenu: 'Avaliações',
    pendenteDoPasso: 5,
  },
]

export interface ItemDoMenu {
  readonly href: string
  readonly rotulo: string
}

/**
 * O menu, derivado: as seções que pedem para aparecer, mais o rodapé.
 *
 * O rodapé entra à mão e no fim porque ele é a única âncora que não é uma `<Secao>` — e declarar essa exceção
 * aqui é mais honesto do que inventar uma seção fantasma na lista acima só para o menu ficar uniforme.
 */
export function menuDaPagina(): readonly ItemDoMenu[] {
  const daSecoes = SECOES.flatMap((secao) =>
    secao.rotuloNoMenu === null ? [] : [{ href: `#${secao.id}`, rotulo: secao.rotuloNoMenu }],
  )

  return [...daSecoes, { href: `#${ID_DO_RODAPE}`, rotulo: 'Contato' }]
}

/** Todos os alvos de âncora que a página oferece — é contra esta lista que o menu é conferido. */
export function ancorasDaPagina(): readonly string[] {
  return [...SECOES.map((secao) => secao.id), ID_DO_RODAPE]
}
