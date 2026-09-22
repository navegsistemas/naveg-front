/**
 * **O pacote continua sendo domínio puro** — sem React, sem Astro, sem Firebase, e sem relógio.
 *
 * O plano pede "zero import de React, Astro ou Firebase". Este cenário pede mais, porque é mais fácil de
 * manter e mais difícil de contornar: **nenhum import que não seja relativo**. Uma lista de proibidos
 * envelhece — alguém importa `date-fns`, ou `node:crypto`, e a lista não sabia. Uma regra de "só o que
 * mora aqui" não envelhece.
 *
 * E o domínio **não lê o relógio**: `criadoEm` entra por parâmetro, e a expiração recebe o `agora`. É o que
 * torna a montagem pura, e o que deixa o cenário atravessar a virada de dia sem esperar por ela.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const RAIZ_DO_PACOTE = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(RAIZ_DO_PACOTE, 'src')

function arquivosTs(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    return statSync(caminho).isDirectory() ? arquivosTs(caminho) : nome.endsWith('.ts') ? [caminho] : []
  })
}

const FONTES = arquivosTs(SRC).map((caminho) => ({
  nome: relative(SRC, caminho).replaceAll('\\', '/'),
  /* Sem comentários: o KDoc deste pacote cita `React` e `Date` o tempo todo — para dizer que não os usa. */
  codigo: readFileSync(caminho, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'),
}))

/** Todo especificador de módulo: `import … from 'x'`, `export … from 'x'`, `import('x')`. */
function especificadores(codigo: string): string[] {
  const achados: string[] = []
  for (const padrao of [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, /^\s*import\s+['"]([^'"]+)['"]/gm]) {
    for (const casamento of codigo.matchAll(padrao)) achados.push(casamento[1] as string)
  }
  return achados
}

describe('a estrutura do pacote', () => {
  it('há fontes para varrer — um cenário que não acha arquivo nenhum passa sempre', () => {
    expect(FONTES.length).toBeGreaterThan(10)
    expect(FONTES.map((f) => f.nome)).toContain('reserva/roteiro-da-reserva.ts')
  })

  it('nenhum import que não seja relativo — nem React, nem Astro, nem Firebase, nem nada', () => {
    for (const { nome, codigo } of FONTES) {
      for (const especificador of especificadores(codigo)) {
        expect(especificador.startsWith('./') || especificador.startsWith('../'), `${nome} importa "${especificador}"`).toBe(true)
      }
    }
  })

  it('em particular, os três que o plano nomeia não aparecem nem por menção no código', () => {
    for (const { nome, codigo } of FONTES) {
      expect(codigo, nome).not.toMatch(/\b(react|astro|firebase)\b/i)
    }
  })

  it('todo import relativo termina em .js — é o que o NodeNext exige e o que o Vite resolve', () => {
    for (const { nome, codigo } of FONTES) {
      for (const especificador of especificadores(codigo)) {
        expect(especificador.endsWith('.js'), `${nome} importa "${especificador}"`).toBe(true)
      }
    }
  })

  it('o domínio não lê o relógio nem usa aleatoriedade previsível', () => {
    for (const { nome, codigo } of FONTES) {
      expect(codigo, `${nome}: Date.now()`).not.toMatch(/\bDate\.now\s*\(/)
      expect(codigo, `${nome}: new Date() sem argumento`).not.toMatch(/\bnew\s+Date\s*\(\s*\)/)
      expect(codigo, `${nome}: Math.random`).not.toMatch(/\bMath\.random\b/)
    }
  })

  it('o package.json não declara dependência nenhuma', () => {
    const pacote = JSON.parse(readFileSync(join(RAIZ_DO_PACOTE, 'package.json'), 'utf8')) as Record<string, unknown>
    expect(pacote['dependencies'] ?? {}).toEqual({})
    expect(pacote['peerDependencies']).toBeUndefined()
  })
})
