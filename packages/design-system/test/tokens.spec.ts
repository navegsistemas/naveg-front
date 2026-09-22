/**
 * **A estrutura do `tokens.css`, e a disciplina que ela impõe ao resto do repositório.**
 *
 * A separação em duas camadas só vale se for verdade, e aqui ela vira verificação. A régua é simples e
 * mecânica: **todo semântico é um `var(...)`, todo primitivo é um valor literal.** É por ela que estes
 * cenários sabem quem é quem sem prefixo de nome e sem convenção escrita em comentário.
 *
 * O cenário que mais paga o próprio custo é o da **paridade entre os temas**: o bloco escuro existe duas
 * vezes (a preferência do sistema e a escolha explícita), e duas cópias manuais divergem. Aqui elas não têm
 * como divergir em silêncio.
 */
import { describe, expect, it } from 'vitest'

import {
  SELETOR_CLARO,
  SELETOR_ESCURO_EXPLICITO,
  SELETOR_ESCURO_PREFERIDO,
  arquivosDeFonte,
  conteudoDe,
  corpoDoBloco,
  declaracoes,
  ehReferencia,
  lerTokens,
  resolver,
} from './cor.js'
import { DESENHOS, LADO_DO_ICONE, SLUGS_DE_ICONE } from '../src/icones.js'
import { COR_DA_MARCA, ORIGEM_DA_COR } from '../src/marca.js'

const css = lerTokens()

const claro = declaracoes(corpoDoBloco(css, SELETOR_CLARO))
const escuroExplicito = declaracoes(corpoDoBloco(css, SELETOR_ESCURO_EXPLICITO))
const escuroPreferido = declaracoes(corpoDoBloco(css, SELETOR_ESCURO_PREFERIDO))

const semanticos = [...claro].filter(([, valor]) => ehReferencia(valor)).map(([nome]) => nome)
const primitivos = [...claro].filter(([, valor]) => !ehReferencia(valor)).map(([nome]) => nome)

describe('as duas camadas', () => {
  it('existem as duas, e nenhuma está vazia', () => {
    expect(primitivos.length).toBeGreaterThan(0)
    expect(semanticos.length).toBeGreaterThan(0)
  })

  it('nenhum bloco de tema introduz um valor literal — tema é troca de referência', () => {
    for (const [nome, valor] of [...escuroExplicito, ...escuroPreferido]) {
      expect(ehReferencia(valor), `${nome} guarda um valor literal num bloco de tema`).toBe(true)
    }
  })

  it('todo var() resolve a um primitivo declarado', () => {
    for (const [nome, valor] of claro) {
      expect(() => resolver(claro, valor), `${nome} não resolve`).not.toThrow()
    }
  })
})

describe('a paridade entre os temas', () => {
  it('o bloco escuro declara exatamente os semânticos que o claro declara', () => {
    /* Um token declarado no claro e esquecido no escuro não quebra o build nem o layout: ele só herda o
       valor do claro e fica ilegível sobre o fundo escuro. É o defeito que este cenário existe para
       tornar impossível. */
    expect([...escuroExplicito.keys()].sort()).toEqual([...semanticos].sort())
  })

  it('as duas formas do tema escuro são idênticas, declaração por declaração', () => {
    /* A media query e o `[data-theme="dark"]` são duas cópias do mesmo tema, e cópia manual diverge. */
    expect(Object.fromEntries(escuroPreferido)).toEqual(Object.fromEntries(escuroExplicito))
  })
})

describe('a cor mora em um lugar só', () => {
  /**
   * As duas casas permitidas. `marca.ts` existe porque `<meta name="theme-color">` e o manifesto não
   * aceitam `var()` — e ela não é um furo na regra porque o cenário seguinte a amarra aos tokens.
   */
  const CASAS_DA_COR = ['/src/tokens.css', '/src/marca.ts']

  it('nenhum arquivo de fonte fora das duas casas escreve uma cor à mão', () => {
    const infratores: string[] = []

    for (const caminho of arquivosDeFonte()) {
      if (CASAS_DA_COR.some((casa) => caminho.endsWith(casa))) continue

      const achados = conteudoDe(caminho).match(/#[0-9a-fA-F]{3,8}\b/g)
      if (achados !== null) infratores.push(`${caminho}: ${achados.join(', ')}`)
    }

    /* Os SVG da marca não entram na varredura: eles **são** a marca, e carregam as cores dela por
       definição. Qualquer outro arquivo que precise de cor pede um token. */
    expect(infratores).toEqual([])
  })

  it('o literal de `marca.ts` é idêntico ao token de que ele é cópia', () => {
    for (const [chave, token] of Object.entries(ORIGEM_DA_COR)) {
      const literal = COR_DA_MARCA[chave as keyof typeof COR_DA_MARCA]
      expect(literal, `COR_DA_MARCA.${chave} divergiu de ${token}`).toBe(resolver(claro, `var(${token})`))
    }
  })
})

describe('os ícones', () => {
  it('todo slug declarado tem desenho, e nenhum desenho é órfão', () => {
    expect(Object.keys(DESENHOS).sort()).toEqual([...SLUGS_DE_ICONE].sort())
  })

  it('todo caminho é um path absoluto e não vazio', () => {
    for (const slug of SLUGS_DE_ICONE) {
      const desenho = DESENHOS[slug]
      expect(desenho.caminhos.length, `${slug} não tem caminho`).toBeGreaterThan(0)

      for (const caminho of desenho.caminhos) {
        expect(caminho.startsWith('M'), `${slug}: caminho não começa em M`).toBe(true)
      }
    }
  })

  it('todo ícone tem rótulo — é o que vira aria-label quando ele aparece sozinho', () => {
    for (const slug of SLUGS_DE_ICONE) {
      expect(DESENHOS[slug].rotulo.trim().length, `${slug} sem rótulo`).toBeGreaterThan(0)
    }
  })

  it('o viewBox é o mesmo para todos', () => {
    expect(LADO_DO_ICONE).toBe(24)
  })
})
