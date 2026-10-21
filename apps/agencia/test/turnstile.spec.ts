// @vitest-environment jsdom
/**
 * **A verificação contra robô** (2.8), com uma Cloudflare falsa em `window.turnstile`: o widget desenhado no lugar
 * que a conferência dá, o token guardado até o envio, um token por envio, a falha sem rede e o widget que sai com a
 * conferência. O script de verdade quem confere é o E2E.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DesafioSemConexao } from '@navegsistemas/dados'

import { verificacaoTurnstile } from '../src/ilhas/turnstile'

interface Opcoes {
  readonly appearance: string
  readonly callback: (token: string) => void
  readonly 'error-callback': () => void
  readonly 'expired-callback': () => void
}

function cloudflareFalsa() {
  const widgets = new Map<string, { alvo: HTMLElement; opcoes: Opcoes }>()
  let proximo = 0
  const falsa = {
    render: vi.fn((alvo: HTMLElement, opcoes: Opcoes) => {
      const id = `w${proximo++}`
      widgets.set(id, { alvo, opcoes })
      return id
    }),
    reset: vi.fn(),
    remove: vi.fn((id: string) => widgets.delete(id)),
  }
  window.turnstile = falsa
  const ultimo = () => [...widgets.values()].at(-1)!
  return { falsa, widgets, ultimo }
}

/** Deixa a promessa do carregamento do script (já resolvida) chegar ao `render`. */
const assentar = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => {
  delete window.turnstile
  vi.restoreAllMocks()
})

describe('a verificação contra robô, na conferência', () => {
  it('desenha o widget visível no lugar dado, e só lá', async () => {
    const { falsa, ultimo } = cloudflareFalsa()
    const v = verificacaoTurnstile('chave')
    const alvo = document.createElement('div')
    v.montar(alvo)
    await assentar()
    expect(falsa.render).toHaveBeenCalledTimes(1)
    expect(ultimo().alvo).toBe(alvo)
    expect(ultimo().opcoes.appearance).toBe('always')
    expect(v.estado()).toBe('VERIFICANDO')
  })

  it('guarda o token, entrega uma vez, e zera o widget para o próximo envio', async () => {
    const { falsa, ultimo } = cloudflareFalsa()
    const v = verificacaoTurnstile('chave')
    const avisos = vi.fn()
    v.ouvir(avisos)
    v.montar(document.createElement('div'))
    await assentar()
    ultimo().opcoes.callback('token-1')
    expect(v.estado()).toBe('VERIFICADA')
    expect(avisos).toHaveBeenCalled()

    expect(await v.obterDesafio()).toBe('token-1')
    expect(falsa.reset).toHaveBeenCalledTimes(1)
    expect(v.estado()).toBe('VERIFICANDO')

    const segundo = v.obterDesafio()
    ultimo().opcoes.callback('token-2')
    expect(await segundo).toBe('token-2')
  })

  it('o token vencido volta a "verificando"', async () => {
    const { ultimo } = cloudflareFalsa()
    const v = verificacaoTurnstile('chave')
    v.montar(document.createElement('div'))
    await assentar()
    ultimo().opcoes.callback('token')
    ultimo().opcoes['expired-callback']()
    expect(v.estado()).toBe('VERIFICANDO')
  })

  it('sem rede, a falha é da conexão, e o envio recebe DesafioSemConexao', async () => {
    const { falsa, ultimo } = cloudflareFalsa()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const v = verificacaoTurnstile('chave')
    v.montar(document.createElement('div'))
    await assentar()
    ultimo().opcoes['error-callback']()
    expect(v.estado()).toBe('SEM_CONEXAO')
    await expect(v.obterDesafio()).rejects.toBeInstanceOf(DesafioSemConexao)

    v.tentarDeNovo()
    expect(falsa.reset).toHaveBeenCalledTimes(1)
    expect(v.estado()).toBe('VERIFICANDO')
  })

  it('com rede, a falha é da verificação', async () => {
    const { ultimo } = cloudflareFalsa()
    const v = verificacaoTurnstile('chave')
    v.montar(document.createElement('div'))
    await assentar()
    ultimo().opcoes['error-callback']()
    expect(v.estado()).toBe('FALHOU')
    await expect(v.obterDesafio()).rejects.not.toBeInstanceOf(DesafioSemConexao)
  })

  it('sai da tela com a conferência, e não guarda o token de antes', async () => {
    const { falsa, widgets, ultimo } = cloudflareFalsa()
    const v = verificacaoTurnstile('chave')
    const desmontar = v.montar(document.createElement('div'))
    await assentar()
    ultimo().opcoes.callback('token')
    desmontar()
    expect(falsa.remove).toHaveBeenCalledTimes(1)
    expect(widgets.size).toBe(0)
    await expect(v.obterDesafio()).rejects.toThrow()
  })
})
