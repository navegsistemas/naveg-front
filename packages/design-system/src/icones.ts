/**
 * **Os ícones da NAVEG** — desenho como dado, não como componente.
 *
 * O pacote não exporta JSX: ele exporta a **geometria**, e quem monta o `<svg>` é a camada de tela. É o que
 * permite o mesmo desenho sair de um `.astro` estático (sem JavaScript nenhum) e de uma ilha React sem que
 * existam duas versões dele.
 *
 * ### A garantia que este arquivo compra
 *
 * [SlugIcone] é uma união **fechada** e [DESENHOS] é um `Record` completo dela. Consequência: declarar um slug
 * sem desenhá-lo **não compila**, e desenhar um slug que ninguém declarou também não. É a recuperação, em
 * TypeScript, da garantia que o Android tinha com `@DrawableRes` — onde um id inexistente não compilava — e que
 * o ADR-0100 D6 do `fluviapp` perdeu ao trocar o recurso por uma `string`.
 *
 * ### O design system não conhece o domínio
 *
 * Nenhum import de domínio aparece aqui, e isso é invariante: um pacote de desenho que importasse
 * `CategoriaPassagem` para escolher um ícone teria regra de negócio dentro do desenho, e mudar o roteiro da
 * reserva passaria a exigir mudar a paleta. O acoplamento existe, mas é **por vocabulário** — o domínio emite o
 * nome `'barco'`, este pacote sabe desenhar o nome `'barco'`, e nenhum dos dois importa o outro. Quem junta as
 * pontas é a apresentação, e é lá que um cenário confere que nenhum nome emitido ficou sem desenho.
 */

export const SLUGS_DE_ICONE = [
  'reserva',
  'barco',
  'relogio',
  'local',
  'pessoa',
  'estrela',
  'check',
  'seta-direita',
  'seta-esquerda',
  'whatsapp',
  'instagram',
  'facebook',
] as const

export type SlugIcone = (typeof SLUGS_DE_ICONE)[number]

export interface Desenho {
  /** Os `d` dos `<path>`, na ordem de pintura. Todos em `viewBox="0 0 24 24"`. */
  readonly caminhos: readonly string[]
  /**
   * `true` = contorno (`stroke="currentColor"`, `fill="none"`); `false` = sólido (`fill="currentColor"`).
   *
   * A distinção está no dado, e não numa convenção de nome, porque marca de terceiro **tem** de ser sólida
   * para ser reconhecível, e ícone de interface **tem** de ser de contorno para casar com o resto.
   */
  readonly traco: boolean
  /** Nome legível. Vira `aria-label` quando o ícone aparece sozinho, sem texto ao lado. */
  readonly rotulo: string
}

/** O lado do `viewBox`. Quem monta o `<svg>` lê daqui em vez de repetir `0 0 24 24`. */
export const LADO_DO_ICONE = 24

/**
 * As marcas do Facebook, do Instagram e do WhatsApp são propriedade da Meta.
 *
 * Os desenhos abaixo são **simplificações** feitas para a folha de estilo do projeto — servem para prototipar e
 * para o build não depender de asset externo. **Antes do lançamento, substituir pelos arquivos oficiais dos
 * brand centers**, que é o que as diretrizes de marca das três exigem.
 */
export const DESENHOS: Readonly<Record<SlugIcone, Desenho>> = {
  reserva: {
    traco: true,
    rotulo: 'Reserva',
    caminhos: [
      'M3.5 9.5V8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v1.5a2.5 2.5 0 0 0 0 5V16a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16v-1.5a2.5 2.5 0 0 0 0-5z',
      'M15 6.5v11',
    ],
  },
  barco: {
    traco: true,
    rotulo: 'Embarcação',
    caminhos: [
      'M3 18c2 0 2.2 1.6 4.5 1.6S10 18 12 18s2.2 1.6 4.5 1.6S19 18 21 18',
      'M5 14.5h14l-2.2 3.2H7.2z',
      'M12 14.5V3',
      'M12 4.5l5.5 4H12',
    ],
  },
  relogio: {
    traco: true,
    rotulo: 'Horário',
    caminhos: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5.2l3.5 2'],
  },
  local: {
    traco: true,
    rotulo: 'Local',
    caminhos: [
      'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z',
      'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    ],
  },
  pessoa: {
    traco: true,
    rotulo: 'Atendente',
    caminhos: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 20c0-3.6 3.6-5.5 8-5.5s8 1.9 8 5.5'],
  },
  estrela: {
    traco: false,
    rotulo: 'Avaliação',
    caminhos: ['M12 3.2l2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.8z'],
  },
  check: {
    traco: true,
    rotulo: 'Confirmado',
    caminhos: ['M4 12.5l5 5L20 6.5'],
  },
  'seta-direita': {
    traco: true,
    rotulo: 'Avançar',
    caminhos: ['M4 12h15', 'M13 6l6 6-6 6'],
  },
  'seta-esquerda': {
    traco: true,
    rotulo: 'Voltar',
    caminhos: ['M20 12H5', 'M11 18l-6-6 6-6'],
  },
  whatsapp: {
    traco: false,
    rotulo: 'WhatsApp',
    caminhos: [
      'M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24z',
      'M9.06 7.36c-.19-.42-.38-.43-.56-.44h-.47c-.16 0-.43.06-.65.3-.23.24-.86.84-.86 2.06 0 1.21.88 2.38 1 2.55.13.16 1.71 2.74 4.22 3.73 2.09.82 2.51.66 2.97.62.46-.04 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.47-.28-.25-.12-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.12-.17.25-.65.81-.79.98-.15.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.35-.75-1.85z',
    ],
  },
  instagram: {
    traco: true,
    rotulo: 'Instagram',
    caminhos: [
      'M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z',
      'M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z',
      'M17.1 6.9h.01',
    ],
  },
  facebook: {
    traco: false,
    rotulo: 'Facebook',
    caminhos: [
      'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z',
    ],
  },
}

/** O desenho deste slug. O tipo já garante que existe — a função existe para o chamador não indexar à mão. */
export function desenhoDe(slug: SlugIcone): Desenho {
  return DESENHOS[slug]
}
