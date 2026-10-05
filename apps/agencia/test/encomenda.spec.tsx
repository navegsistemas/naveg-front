// @vitest-environment jsdom
/**
 * **A seção "Envie sua encomenda", dirigida de ponta a ponta** — com o catálogo de demonstração, um repositório
 * em memória e o mesmo relógio parado do totem: terça-feira, 13/10/2026, 08:00 em Belém.
 *
 * O roteiro é conferido no domínio; aqui se confere a tela: o indicador que cresce com "Outra pessoa", o celular
 * que passa a ser obrigatório com "Eu mesmo", o destinatário desfeito que não vai gravado, e o link do WhatsApp.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { catalogoFixo, envioLocalDaEncomenda, ReservaEmMemoria } from '@navegsistemas/dados'

import { CATALOGO_DE_DEMONSTRACAO } from '../src/conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO } from '../src/conteudo/operacao'
import { Encomenda } from '../src/ilhas/Encomenda'

/** 11:00 UTC é 08:00 em Belém: o ferry das 18:00 de hoje ainda não partiu. */
const TERCA_8H = new Date('2026-10-13T11:00:00Z')

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function montar(opcoes: { atendimento?: string | null; relogio?: () => Date } = {}) {
  const repositorio = new ReservaEmMemoria()
  render(
    <Encomenda
      fonte={catalogoFixo(CATALOGO_DE_DEMONSTRACAO)}
      envio={envioLocalDaEncomenda(repositorio)}
      fuso={FUSO_DA_OPERACAO}
      demonstracao={null}
      atendimento={opcoes.atendimento ?? null}
      relogio={opcoes.relogio ?? (() => TERCA_8H)}
    />,
  )
  return { repositorio }
}

async function escolherSaida(embarcacao: string) {
  const itens = await screen.findAllByRole('listitem')
  const item = itens.find((li) => li.textContent?.includes(embarcacao))
  if (item === undefined) throw new Error(`nenhuma saída do ${embarcacao}`)
  fireEvent.click(within(item).getByRole('button', { name: 'Enviar nesta saída' }))
}

function tocar(nome: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name: nome }))
}

function pergunta(): string {
  return screen.getByRole('heading', { level: 3 }).textContent ?? ''
}

function indicador(): string {
  return screen.getByText(/^Passo \d+ de \d+$/).textContent ?? ''
}

/** Do volume ao passo de quem retira: três caixas de mantimentos, 5 a 20 kg. */
async function ateQuemRetira(usuario: ReturnType<typeof userEvent.setup>) {
  await escolherSaida('Ferry de demonstração')
  expect(pergunta()).toBe('O que vai mandar?')
  tocar(/^Caixa/)
  await usuario.clear(screen.getByLabelText('Quantos volumes'))
  await usuario.type(screen.getByLabelText('Quantos volumes'), '3')
  await usuario.type(screen.getByLabelText(/O que é/), 'mantimentos')
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

  expect(pergunta()).toBe('Quanto pesa, mais ou menos?')
  tocar(/^5 a 20 kg/)
  expect(pergunta()).toBe('Quem retira no destino?')
}

describe('a seção de encomenda', () => {
  it('oferece as mesmas saídas do totem, com o aviso de reserva, não venda', async () => {
    montar()
    const itens = await screen.findAllByRole('listitem')
    expect(itens[0]?.textContent).toContain('Terça-feira, 13/10 · 18:00')
    expect(within(itens[0] as HTMLElement).getByRole('button', { name: 'Enviar nesta saída' })).toBeTruthy()
    expect(screen.getByText(/nada é pago aqui/)).toBeTruthy()
  })

  it('outra pessoa retira: o indicador cresce, e a encomenda gravada leva o destinatário', async () => {
    const { repositorio } = montar()
    const usuario = userEvent.setup()
    await ateQuemRetira(usuario)
    expect(indicador()).toBe('Passo 3 de 5')

    tocar(/^Outra pessoa/)
    expect(pergunta()).toBe('Para quem vai?')
    expect(indicador()).toBe('Passo 4 de 6')
    await usuario.type(screen.getByLabelText('Nome'), 'João Lima')
    await usuario.type(screen.getByLabelText('Celular com DDD'), '(96) 98888-7777')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(pergunta()).toBe('Quem está mandando?')
    await usuario.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(pergunta()).toBe('Confira a encomenda')
    expect(screen.getByText('3 volumes · Caixa (mantimentos) · 5 a 20 kg')).toBeTruthy()
    expect(screen.getByText('João Lima, (96) 98888-7777')).toBeTruthy()

    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('Encomenda registrada. Guarde este código:')).toBeTruthy()
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    expect(repositorio.documento(codigo)).toEqual(
      expect.objectContaining({
        categoria: 'ENCOMENDA',
        status: 'RESERVADA',
        tipoVolume: 'CAIXA',
        quantidadeVolumes: 3,
        complemento: 'mantimentos',
        faixaPeso: 'DE_5_A_20',
        retirada: 'OUTRA_PESSOA',
        destinatario: { nome: 'João Lima', telefone: '5596988887777' },
        cliente: { nome: 'Maria Souza' },
        expiraEm: '2026-10-13T18:00:00',
      }),
    )
  })

  it('"Eu mesmo": não há destinatário, e o celular de quem manda é obrigatório', async () => {
    const { repositorio } = montar()
    const usuario = userEvent.setup()
    await ateQuemRetira(usuario)
    tocar(/^Eu mesmo/)

    expect(pergunta()).toBe('Quem está mandando?')
    expect(indicador()).toBe('Passo 4 de 5')
    expect(screen.getByText(/o celular é obrigatório/)).toBeTruthy()
    await usuario.type(screen.getByLabelText('Nome'), 'Carlos Melo')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Quem está mandando?')
    expect(screen.getByText('Informe um celular com DDD, como (91) 98888-7777.')).toBeTruthy()

    await usuario.type(screen.getByLabelText('Celular com DDD'), '(91) 98888-1234')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }))

    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    const documento = repositorio.documento(codigo)
    expect(documento).toMatchObject({ retirada: 'REMETENTE', cliente: { nome: 'Carlos Melo', telefone: '5591988881234' } })
    expect(documento).not.toHaveProperty('destinatario')
  })

  it('o destinatário de um "Outra pessoa" desfeito não vai gravado', async () => {
    const { repositorio } = montar()
    const usuario = userEvent.setup()
    await ateQuemRetira(usuario)
    tocar(/^Outra pessoa/)
    await usuario.type(screen.getByLabelText('Nome'), 'João Lima')
    await usuario.type(screen.getByLabelText('Celular com DDD'), '(96) 98888-7777')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    /* Volta até quem retira e muda de ideia. */
    tocar('Voltar')
    expect(pergunta()).toBe('Para quem vai?')
    tocar('Voltar')
    expect(pergunta()).toBe('Quem retira no destino?')
    tocar(/^Eu mesmo/)

    await usuario.type(screen.getByLabelText('Nome'), 'Carlos Melo')
    await usuario.type(screen.getByLabelText('Celular com DDD'), '(91) 98888-1234')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }))

    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    expect(repositorio.documento(codigo)).not.toHaveProperty('destinatario')
  })

  it('o volume não avança sem o tipo, nem com mais de 20', async () => {
    montar()
    const usuario = userEvent.setup()
    await escolherSaida('Ferry de demonstração')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('Escolha o tipo do volume.')).toBeTruthy()

    tocar(/^Móvel/)
    await usuario.clear(screen.getByLabelText('Quantos volumes'))
    await usuario.type(screen.getByLabelText('Quantos volumes'), '21')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText('De 1 a 20 volumes.')).toBeTruthy()
    expect(pergunta()).toBe('O que vai mandar?')
  })

  it('com o número do atendimento, a conclusão abre a conversa com a encomenda escrita', async () => {
    montar({ atendimento: '(91) 98888-7777' })
    const usuario = userEvent.setup()
    await ateQuemRetira(usuario)
    tocar(/^Eu mesmo/)
    await usuario.type(screen.getByLabelText('Nome'), 'Carlos Melo')
    await usuario.type(screen.getByLabelText('Celular com DDD'), '(91) 98888-1234')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }))

    const link = await screen.findByRole('link', { name: 'Enviar ao atendimento' })
    const mensagem = new URL(link.getAttribute('href') ?? '').searchParams.get('text') ?? ''
    const linhas = mensagem.split('\n')
    expect(linhas[0]).toMatch(/^Encomenda NVG-[0-9A-Z]{6}$/)
    expect(linhas[2]).toBe('3 volumes · Caixa (mantimentos) · 5 a 20 kg')
    expect(linhas[3]).toBe('Carlos Melo envia e retira no destino, (91) 98888-1234')
    expect(linhas[4]).toBe('Entregue no porto antes da partida.')
  })

  it('a saída que parte com a tela aberta é recusada na conferência', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let agora = TERCA_8H
    montar({ relogio: () => agora })
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await ateQuemRetira(usuario)
    tocar(/^Eu mesmo/)
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Carlos' } })
    fireEvent.change(screen.getByLabelText('Celular com DDD'), { target: { value: '(91) 98888-1234' } })
    tocar('Continuar')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeTruthy()

    agora = new Date('2026-10-13T21:01:00Z')
    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText('Esta saída já partiu. Escolha outra travessia.')).toBeTruthy()
    tocar('Escolher outra saída')
    expect(pergunta()).toBe('Escolha a saída')
  })
})
