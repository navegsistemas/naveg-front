/**
 * **As ferramentas dos cenários de cor** — um leitor de `tokens.css` e a razão de contraste da WCAG.
 *
 * Mora em `test/`, e não em `src/`, porque nada disso é entregue ao navegador: é o instrumento que mede a
 * folha, não parte dela. A matemática está aqui em vez de num pacote de terceiro por uma razão prática — são
 * vinte linhas, e uma dependência a mais neste pacote contradiz o que a `package.json` dele promete.
 *
 * O leitor é deliberadamente burro: ele não entende CSS, entende **blocos e declarações**. É o bastante,
 * porque `tokens.css` é só isso — e um parser completo aceitaria formas que o arquivo não deve ter.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const RAIZ_DO_PACOTE = fileURLToPath(new URL('..', import.meta.url))
export const RAIZ_DO_REPO = fileURLToPath(new URL('../../..', import.meta.url))

export const SELETOR_CLARO = ':root'
export const SELETOR_ESCURO_EXPLICITO = ":root[data-theme='dark']"
export const SELETOR_ESCURO_PREFERIDO = ":root:not([data-theme='light'])"

export function lerTokens(): string {
  return readFileSync(fileURLToPath(new URL('../src/tokens.css', import.meta.url)), 'utf8')
}

export function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * O corpo do bloco de `seletor`, em qualquer profundidade — inclusive dentro de uma media query.
 *
 * O casamento exige que o seletor seja seguido de `{`, e é o que impede `:root` de casar dentro de
 * `:root:not(...)`: ali o que vem depois é `:`, não uma chave.
 */
export function corpoDoBloco(css: string, seletor: string): string {
  const limpo = semComentarios(css)
  const abertura = new RegExp(`(^|[;{}\\s])${escaparRegex(seletor)}\\s*\\{`)
  const achado = abertura.exec(limpo)
  if (achado === null) throw new Error(`Bloco não encontrado: ${seletor}`)

  const inicio = achado.index + achado[0].length
  let profundidade = 1

  for (let i = inicio; i < limpo.length; i += 1) {
    const caractere = limpo[i]
    if (caractere === '{') profundidade += 1
    else if (caractere === '}') {
      profundidade -= 1
      if (profundidade === 0) return limpo.slice(inicio, i)
    }
  }

  throw new Error(`Bloco não fechado: ${seletor}`)
}

/** As declarações de custom property do corpo, na ordem em que aparecem. */
export function declaracoes(corpo: string): Map<string, string> {
  const encontradas = new Map<string, string>()
  const padrao = /(--[\w-]+)\s*:\s*([^;]+);/g

  for (const achado of corpo.matchAll(padrao)) {
    const nome = achado[1]
    const valor = achado[2]
    if (nome === undefined || valor === undefined) continue
    encontradas.set(nome, valor.trim())
  }

  return encontradas
}

export function ehReferencia(valor: string): boolean {
  return valor.trimStart().startsWith('var(')
}

/** Segue a cadeia de `var()` até o valor literal. Ciclo e token ausente são erro, não `undefined`. */
export function resolver(
  mapa: ReadonlyMap<string, string>,
  valor: string,
  vistos: ReadonlySet<string> = new Set(),
): string {
  const achado = /^var\(\s*(--[\w-]+)\s*\)$/.exec(valor.trim())
  if (achado === null) return valor.trim()

  const nome = achado[1]
  if (nome === undefined) return valor.trim()
  if (vistos.has(nome)) throw new Error(`Ciclo de referência em ${nome}`)

  const proximo = mapa.get(nome)
  if (proximo === undefined) throw new Error(`Token não declarado: ${nome}`)

  return resolver(mapa, proximo, new Set([...vistos, nome]))
}

export type Tema = 'claro' | 'escuro'

/**
 * O mapa de tokens **como o navegador o veria** naquele tema: os primitivos do `:root` mais os semânticos,
 * com o bloco escuro sobrepondo o claro.
 */
export function mapaDoTema(tema: Tema): Map<string, string> {
  const css = lerTokens()
  const mapa = declaracoes(corpoDoBloco(css, SELETOR_CLARO))

  if (tema === 'escuro') {
    for (const [nome, valor] of declaracoes(corpoDoBloco(css, SELETOR_ESCURO_EXPLICITO))) {
      mapa.set(nome, valor)
    }
  }

  return mapa
}

/** O valor final deste token neste tema. */
export function cor(mapa: ReadonlyMap<string, string>, nome: string): string {
  const valor = mapa.get(nome)
  if (valor === undefined) throw new Error(`Token não declarado: ${nome}`)
  return resolver(mapa, valor)
}

function canais(hexadecimal: string): readonly [number, number, number] {
  const limpo = hexadecimal.trim().replace(/^#/, '')

  const expandido =
    limpo.length === 3
      ? [...limpo].map((digito) => `${digito}${digito}`).join('')
      : limpo

  if (!/^[0-9a-fA-F]{6}$/.test(expandido)) {
    throw new Error(`Não é uma cor hexadecimal sólida: ${hexadecimal}`)
  }

  return [
    Number.parseInt(expandido.slice(0, 2), 16),
    Number.parseInt(expandido.slice(2, 4), 16),
    Number.parseInt(expandido.slice(4, 6), 16),
  ]
}

/** Linearização sRGB da WCAG 2.1 (§ relative luminance). */
function linear(canal: number): number {
  const proporcao = canal / 255
  return proporcao <= 0.04045 ? proporcao / 12.92 : ((proporcao + 0.055) / 1.055) ** 2.4
}

export function luminancia(hexadecimal: string): number {
  const [vermelho, verde, azul] = canais(hexadecimal)
  return 0.2126 * linear(vermelho) + 0.7152 * linear(verde) + 0.0722 * linear(azul)
}

/** A razão de contraste da WCAG 2.1, de 1 a 21. A ordem dos argumentos não importa. */
export function contraste(umaCor: string, outraCor: string): number {
  const primeira = luminancia(umaCor)
  const segunda = luminancia(outraCor)
  const clara = Math.max(primeira, segunda)
  const escura = Math.min(primeira, segunda)
  return (clara + 0.05) / (escura + 0.05)
}

/** Texto normal: 4,5:1 (WCAG 2.1 AA, 1.4.3). */
export const MINIMO_TEXTO = 4.5
/** Componente de interface e contorno: 3:1 (WCAG 2.1 AA, 1.4.11). */
export const MINIMO_CONTORNO = 3

/** Os arquivos de fonte do monorepo que podem conter cor escrita à mão. */
export function arquivosDeFonte(): readonly string[] {
  const encontrados: string[] = []

  for (const area of ['packages', 'apps']) {
    let entradas: readonly string[]
    try {
      entradas = readdirSync(`${RAIZ_DO_REPO}${area}`, { recursive: true, encoding: 'utf8' })
    } catch {
      continue
    }

    for (const relativo of entradas) {
      const caminho = `${area}/${relativo}`.replaceAll('\\', '/')
      if (caminho.includes('node_modules') || caminho.includes('/dist/')) continue
      if (!/\/src\/.*\.(css|ts|tsx|astro)$/.test(caminho)) continue
      encontrados.push(caminho)
    }
  }

  return encontrados
}

export function conteudoDe(caminhoRelativo: string): string {
  return readFileSync(`${RAIZ_DO_REPO}${caminhoRelativo}`, 'utf8')
}
