/**
 * **De onde o totem tira o catálogo** — a API por padrão, a demonstração só quando pedida, e o endereço torto
 * quebrando o build.
 */
import { describe, expect, it } from 'vitest'

import { envioConfigurado, fonteConfigurada, URL_DA_API_PADRAO, UrlDaApiInvalida } from '../src/conteudo/api'

describe('a fonte do catálogo', () => {
  it('sem configuração, é a API de produção — o site publicado não mostra saídas fictícias por esquecimento', () => {
    expect(fonteConfigurada(undefined)).toEqual({ tipo: 'API', url: URL_DA_API_PADRAO })
    expect(fonteConfigurada('   ')).toEqual({ tipo: 'API', url: URL_DA_API_PADRAO })
    expect(URL_DA_API_PADRAO.startsWith('https://')).toBe(true)
  })

  it('a demonstração é pedida pelo nome', () => {
    expect(fonteConfigurada('demonstracao')).toEqual({ tipo: 'DEMONSTRACAO' })
  })

  it('outra API: https em qualquer lugar, http só na máquina de quem desenvolve — sem a barra do fim', () => {
    expect(fonteConfigurada('https://outra-api.vercel.app/')).toEqual({ tipo: 'API', url: 'https://outra-api.vercel.app' })
    expect(fonteConfigurada('http://localhost:3000')).toEqual({ tipo: 'API', url: 'http://localhost:3000' })
  })

  it('o que não é nada disso quebra o build, em vez de virar um totem que nunca carrega', () => {
    for (const torto of ['naveg-api-vercel.vercel.app', 'http://naveg-api-vercel.vercel.app', 'demonstração', 'ftp://x']) {
      expect(() => fonteConfigurada(torto), torto).toThrow(UrlDaApiInvalida)
    }
  })
})

describe('para onde a reserva vai', () => {
  const API = fonteConfigurada(undefined)

  it('para a API só com o catálogo dela e a chave do desafio', () => {
    expect(envioConfigurado(API, '0x4AAAAAAA')).toEqual({ tipo: 'API', url: URL_DA_API_PADRAO, chaveDoDesafio: '0x4AAAAAAA' })
  })

  it('sem a chave, fica em memória — a API recusaria todo envio sem desafio', () => {
    expect(envioConfigurado(API, undefined)).toEqual({ tipo: 'MEMORIA' })
    expect(envioConfigurado(API, '  ')).toEqual({ tipo: 'MEMORIA' })
  })

  it('na demonstração, nunca para a API — mesmo com a chave', () => {
    expect(envioConfigurado({ tipo: 'DEMONSTRACAO' }, '0x4AAAAAAA')).toEqual({ tipo: 'MEMORIA' })
  })
})
