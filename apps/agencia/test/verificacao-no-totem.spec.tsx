// @vitest-environment jsdom
/**
 * **A verificação contra robô dentro do totem** (2.8): a verificação de verdade (`verificacaoTurnstile`), com uma
 * Cloudflare falsa, ligada ao envio pela API como na ilha. O que só o conjunto mostra: o botão que espera o token, o
 * token que vai no pedido, e o "Tentar de novo" que leva um token novo.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { catalogoFixo, envioHttp } from '@navegsistemas/dados'

import { CATALOGO_DE_DEMONSTRACAO } from '../src/conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO } from '../src/conteudo/operacao'
import { Totem } from '../src/ilhas/Totem'
import { verificacaoTurnstile, type VerificacaoContraRobo } from '../src/ilhas/turnstile'
import { PassoDaVerificacao, useEstadoDaVerificacao } from '../src/ilhas/VerificacaoContraRobo'

const TERCA_8H = new Date('2026-10-13T11:00:00Z')

interface Opcoes {
  readonly callback: (token: string) => void
}

/** A Cloudflare falsa: cada widget novo, ou zerado, entrega o próximo token quando o teste mandar. */
function cloudflareFalsa() {
  const widgets = new Map<string, Opcoes>()
  let proximo = 0
  window.turnstile = {
    render: (_alvo, opcoes) => {
      const id = `w${proximo++}`
      widgets.set(id, opcoes)
      return id
    },
    reset: vi.fn(),
    remove: (id) => void widgets.delete(id),
  }
  return { entregar: (token: string) => [...widgets.values()].at(-1)?.callback(token) }
}

function TotemComVerificacao({ verificacao, buscar }: { verificacao: VerificacaoContraRobo; buscar: typeof fetch }) {
  const estado = useEstadoDaVerificacao(verificacao)
  return (
    <Totem
      fonte={catalogoFixo(CATALOGO_DE_DEMONSTRACAO)}
      envio={envioHttp('https://api.exemplo', verificacao.obterDesafio, buscar)}
      fuso={FUSO_DA_OPERACAO}
      inatividadeMs={null}
      demonstracao={null}
      quiosque
      relogio={() => TERCA_8H}
      verificacao={
        estado === null
          ? null
          : { elemento: <PassoDaVerificacao verificacao={verificacao} estado={estado} />, verificada: estado === 'VERIFICADA' }
      }
    />
  )
}

afterEach(() => {
  cleanup()
  delete window.turnstile
})

describe('a verificação contra robô no totem', () => {
  it('o botão espera o token; o "Tentar de novo" manda outro pedido, com outro token', async () => {
    const cloudflare = cloudflareFalsa()
    const desafios: string[] = []
    const buscar = vi.fn(async (_url: string, init?: RequestInit) => {
      desafios.push((JSON.parse(String(init?.body)) as { desafio: string }).desafio)
      return new Response(null, { status: 503 })
    }) as unknown as typeof fetch
    render(<TotemComVerificacao verificacao={verificacaoTurnstile('chave')} buscar={buscar} />)

    const saida = (await screen.findAllByRole('button', { name: 'Reservar esta saída' }))[0]!
    fireEvent.click(saida)
    fireEvent.click(screen.getByRole('button', { name: 'Passageiro' }))
    fireEvent.click(screen.getByRole('button', { name: /^Rede/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Inteira' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByText('Verificação contra robô')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Verificando…' }) as HTMLButtonElement).disabled).toBe(true)

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
      cloudflare.entregar('token-1')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/^A reserva não foi enviada/)
    expect(screen.getByRole('button', { name: 'Verificando…' })).toBeTruthy()

    act(() => cloudflare.entregar('token-2'))
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await vi.waitFor(() => expect(desafios).toEqual(['token-1', 'token-2']))
  })
})
