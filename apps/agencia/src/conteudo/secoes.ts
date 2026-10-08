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
  /** Como a seção se chama nos atalhos do rodapé. `null` = não tem atalho. */
  readonly rotulo: string | null
  /**
   * Como a seção se chama no menu do topo — `null` = não vai ao topo. Pode diferir do atalho do rodapé (a 1.1 do
   * roteiro de UI/UX, decisões do PO em 2026-10-08): a reserva não vai, porque tem o botão "Reservar agora".
   */
  readonly rotuloNoTopo: string | null
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
    rotulo: null,
    rotuloNoTopo: null,
    pendenteDoPasso: null,
  },
  {
    id: 'totem',
    titulo: 'Reserve sua passagem',
    subtitulo:
      'Escolha a saída, diga o que vai embarcar e receba o código da reserva. ' +
      'Leva menos de um minuto, não pede cadastro nem documento.',
    rotulo: 'Reservar',
    /* No topo, a reserva é o botão "Reservar agora": um item com o mesmo destino ao lado dele seria repetição. */
    rotuloNoTopo: null,
    pendenteDoPasso: null,
  },
  {
    /* Uma porta própria para quem quer mandar uma caixa, e não comprar passagem (`docs/plano-da-reserva-de-encomenda.md`, §1). */
    id: 'encomendas',
    titulo: 'Envie sua encomenda',
    subtitulo: 'Diga o que vai mandar e para quem. O atendente confirma pelo WhatsApp e você entrega no porto.',
    rotulo: 'Encomendas',
    rotuloNoTopo: 'Encomendas',
    pendenteDoPasso: null,
  },
  {
    id: 'atendentes',
    titulo: 'Quem atende você',
    subtitulo:
      'Do outro lado não tem robô. Quem responde conhece a travessia, os horários das saídas e o que ' +
      'cabe em cada embarcação.',
    rotulo: 'Atendentes',
    rotuloNoTopo: 'Atendentes',
    pendenteDoPasso: null,
  },
  {
    id: 'depoimentos',
    titulo: 'O que dizem os passageiros',
    subtitulo: 'Avaliações de quem já viajou com a gente.',
    rotulo: 'Avaliações',
    /* No topo, "Social": a seção junta as avaliações e as redes (PO, 2026-10-08). O rodapé é da 1.7. */
    rotuloNoTopo: 'Social',
    pendenteDoPasso: null,
  },
]

export interface ItemDoMenu {
  readonly href: string
  readonly rotulo: string
}

/** Os atalhos do rodapé: toda seção que tem rótulo, na ordem da página. */
export function atalhosDaPagina(): readonly ItemDoMenu[] {
  return SECOES.flatMap((secao) => (secao.rotulo === null ? [] : [{ href: `#${secao.id}`, rotulo: secao.rotulo }]))
}

/**
 * O menu do topo, derivado: as seções com `rotuloNoTopo`, mais o rodapé.
 *
 * O rodapé entra à mão e no fim porque ele é a única âncora que não é uma `<Secao>` — e declarar essa exceção
 * aqui é mais honesto do que inventar uma seção fantasma na lista acima só para o menu ficar uniforme.
 */
export function menuDaPagina(): readonly ItemDoMenu[] {
  const daSecoes = SECOES.flatMap((secao) =>
    secao.rotuloNoTopo === null ? [] : [{ href: `#${secao.id}`, rotulo: secao.rotuloNoTopo }],
  )

  return [...daSecoes, { href: `#${ID_DO_RODAPE}`, rotulo: 'Contato' }]
}

/**
 * **A âncora vista de outra página.** O menu e o rodapé apontam para seções da página inicial (`#totem`); numa
 * página que não é ela (`/privacidade`), `#totem` não acha nada, e o link vira `/#totem`. O rodapé existe em
 * toda página, então o "Contato" continua apontando para o dela.
 */
export function ancoraVistaDe(caminho: string, href: string): string {
  return caminho === '/' || href === `#${ID_DO_RODAPE}` ? href : `/${href}`
}

/** Todos os alvos de âncora que a página oferece — é contra esta lista que o menu é conferido. */
export function ancorasDaPagina(): readonly string[] {
  return [...SECOES.map((secao) => secao.id), ID_DO_RODAPE]
}
