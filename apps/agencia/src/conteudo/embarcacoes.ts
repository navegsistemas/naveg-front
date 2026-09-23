/**
 * **A flotilha, e a animação que a desfila.**
 *
 * Os três ferry boats da NAVEG, e a função que gera os quadros da vitrine **a partir deles**.
 *
 * ### Por que a animação é derivada, e não escrita
 *
 * Um carrossel CSS de três itens tem percentuais de `@keyframes` calculados para três: `0%`, `33,33%`, `66,67%`.
 * Escritos à mão, eles seguem lá no dia em que a NAVEG comprar o quarto barco — e o defeito não é um erro de
 * build, é o quarto slide **nunca aparecer**, em silêncio, numa página que continua bonita.
 *
 * Com [quadrosDaVitrine] a regra passa a ser uma função pura, com cenário próprio: acrescentar uma embarcação à
 * lista acerta a animação sozinho.
 */
import type { SlugIcone } from '@navegsistemas/design-system'

export interface Embarcacao {
  readonly id: string
  /** Como o nome aparece na tela. No casco ele vai em caixa alta; em texto corrido, capitulado lê melhor. */
  readonly nome: string
  readonly tipo: string
  /** Uma linha sobre o que ela faz. */
  readonly descricao: string
  /**
   * O arquivo em `public/embarcacoes/`. `null` enquanto a foto não chega — e é isso que faz a vitrine
   * desenhar o **wireframe** no lugar, com o nome do arquivo que ela espera.
   */
  readonly imagem: string | null
  /** O texto alternativo da foto. Obrigatório quando há foto; é cobrado por cenário. */
  readonly alt: string | null
}

export const EMBARCACOES: readonly Embarcacao[] = [
  {
    id: 'regional',
    nome: 'F/B Regional',
    tipo: 'Ferry Boat',
    descricao: 'Passageiros e veículos na travessia Belém ⇄ Macapá.',
    imagem: null,
    alt: null,
  },
  {
    id: 'maria-ivanir',
    nome: 'F/B Maria Ivanir',
    tipo: 'Ferry Boat',
    descricao: 'Rede, suíte e camarote, com praça para carga rodante.',
    imagem: null,
    alt: null,
  },
  {
    id: 'maria-eduarda',
    nome: 'F/B Maria Eduarda',
    tipo: 'Ferry Boat',
    descricao: 'A mais recente da flotilha, na mesma travessia.',
    imagem: null,
    alt: null,
  },
]

/** O ícone da flotilha, para a faixa de credibilidade e a legenda da vitrine. */
export const ICONE_DA_FLOTILHA: SlugIcone = 'barco'

/** Quanto tempo cada embarcação fica parada em tela, em segundos. */
export const SEGUNDOS_POR_EMBARCACAO = 7

/** A fração do tempo de cada slide em que ele fica **parado**; o resto é a transição. */
export const FRACAO_PARADA = 0.8

/**
 * **Os quadros da vitrine**, derivados da quantidade de embarcações.
 *
 * Cada item ganha um par de percentuais — quando entra e quando começa a sair — e o quadro final leva o trilho
 * a `-{n}00%`, que é a **cópia** do primeiro item. Como a cópia é idêntica ao original, o salto de volta ao
 * `0%` no reinício do ciclo é invisível: é o truque que faz um carrossel CSS girar sem emenda e sem script.
 *
 * @param quantidade quantos itens reais a vitrine tem. Abaixo de 1 não há o que desfilar.
 */
export function quadrosDaVitrine(
  quantidade: number,
  fracaoParada: number = FRACAO_PARADA,
): string {
  if (quantidade < 1) throw new Error('A vitrine precisa de ao menos uma embarcação')

  const passo = 100 / quantidade

  const paradas = Array.from({ length: quantidade }, (_, indice) => {
    const entra = indice * passo
    const comecaASair = entra + passo * fracaoParada
    return `  ${arredondar(entra)}%, ${arredondar(comecaASair)}% { transform: translateX(${deslocamento(indice)}); }`
  })

  return [...paradas, `  100% { transform: translateX(${deslocamento(quantidade)}); }`].join('\n')
}

/**
 * O deslocamento do trilho para o item de índice `indice`, em percentual da janela.
 *
 * O primeiro é `0%`, e não `-0%`: os dois são a mesma posição para o navegador, mas só um deles é o que se
 * quer ler no HTML gerado — e, do lado do cenário, `-0` não é igual a `0` em JavaScript.
 */
function deslocamento(indice: number): string {
  return indice === 0 ? '0%' : `-${indice * 100}%`
}

/** A duração do ciclo inteiro, em segundos. */
export function duracaoDaVitrine(quantidade: number): number {
  return quantidade * SEGUNDOS_POR_EMBARCACAO
}

/* Três casas bastam para o navegador e evitam um `33.33333333333333%` no HTML. */
function arredondar(valor: number): number {
  return Math.round(valor * 1000) / 1000
}
