// @vitest-environment jsdom
/**
 * **O totem, dirigido de ponta a ponta** — com o catálogo de demonstração que vai para a página, um repositório
 * em memória e um relógio parado numa terça-feira, 13/10/2026, 08:00 em Belém.
 *
 * Os cenários são os do aceite do passo 8, e cada um confere a tela, não o domínio: que a opção que o casco
 * não admite **não existe** como botão, que o indicador cresce, que voltar apaga a resposta certa, que o
 * quiosque zera parado, que a saída que parte com a tela aberta é recusada com a mensagem certa.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { catalogoFixo, envioLocal, ReservaEmMemoria } from '@navegsistemas/dados'

import { CATALOGO_DE_DEMONSTRACAO } from '../src/conteudo/catalogo-de-demonstracao'
import { FUSO_DA_OPERACAO } from '../src/conteudo/operacao'
import { Totem, type Demonstracao } from '../src/ilhas/Totem'

/** 11:00 UTC é 08:00 em Belém: o ferry das 18:00 e o navio das 21:30 de hoje ainda não partiram. */
const TERCA_8H = new Date('2026-10-13T11:00:00Z')

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function montar(
  opcoes: {
    inatividadeMs?: number | null
    relogio?: () => Date
    demonstracao?: Demonstracao | null
    atendimento?: string | null
  } = {},
) {
  const repositorio = new ReservaEmMemoria()
  render(
    <Totem
      fonte={catalogoFixo(CATALOGO_DE_DEMONSTRACAO)}
      envio={envioLocal(repositorio)}
      fuso={FUSO_DA_OPERACAO}
      inatividadeMs={opcoes.inatividadeMs ?? null}
      demonstracao={opcoes.demonstracao === undefined ? 'SAIDAS_E_ENVIO' : opcoes.demonstracao}
      atendimento={opcoes.atendimento ?? null}
      relogio={opcoes.relogio ?? (() => TERCA_8H)}
    />,
  )
  return { repositorio }
}

/** Escolhe a primeira saída cuja embarcação tem este nome. */
async function escolherSaida(embarcacao: string) {
  const itens = await screen.findAllByRole('listitem')
  const item = itens.find((li) => li.textContent?.includes(embarcacao))
  if (item === undefined) throw new Error(`nenhuma saída do ${embarcacao}`)
  fireEvent.click(within(item).getByRole('button', { name: 'Reservar esta saída' }))
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

describe('a lista de saídas', () => {
  it('mostra as saídas da semana na ordem da partida, com os rótulos do catálogo', async () => {
    montar()
    const itens = await screen.findAllByRole('listitem')
    /* Hoje às 08:00: a lancha das 07:00 já partiu; a primeira é o ferry das 18:00. */
    expect(itens[0]?.textContent).toContain('Ferry de demonstração')
    expect(itens[0]?.textContent).toContain('Terça-feira, 13/10 · 18:00')
    expect(itens[1]?.textContent).toContain('21:30')
    expect(screen.getByText(/Demonstração\./)).toBeTruthy()
  })

  it('a faixa diz o que ainda é de mentira — e só isso', async () => {
    montar({ demonstracao: 'SAIDAS_E_ENVIO' })
    expect(await screen.findByText(/saídas abaixo são fictícias/)).toBeTruthy()
    cleanup()

    /* Com a API configurada, as saídas são as da operação: dizer que são fictícias seria mentir ao contrário. */
    montar({ demonstracao: 'ENVIO' })
    expect(await screen.findByText(/saídas abaixo são as da operação, mas nenhuma reserva é enviada/)).toBeTruthy()
    expect(screen.queryByText(/fictícias/)).toBeNull()
    cleanup()

    montar({ demonstracao: null })
    await screen.findAllByRole('listitem')
    expect(screen.queryByText(/Demonstração\./)).toBeNull()
  })

  it('o aviso de reserva, não venda, acompanha o totem', async () => {
    montar()
    expect(await screen.findByText(/Isto é uma reserva, não uma venda/)).toBeTruthy()
  })
})

describe('o roteiro, na tela', () => {
  it('rede inteira de ponta a ponta: da saída ao código, e o documento gravado', async () => {
    const { repositorio } = montar()
    await escolherSaida('Ferry de demonstração')

    expect(pergunta()).toBe('O que vai embarcar?')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await usuario.type(screen.getByLabelText(/Celular com DDD/), '(91) 98888-7777')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('Rede · Inteira · 1 pessoa')).toBeTruthy()
    expect(screen.getByText('(91) 98888-7777')).toBeTruthy()

    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    expect(repositorio.documento(codigo)).toMatchObject({
      status: 'RESERVADA',
      acomodacao: 'REDE',
      quantidadePessoas: 1,
      cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
      expiraEm: '2026-10-13T18:00:00',
    })
  })

  it('gratuidade acrescenta o passo do subtipo — e o indicador cresce', async () => {
    montar()
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    expect(indicador()).toBe('Passo 3 de 5')
    tocar('Gratuidade')
    expect(pergunta()).toBe('Qual gratuidade?')
    expect(indicador()).toBe('Passo 4 de 6')
  })

  it('suíte pergunta quantas pessoas, e não o tipo — é sempre inteira', async () => {
    montar()
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Suíte/)
    expect(pergunta()).toBe('Quantas pessoas?')
    expect(screen.queryByRole('button', { name: 'Meia' })).toBeNull()
    expect(screen.getByRole('button', { name: '3 pessoas' })).toBeTruthy()
  })

  it('na lancha, "Veículo" não é um botão desabilitado — não existe', async () => {
    montar()
    await escolherSaida('Lancha de demonstração')
    expect(screen.getByRole('button', { name: 'Passageiro' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Veículo' })).toBeNull()
  })

  it('no navio, a classe não é perguntada; a moto vai direto para a cilindrada', async () => {
    montar()
    await escolherSaida('Navio de demonstração')
    tocar('Veículo')
    expect(pergunta()).toBe('Que tipo de veículo?')
    /* O navio só leva carro e moto: as outras naturezas nem aparecem. */
    expect(screen.queryByRole('button', { name: 'Rebocado' })).toBeNull()
    tocar('Moto e similares')
    expect(pergunta()).toBe('Qual a cilindrada da moto?')
  })

  it('o telefone é opcional — e o inválido é apontado na hora, sem avançar', async () => {
    montar()
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Nome'), 'Maria')
    await usuario.type(screen.getByLabelText(/Celular com DDD/), '3222-1111')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')
    expect(screen.getByText(/Precisa ser um celular com DDD/)).toBeTruthy()

    await usuario.clear(screen.getByLabelText(/Celular com DDD/))
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('Não informado')).toBeTruthy()
  })

  it('voltar apaga a resposta do passo anterior, e o põe em foco', async () => {
    montar()
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    expect(pergunta()).toBe('Qual o tipo da passagem?')

    tocar('Voltar')
    expect(pergunta()).toBe('Onde você quer viajar?')
    /* A escolha de antes foi apagada: nenhum cartão marcado. */
    expect(screen.getByRole('button', { name: /^Rede/ }).getAttribute('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }))
  })

  it('o passo em foco é anunciado ao leitor de tela', async () => {
    montar()
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    expect(screen.getByText('Passo 2 de 4. Onde você quer viajar?')).toBeTruthy()
  })
})

describe('o tempo', () => {
  it('a saída que parte com a tela aberta é recusada na conferência, com a saída para outra', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let agora = TERCA_8H
    montar({ relogio: () => agora })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } })
    tocar('Continuar')
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeTruthy()

    /* 18:01 em Belém: o ferry das 18:00 partiu. O relógio do totem anda a cada minuto. */
    agora = new Date('2026-10-13T21:01:00Z')
    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText('Esta saída já partiu. Escolha outra travessia.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).toBeNull()

    tocar('Escolher outra saída')
    expect(pergunta()).toBe('Escolha a saída')
    /* E o ferry de hoje não está mais na lista. */
    expect(screen.getAllByRole('listitem')[0]?.textContent).not.toContain('13/10 · 18:00')
  })

  it('no quiosque, parado tempo demais, o totem zera — o dado do próximo não nasce com o do anterior', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    montar({ inatividadeMs: 90_000 })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    expect(pergunta()).toBe('Qual o tipo da passagem?')

    await act(async () => {
      vi.advanceTimersByTime(89_000)
    })
    expect(pergunta()).toBe('Qual o tipo da passagem?')

    await act(async () => {
      vi.advanceTimersByTime(2_000)
    })
    expect(pergunta()).toBe('Escolha a saída')

    /* E recomeçar é mesmo do zero: a acomodação escolhida antes não sobreviveu. */
    await escolherSaida('Ferry de demonstração')
    expect(pergunta()).toBe('O que vai embarcar?')
  })

  it('tocar na tela adia o zerar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    montar({ inatividadeMs: 90_000 })
    await escolherSaida('Ferry de demonstração')
    await act(async () => {
      vi.advanceTimersByTime(80_000)
    })
    fireEvent.pointerDown(document.body)
    await act(async () => {
      vi.advanceTimersByTime(80_000)
    })
    expect(pergunta()).toBe('O que vai embarcar?')
  })
})

describe('o handoff para o WhatsApp (passo 11)', () => {
  async function reservarRede(usuario: ReturnType<typeof userEvent.setup>) {
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    await usuario.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    return (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
  }

  it('com o número do atendimento, a conclusão abre a conversa já com a reserva escrita', async () => {
    montar({ demonstracao: null, atendimento: '(91) 98888-7777' })
    const codigo = await reservarRede(userEvent.setup())

    const botao = screen.getByRole('link', { name: 'Enviar ao atendimento' })
    const href = botao.getAttribute('href') ?? ''
    expect(href.startsWith('https://wa.me/5591988887777?text=')).toBe(true)
    expect(botao.getAttribute('target')).toBe('_blank')

    const mensagem = new URL(href).searchParams.get('text') ?? ''
    expect(mensagem.split('\n')[0]).toBe(`Reserva ${codigo}`)
    expect(mensagem).toContain('Rede · 1 pessoa · Maria Souza')
    /* O código continua na tela, em texto: o redirecionamento pode falhar. */
    expect(screen.getByText(codigo)).toBeTruthy()
  })

  it('sem o número, nenhum botão que não abre nada: o código e a orientação', async () => {
    montar({ demonstracao: null, atendimento: null })
    await reservarRede(userEvent.setup())

    expect(screen.queryByRole('link', { name: 'Enviar ao atendimento' })).toBeNull()
    expect(screen.getByText('Fale com o atendimento pelo WhatsApp informando este código.')).toBeTruthy()
  })

  it('na demonstração, o botão não aparece — a reserva não foi enviada a ninguém', async () => {
    montar({ demonstracao: 'SAIDAS_E_ENVIO', atendimento: '(91) 98888-7777' })
    await reservarRede(userEvent.setup())

    expect(screen.queryByRole('link', { name: 'Enviar ao atendimento' })).toBeNull()
    expect(screen.getByText(/Nesta demonstração a reserva não é enviada/)).toBeTruthy()
  })
})
