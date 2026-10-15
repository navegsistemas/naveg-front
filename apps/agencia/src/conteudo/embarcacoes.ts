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

/**
 * **As fotos, pelo nome do arquivo** (PO, 2026-10-15). Em `src/assets/embarcacoes/`, o nome diz para onde a foto vai:
 *
 * - `<id>-apresentacao` é a da vitrine, deitada;
 * - `<id>-capa` é a do fundo da capa, que pode ser em pé;
 * - só `<id>` serve para as duas.
 *
 * Uma foto só não serve para tudo: a do Maria Ivanir em pé, recortada em 16:9 na vitrine, perdia metade do navio. A
 * extensão é qualquer uma que o Astro processa. Foto nova entra pelo nome, sem mexer aqui — mas o texto alternativo,
 * sim, porque o cenário o cobra.
 */
const FOTOS = import.meta.glob<{ default: ImageMetadata }>('../assets/embarcacoes/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
})

function fotoPeloNome(nome: string): ImageMetadata | null {
  for (const [caminho, modulo] of Object.entries(FOTOS)) {
    const arquivo = caminho.slice(caminho.lastIndexOf('/') + 1, caminho.lastIndexOf('.'))
    if (arquivo === nome) return modulo.default
  }
  return null
}

/** A foto da vitrine: `<id>-apresentacao`, ou `<id>`. */
export function fotoDaApresentacao(id: string): ImageMetadata | null {
  return fotoPeloNome(`${id}-apresentacao`) ?? fotoPeloNome(id)
}

/** A foto do fundo da capa: `<id>-capa`, ou `<id>`. */
export function fotoDaCapa(id: string): ImageMetadata | null {
  return fotoPeloNome(`${id}-capa`) ?? fotoPeloNome(id)
}

export interface Embarcacao {
  readonly id: string
  /** Como o nome aparece na tela. No casco ele vai em caixa alta; em texto corrido, capitulado lê melhor. */
  readonly nome: string
  readonly tipo: string
  /** Uma linha sobre o que ela faz. */
  readonly descricao: string
  /**
   * A foto **da apresentação** (a vitrine), achada pelo nome em `src/assets/embarcacoes/` (ver [FOTOS] e o
   * `LEIA-ME.md` de lá). O Astro gera os tamanhos e os formatos no build; o arquivo guardado é o que chegou, sem
   * recorte. `null` enquanto a foto não chega — e a embarcação fica fora da vitrine.
   */
  readonly imagem: ImageMetadata | null
  /** O texto alternativo da foto da vitrine. Obrigatório quando há foto; é cobrado por cenário. */
  readonly alt: string | null
}

export const EMBARCACOES: readonly Embarcacao[] = [
  {
    id: 'regional',
    nome: 'F/B Regional',
    tipo: 'Ferry Boat',
    descricao: 'Passageiros e veículos na travessia Belém ⇄ Macapá.',
    imagem: fotoDaApresentacao('regional'),
    alt: 'O ferry boat Regional navegando com a rampa de proa erguida e caminhões e carros no convés, sob um céu azul com nuvens.',
  },
  {
    id: 'maria-ivanir',
    nome: 'F/B Maria Ivanir',
    tipo: 'Ferry Boat',
    descricao: 'Rede, suíte e camarote, com praça para carga rodante.',
    imagem: fotoDaApresentacao('maria-ivanir'),
    alt: 'O ferry boat Maria Ivanir de lado, inteiro, navegando ao pôr do sol, com o céu alaranjado refletido na água.',
  },
  {
    id: 'maria-eduarda',
    nome: 'F/B Maria Eduarda',
    tipo: 'Ferry Boat',
    descricao: 'A mais recente da flotilha, na mesma travessia.',
    imagem: fotoDaApresentacao('maria-eduarda'),
    alt: null,
  },
]

/**
 * **As embarcações que a vitrine mostra: só as que têm foto.** Um molde "Foto pendente" com o nome do arquivo é
 * recado para a equipe, não para quem visita (achado 1 da ficha 1.2).
 */
export const EMBARCACOES_DA_VITRINE: readonly Embarcacao[] = EMBARCACOES.filter(
  (embarcacao) => embarcacao.imagem !== null,
)

/**
 * **A vitrine só aparece a partir da segunda foto** (decisão do PO, 2026-10-08). Com uma, a foto já é o fundo
 * da capa logo acima, e a vitrine repetiria a mesma imagem; com duas, ela volta sozinha.
 */
export const FOTOS_PARA_A_VITRINE = 2

export const VITRINE_VISIVEL = EMBARCACOES_DA_VITRINE.length >= FOTOS_PARA_A_VITRINE

/**
 * **A foto do cartão do Veículo**, na primeira pergunta da reserva (UI 2.2, decisão M): a do F/B Regional, com
 * caminhões e carros no convés — "utiliza também" (PO, 2026-10-15). É a mesma foto da vitrine, recortada pelo CSS.
 */
export const FOTO_DO_CARTAO_DO_VEICULO: ImageMetadata | null =
  EMBARCACOES.find((embarcacao) => embarcacao.id === 'regional')?.imagem ?? null

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

/**
 * **A folha que a vitrine escreve na página**: os quadros e a duração, num `<style>` só.
 *
 * Ela mora aqui, e não no componente, porque a página precisa dela inteira: a política de segurança aceita o
 * `<style>` pelo *hash* do texto, e quem declara o hash é a página (`index.astro`) — o Astro não alcança a
 * `<meta>` da política a partir de um componente. A duração vai junto, e não num `style=""` do trilho, porque
 * a política não aceita atributo de estilo nenhum.
 */
export function folhaDaVitrine(quantidade: number = EMBARCACOES_DA_VITRINE.length): string {
  /* Nome global — `@keyframes` não tem escopo em CSS, e fingir que tem seria mentira de comentário. */
  return (
    `@keyframes naveg-vitrine-desfile {\n${quadrosDaVitrine(quantidade)}\n}\n` +
    `.vitrine__trilho { --vitrine-duracao: ${duracaoDaVitrine(quantidade)}s; }`
  )
}
