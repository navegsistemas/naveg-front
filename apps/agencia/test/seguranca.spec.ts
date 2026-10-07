/**
 * **A política do site** — só o próprio site e a API, e cada página somando o que usa.
 */
import { describe, expect, it } from 'vitest'

import { fonteConfigurada } from '../src/conteudo/api'
import { folhaDaVitrine } from '../src/conteudo/embarcacoes'
import { diretivasDoSite, hashDoTrecho, politicaDaPagina, somarOTurnstile, type PoliticaDaPagina } from '../src/conteudo/seguranca'

describe('a política do site', () => {
  it('a API é a única origem de fora, e só para conversa', () => {
    const diretivas = diretivasDoSite(fonteConfigurada('https://outra-api.vercel.app/'))
    expect(diretivas).toContain("connect-src 'self' https://outra-api.vercel.app")
    expect(diretivas.filter((d) => d.includes('https://'))).toEqual(["connect-src 'self' https://outra-api.vercel.app"])
  })

  it('sem API (a demonstração), o navegador não conversa com ninguém além do site', () => {
    expect(diretivasDoSite(fonteConfigurada('demonstracao'))).toContain("connect-src 'self'")
  })

  it('a API da máquina de quem desenvolve entra pela origem, com a porta — é a do E2E', () => {
    expect(diretivasDoSite(fonteConfigurada('http://localhost:4599'))).toContain("connect-src 'self' http://localhost:4599")
  })

  it('nada de inline nem eval, nada de <object>, e a base e os formulários presos ao site', () => {
    const diretivas = diretivasDoSite(fonteConfigurada(undefined))
    expect(diretivas.join('; ')).not.toMatch(/unsafe/)
    expect(diretivas).toEqual(expect.arrayContaining(["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]))
  })

  it('a base não traz script-src nem style-src: esses o Astro monta, com os hashes', () => {
    const diretivas = diretivasDoSite(fonteConfigurada(undefined))
    expect(diretivas.some((d) => /^(script|style)-src\b/.test(d))).toBe(false)
  })

  it('o Turnstile soma o script e o quadro, da mesma origem', () => {
    const somado: string[] = []
    const politica = {
      insertScriptResource: (recurso: unknown) => somado.push(`script ${String(recurso)}`),
      insertDirective: (diretiva: unknown) => somado.push(`diretiva ${String(diretiva)}`),
    } as unknown as PoliticaDaPagina
    somarOTurnstile(politica)
    expect(somado).toEqual(['script https://challenges.cloudflare.com', 'diretiva frame-src https://challenges.cloudflare.com'])
  })

  it('sem política ligada, o build quebra — em vez de publicar o site sem nenhuma', () => {
    expect(() => politicaDaPagina(undefined)).toThrow(/security\.csp/)
  })
})

describe('o hash de um trecho gerado', () => {
  it('é o sha256 em base64, como a política o quer', () => {
    /* O do texto vazio — o que o Astro punha para a folha da vitrine, antes de a página declarar a dela. */
    expect(hashDoTrecho('')).toBe('sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=')
  })

  it('a folha da vitrine leva a duração junto dos quadros — ela não vai mais num style=""', () => {
    expect(folhaDaVitrine(3)).toContain('.vitrine__trilho { --vitrine-duracao: 21s; }')
    expect(folhaDaVitrine(3)).toMatch(/^@keyframes naveg-vitrine-desfile \{/)
  })
})
