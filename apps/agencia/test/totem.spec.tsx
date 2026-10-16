// @vitest-environment jsdom
/**
 * **O totem, dirigido de ponta a ponta** — com o catálogo de demonstração que vai para a página, um repositório
 * em memória e um relógio parado numa terça-feira, 13/10/2026, 08:00 em Belém.
 *
 * Os cenários são os do aceite do passo 8, e cada um confere a tela, não o domínio: que a opção que o casco
 * não admite **não existe** como botão, que o indicador cresce, que voltar apaga a resposta certa, que o
 * quiosque zera parado, que a saída que parte com a tela aberta é recusada com a mensagem certa.
 *
 * Na página, a reserva começa pelo que vai embarcar, antes do dia (naveg-front#66); o quiosque não muda, e começa
 * pela saída.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CatalogoDoFluviapp, DataCalendario } from '@navegsistemas/domain'
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
    quiosque?: boolean
    catalogo?: CatalogoDoFluviapp
  } = {},
) {
  const repositorio = new ReservaEmMemoria()
  render(
    <Totem
      fonte={catalogoFixo(opcoes.catalogo ?? CATALOGO_DE_DEMONSTRACAO)}
      envio={envioLocal(repositorio)}
      fuso={FUSO_DA_OPERACAO}
      inatividadeMs={opcoes.inatividadeMs ?? null}
      demonstracao={opcoes.demonstracao === undefined ? 'SAIDAS_E_ENVIO' : opcoes.demonstracao}
      atendimento={opcoes.atendimento ?? null}
      quiosque={opcoes.quiosque ?? false}
      relogio={opcoes.relogio ?? (() => TERCA_8H)}
    />,
  )
  return { repositorio }
}

/** As saídas listadas — só as da lista, e não as etapas nem a legenda do calendário. */
function saidasListadas(): HTMLElement[] {
  const lista = document.querySelector('.totem-travessias') as HTMLElement | null
  return lista === null ? [] : within(lista).queryAllByRole('listitem')
}

/** Escolhe a primeira saída cuja embarcação tem este nome — depois que as saídas carregaram. */
async function escolherSaida(embarcacao: string) {
  await screen.findAllByRole('button', { name: 'Reservar esta saída' })
  const item = saidasListadas().find((li) => li.textContent?.includes(embarcacao))
  if (item === undefined) throw new Error(`nenhuma saída do ${embarcacao}`)
  fireEvent.click(within(item).getByRole('button', { name: 'Reservar esta saída' }))
}

function tocar(nome: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name: nome }))
}

/** A pergunta do passo: `h3` na página, `h2` no quiosque. */
function pergunta(): string {
  const h3 = screen.queryByRole('heading', { level: 3 })
  return (h3 ?? screen.getByRole('heading', { level: 2 })).textContent ?? ''
}

function indicador(): string {
  return screen.getByText(/^Passo \d+ de \d+$/).textContent ?? ''
}

/* Os cartões do que vai embarcar levam a descrição no nome: por isso, o começo. */
const PASSAGEIROS = /^Passageiros(?! e)/
const PASSAGEIROS_E_VEICULO = /^Passageiros e veículo/
const VEICULO = /^Veículo/

/** Na página: passageiros, quantos e onde — e o que vai embarcar está respondido. */
function embarcarPassageiros(quantos = '1 pessoa', onde: RegExp = /^Rede/) {
  tocar(PASSAGEIROS)
  tocar(quantos)
  tocar(onde)
}

describe('a lista de saídas', () => {
  it('mostra as saídas da semana na ordem da partida, com os rótulos do catálogo', async () => {
    montar()
    embarcarPassageiros()
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    const itens = saidasListadas()
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
    embarcarPassageiros()
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    expect(screen.queryByText(/Demonstração\./)).toBeNull()
  })

  it('o aviso de reserva, não venda, acompanha o quiosque; na página, quem o diz é o subtítulo da seção (UI 1.3)', async () => {
    montar({ quiosque: true })
    expect(await screen.findByText(/Isto é uma reserva, não uma venda/)).toBeTruthy()
    cleanup()

    montar()
    embarcarPassageiros()
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    expect(screen.queryByText(/Isto é uma reserva, não uma venda/)).toBeNull()
  })
})

describe('o calendário, na página (UI 1.3)', () => {
  const NOVENTA_DIAS = 90

  function montarComCalendario(opcoes: { atendimento?: string | null } = {}) {
    render(
      <Totem
        fonte={catalogoFixo(CATALOGO_DE_DEMONSTRACAO)}
        envio={envioLocal(new ReservaEmMemoria())}
        fuso={FUSO_DA_OPERACAO}
        inatividadeMs={null}
        demonstracao="SAIDAS_E_ENVIO"
        atendimento={opcoes.atendimento ?? null}
        alcanceDoCalendario={NOVENTA_DIAS}
        relogio={() => TERCA_8H}
      />,
    )
    /* Na página, o que vai embarcar vem antes do dia (naveg-front#66). */
    embarcarPassageiros()
  }

  it('abre no primeiro dia com saída, e lista só as saídas daquele dia (decisão E)', async () => {
    montarComCalendario()
    expect(await screen.findByRole('heading', { level: 4, name: 'Saídas de terça-feira, 13 de outubro' })).toBeTruthy()
    expect(pergunta()).toBe('Escolha o dia')
    expect(saidasListadas().length).toBeGreaterThan(0)
    expect(saidasListadas().every((li) => li.textContent?.includes('13/10'))).toBe(true)
    expect(screen.getByRole('button', { name: /^terça-feira, 13 de outubro/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('escolher outro dia troca as saídas, e o foco vai para elas', async () => {
    montarComCalendario()
    await screen.findByRole('heading', { level: 4 })
    /* Respondido o que vai embarcar, o foco está na pergunta do dia, como a cada passo. */
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }))

    fireEvent.click(screen.getByRole('button', { name: /^quarta-feira, 14 de outubro/ }))
    const titulo = screen.getByRole('heading', { level: 4 })
    expect(titulo.textContent).toBe('Saídas de quarta-feira, 14 de outubro')
    expect(document.activeElement).toBe(titulo)
    expect(saidasListadas().every((li) => li.textContent?.includes('14/10'))).toBe(true)
  })

  it('o dia diz de onde sai, e um dia com os dois sentidos diz isso (decisão A)', async () => {
    montarComCalendario()
    const dia = await screen.findByRole('button', { name: /^quarta-feira, 14 de outubro/ })
    expect(dia.getAttribute('aria-label')).toBe('quarta-feira, 14 de outubro, saídas de Cidade Exemplo A e Cidade Exemplo B')
    expect(dia.textContent).toBe('14⇄')
  })

  it('o filtro de origem deixa só as saídas daquela cidade', async () => {
    montarComCalendario()
    await screen.findByRole('heading', { level: 4 })
    fireEvent.click(screen.getByRole('button', { name: 'Cidade Exemplo A' }))
    expect(screen.getByRole('button', { name: 'Cidade Exemplo A' }).getAttribute('aria-pressed')).toBe('true')
    expect(saidasListadas().length).toBeGreaterThan(0)
    expect(saidasListadas().every((li) => li.textContent?.includes('Cidade Exemplo A/PA →'))).toBe(true)
    expect(screen.getByRole('button', { name: /^quarta-feira, 14 de outubro/ }).textContent).toBe('14CEA')

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(saidasListadas().some((li) => li.textContent?.includes('Cidade Exemplo B/PA →'))).toBe(true)
  })

  it('os 90 dias se escolhem, sem o aviso do atendimento (naveg-front#51, fluviapp-kmp#44)', async () => {
    montarComCalendario({ atendimento: '(91) 99203-5322' })
    await screen.findByRole('heading', { level: 4 })
    /* Até a #51, só a semana (13 a 19/10) se reservava, e o dia 20 mandava para o atendimento (decisão B). */
    expect(screen.getByRole('button', { name: /^segunda-feira, 19 de outubro/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^terça-feira, 20 de outubro/ }))
    expect(saidasListadas().length).toBeGreaterThan(0)
    expect(screen.queryByText(/reserva pelo atendimento$/)).toBeNull()
    expect(screen.queryByRole('link', { name: 'fale com o atendimento pelo WhatsApp' })).toBeNull()
  })

  it('o mês anda de outubro até o do 90º dia, e não passa dele', async () => {
    montarComCalendario()
    await screen.findByRole('heading', { level: 4 })
    const anterior = screen.getByRole('button', { name: 'Mês anterior' }) as HTMLButtonElement
    expect(anterior.disabled).toBe(true)
    expect(screen.getByText('outubro de 2026')).toBeTruthy()

    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    /* 13/10/2026 + 89 dias = 10/01/2027. */
    expect(screen.getByText('janeiro de 2027')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Próximo mês' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: /^domingo, 10 de janeiro, saídas de/ })).toBeTruthy()
    expect(screen.getByText('segunda-feira, 11 de janeiro')).toBeTruthy()
  })

  it('escolher a saída leva aos dados, e voltar devolve ao mesmo dia', async () => {
    montarComCalendario()
    fireEvent.click(await screen.findByRole('button', { name: /^quarta-feira, 14 de outubro/ }))
    const ferry = saidasListadas().find((li) => li.textContent?.includes('Ferry de demonstração')) as HTMLElement
    fireEvent.click(within(ferry).getByRole('button', { name: 'Reservar esta saída' }))
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')

    tocar('Voltar')
    expect(pergunta()).toBe('Escolha o dia')
    expect(screen.getByRole('heading', { level: 4 }).textContent).toBe('Saídas de quarta-feira, 14 de outubro')
  })

  it('no teclado, só um dia entra no Tab, e as setas andam entre os dias com saída', async () => {
    montarComCalendario()
    const hoje = await screen.findByRole('button', { name: /^terça-feira, 13 de outubro/ })
    expect(hoje.tabIndex).toBe(0)
    expect(screen.getByRole('button', { name: /^quarta-feira, 14 de outubro/ }).tabIndex).toBe(-1)

    hoje.focus()
    fireEvent.keyDown(hoje, { key: 'ArrowRight' })
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^quarta-feira, 14 de outubro/)
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' })
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^quarta-feira, 21 de outubro/)
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' })
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^quarta-feira, 14 de outubro/)
    /* Uma semana acima do 14 é o dia 7, que já passou: o foco fica onde está. */
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' })
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^quarta-feira, 14 de outubro/)
    fireEvent.keyDown(document.activeElement as Element, { key: 'End' })
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^sábado, 31 de outubro/)
  })
})

/* naveg-front#66: a reserva começa pelo que vai embarcar, e o dia vem depois (ficha 2.2, segunda proposta). */
describe('o que vai embarcar, na página', () => {
  it('a primeira pergunta: o veículo em destaque, leve e pesado à vista, e a encomenda como quarta opção (2.7)', () => {
    montar()
    expect(pergunta()).toBe('O que vai embarcar?')
    const veiculo = screen.getByRole('button', { name: VEICULO })
    expect(veiculo.className).toContain('totem-cartao--principal')
    expect(veiculo.textContent).toContain('Pesado: caminhão')
    expect(screen.getByRole('button', { name: PASSAGEIROS_E_VEICULO })).toBeTruthy()
    expect(screen.getByRole('button', { name: PASSAGEIROS })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Encomenda/ }).textContent).toContain('Caixas, sacos')
    /* Na primeira pergunta não há para onde voltar. */
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
  })

  it('com a foto (decisão M), o cartão do veículo a mostra como decoração: o nome do botão continua "Veículo…"', () => {
    render(
      <Totem
        fonte={catalogoFixo(CATALOGO_DE_DEMONSTRACAO)}
        envio={envioLocal(new ReservaEmMemoria())}
        fuso={FUSO_DA_OPERACAO}
        inatividadeMs={null}
        demonstracao="SAIDAS_E_ENVIO"
        relogio={() => TERCA_8H}
        fotoDoVeiculo={{ src: '/_astro/regional.webp', srcset: '/_astro/regional-480.webp 480w' }}
      />,
    )
    const veiculo = screen.getByRole('button', { name: VEICULO })
    const foto = veiculo.querySelector('img')
    expect(foto?.getAttribute('src')).toBe('/_astro/regional.webp')
    expect(foto?.getAttribute('alt')).toBe('')
    /* Só o veículo tem foto. */
    expect(screen.getByRole('button', { name: PASSAGEIROS }).querySelector('img')).toBeNull()
  })

  it('passageiros e veículo, de ponta a ponta: uma reserva só, com as pessoas e sem o tipo', async () => {
    const { repositorio } = montar()
    tocar(PASSAGEIROS_E_VEICULO)
    expect(pergunta()).toBe('Leve ou pesado?')
    tocar(/^Pesado/)
    expect(pergunta()).toBe('Qual?')
    expect(screen.queryByRole('button', { name: 'Carro' })).toBeNull()
    tocar('Caminhão')
    expect(pergunta()).toBe('Quantos viajam?')
    tocar('3 pessoas')
    tocar(/^Rede/)

    expect(pergunta()).toBe('Escolha a saída')
    expect(screen.getByText('Caminhão + 3 pessoas em rede')).toBeTruthy()
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    /* O caminhão só vai no ferry: a lancha não leva veículo, e o navio só leva carro e moto. */
    expect(saidasListadas().every((li) => li.textContent?.includes('Ferry de demonstração'))).toBe(true)

    await escolherSaida('Ferry de demonstração')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')
    expect(pergunta()).toBe('Confira a reserva')
    expect(
      screen.getByText('Caminhão, com 3 pessoas em rede'),
    ).toBeTruthy()
    tocar('Confirmar reserva')
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    const documento = repositorio.documento(codigo)
    expect(documento).toMatchObject({ categoria: 'VEICULO', classe: 'CAMINHAO', quantidadePessoas: 3, acomodacao: 'REDE' })
    expect(documento).not.toHaveProperty('tipo')
  })

  it('a moto: leve, a cilindrada, e o navio entra entre as saídas — a lancha, não', async () => {
    montar()
    tocar(VEICULO)
    tocar(/^Leve/)
    tocar('Moto')
    expect(pergunta()).toBe('Qual a cilindrada da moto?')
    fireEvent.change(screen.getByLabelText('Cilindrada (cc)'), { target: { value: '160' } })
    tocar('Continuar')
    expect(screen.getByText('Moto · 160 cc')).toBeTruthy()
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    expect(saidasListadas().some((li) => li.textContent?.includes('Navio de demonstração'))).toBe(true)
    expect(saidasListadas().some((li) => li.textContent?.includes('Lancha de demonstração'))).toBe(false)
  })

  it('"Mudar" volta à primeira pergunta, e voltar da lista apaga a última resposta do embarque', async () => {
    montar()
    embarcarPassageiros('2 pessoas')
    expect(screen.getByText('2 pessoas em rede')).toBeTruthy()
    tocar('Voltar')
    expect(pergunta()).toBe('Onde vocês querem viajar?')
    tocar(/^Suíte/)
    expect(screen.getByText('2 pessoas em suíte')).toBeTruthy()
    tocar('Mudar')
    expect(pergunta()).toBe('O que vai embarcar?')
  })
})

/* 2.7: a encomenda no caminho da reserva (decisões A a H, PO, 2026-10-15), e o destinatário opcional (#58). */
describe('a encomenda, na página', () => {
  /** O tipo com o "O que é", quantos volumes e o peso — o que vai embarcar da encomenda. */
  function embarcarEncomenda() {
    tocar(/^Encomenda/)
    expect(pergunta()).toBe('O que vai mandar?')
    tocar('Caixa')
    fireEvent.change(screen.getByLabelText(/O que é/), { target: { value: 'mantimentos' } })
    tocar('Continuar')
    expect(pergunta()).toBe('Quantos volumes?')
    tocar('3 volumes')
    expect(pergunta()).toBe('Quanto pesa, mais ou menos?')
    tocar('5 a 20 kg')
  }

  it('de ponta a ponta, sem o destinatário: o celular obrigatório, "Pular", e quem retira a combinar', async () => {
    const { repositorio } = montar()
    embarcarEncomenda()
    expect(screen.getByText('3 volumes · Caixa (mantimentos) · 5 a 20 kg')).toBeTruthy()
    await escolherSaida('Ferry de demonstração')

    expect(pergunta()).toBe('Quem está mandando?')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    tocar('Continuar')
    /* Sem o celular, não segue: é por ele que o atendimento fala com quem manda. */
    expect(pergunta()).toBe('Quem está mandando?')
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')

    expect(pergunta()).toBe('Quem recebe no destino?')
    /* Os campos de quem recebe começam vazios: não herdam o que se digitou para quem manda. */
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/^Celular com/) as HTMLInputElement).value).toBe('')
    tocar(/^Pular/)
    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('A combinar com o atendimento')).toBeTruthy()
    expect(screen.getByText(/retirada no porto com documento/)).toBeTruthy()

    tocar('Confirmar reserva')
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    const documento = repositorio.documento(codigo)
    expect(documento).toMatchObject({
      categoria: 'ENCOMENDA',
      tipoVolume: 'CAIXA',
      complemento: 'mantimentos',
      quantidadeVolumes: 3,
      faixaPeso: 'DE_5_A_20',
      cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
    })
    expect(documento).not.toHaveProperty('retirada')
    expect(screen.getByRole('button', { name: 'Reservar mais alguma coisa' })).toBeTruthy()
  })

  it('com o destinatário: "outra pessoa retira", com o nome e o celular dele', async () => {
    const { repositorio } = montar()
    embarcarEncomenda()
    await escolherSaida('Ferry de demonstração')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João Lima' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '96988887777' } })
    tocar('Continuar')
    expect(screen.getByRole('region', { name: 'Quem recebe' }).textContent).toBe('Quem recebeMudarJoão Lima(96) 98888-7777')
    tocar('Confirmar reserva')
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    expect(repositorio.documento(codigo)).toMatchObject({
      retirada: 'OUTRA_PESSOA',
      destinatario: { nome: 'João Lima', telefone: '5596988887777' },
    })
  })

  it('no calendário, só os próximos 7 dias acendem, e uma linha diz por quê', async () => {
    render(
      <Totem
        fonte={catalogoFixo(CATALOGO_DE_DEMONSTRACAO)}
        envio={envioLocal(new ReservaEmMemoria())}
        fuso={FUSO_DA_OPERACAO}
        inatividadeMs={null}
        demonstracao="SAIDAS_E_ENVIO"
        alcanceDoCalendario={90}
        relogio={() => TERCA_8H}
      />,
    )
    embarcarEncomenda()
    await screen.findByRole('heading', { level: 4 })
    expect(screen.getByText(/A encomenda se reserva para os próximos 7 dias/)).toBeTruthy()
    /* Hoje é 13/10: o 19 se reserva, o 20 não. */
    expect(screen.getByRole('button', { name: /^segunda-feira, 19 de outubro/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^terça-feira, 20 de outubro/ })).toBeNull()
  })

  it('a âncora do botão "Mandar uma encomenda" começa a reserva pela encomenda', () => {
    window.location.hash = '#reservar-encomenda'
    try {
      montar()
      expect(pergunta()).toBe('O que vai mandar?')
    } finally {
      window.location.hash = ''
    }
  })
})

/* 2.4 (PO, 2026-10-16): a conferência em três blocos, com o "Mudar", e o que acontece ao confirmar. */
describe('a conferência, na página', () => {
  async function ateAConferencia() {
    const montado = montar()
    embarcarPassageiros('2 pessoas')
    await escolherSaida('Ferry de demonstração')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')
    expect(pergunta()).toBe('Confira a reserva')
    return montado
  }

  it('três blocos, na ordem de quem escolheu, e a nota embaixo do botão, sem "Vale até"', async () => {
    await ateAConferencia()
    const blocos = screen.getAllByRole('region').map((bloco) => bloco.getAttribute('aria-label'))
    expect(blocos).toEqual(['O que vai', 'A viagem', 'Em nome de'])
    expect(screen.getByText('2 pessoas em rede')).toBeTruthy()
    expect(screen.getByText(/^Embarque no .* · Ferry de demonstração$/)).toBeTruthy()
    expect(screen.queryByText('Vale até')).toBeNull()
    expect(screen.queryByText('Desembarque')).toBeNull()
    expect(
      screen.getByText(
        'Nada é pago agora. Ao confirmar, você recebe o código e fala com o atendimento pelo WhatsApp. A reserva vale até a saída.',
      ),
    ).toBeTruthy()
  })

  it('"Mudar" em quem reserva: o formulário volta preenchido, e a saída e o embarque ficam', async () => {
    await ateAConferencia()
    tocar('Mudar: em nome de')
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Maria Souza')
    expect((screen.getByLabelText(/^Celular com/) as HTMLInputElement).value).toBe('(91) 98888-7777')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria S. Lima' } })
    tocar('Continuar')
    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('Maria S. Lima')).toBeTruthy()
    expect(screen.getByText('2 pessoas em rede')).toBeTruthy()
  })

  it('"Trocar" na viagem volta à escolha da saída, com o que vai embarcar respondido', async () => {
    await ateAConferencia()
    tocar('Trocar: a viagem')
    /* Sem o alcance do calendário, a escolha é pela lista; com ele, pelo calendário — o mesmo "Trocar a saída". */
    expect(pergunta()).toBe('Escolha a saída')
    expect(screen.getByText('2 pessoas em rede')).toBeTruthy()
  })

  it('"Voltar" da conferência não apaga o nome e o celular', async () => {
    await ateAConferencia()
    tocar('Voltar')
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Maria Souza')
  })

  it('o quiosque segue com as linhas, sem blocos', async () => {
    montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } })
    tocar('Continuar')
    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.queryAllByRole('region')).toHaveLength(0)
    expect(screen.getByText('Vale até')).toBeTruthy()
  })
})

describe('o roteiro, na tela', () => {
  it('passageiros de ponta a ponta: do embarque ao código, e o documento gravado sem o tipo', async () => {
    const { repositorio } = montar()

    expect(pergunta()).toBe('O que vai embarcar?')
    tocar(PASSAGEIROS)
    expect(pergunta()).toBe('Quantos viajam?')
    tocar('1 pessoa')
    expect(pergunta()).toBe('Onde vocês querem viajar?')
    tocar(/^Rede/)
    expect(pergunta()).toBe('Escolha a saída')
    await escolherSaida('Ferry de demonstração')
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await usuario.type(screen.getByLabelText(/^Celular com/), '(91) 98888-7777')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('1 pessoa em rede')).toBeTruthy()
    expect(screen.getByText('Inteira, meia ou gratuidade: no atendimento')).toBeTruthy()
    expect(screen.getByText('(91) 98888-7777')).toBeTruthy()

    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    const documento = repositorio.documento(codigo)
    expect(documento).toMatchObject({
      status: 'RESERVADA',
      categoria: 'PASSAGEIRO',
      acomodacao: 'REDE',
      quantidadePessoas: 1,
      cliente: { nome: 'Maria Souza', telefone: '5591988887777' },
      expiraEm: '2026-10-13T18:00:00',
    })
    expect(documento).not.toHaveProperty('tipo')
  })

  it('"5 ou mais" abre o contador, e o grupo vai numa suíte sem o teto dela', async () => {
    const { repositorio } = montar()
    tocar(PASSAGEIROS)
    expect(screen.getAllByRole('button', { name: /^\d pessoas?$/ }).map((b) => b.textContent)).toEqual([
      '1 pessoa',
      '2 pessoas',
      '3 pessoas',
      '4 pessoas',
    ])
    tocar('5 ou mais')
    /* "5 ou mais" não responde: abre o contador, e a pergunta continua a mesma. */
    expect(pergunta()).toBe('Quantos viajam?')
    const campo = screen.getByLabelText('Quantas pessoas') as HTMLInputElement
    expect(campo.value).toBe('5')
    expect((screen.getByRole('button', { name: 'Uma pessoa a menos' }) as HTMLButtonElement).disabled).toBe(true)
    tocar('Uma pessoa a mais')
    tocar('Uma pessoa a mais')
    expect(campo.value).toBe('7')

    fireEvent.change(campo, { target: { value: '51' } })
    tocar('Continuar')
    expect(screen.getByText('De 5 a 50 pessoas. Mais do que isso, fale com o atendimento.')).toBeTruthy()
    expect(pergunta()).toBe('Quantos viajam?')

    fireEvent.change(campo, { target: { value: '7' } })
    tocar('Continuar')
    tocar(/^Suíte/)
    await escolherSaida('Ferry de demonstração')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')
    expect(screen.getByText('7 pessoas em suíte')).toBeTruthy()
    tocar('Confirmar reserva')
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    expect(repositorio.documento(codigo)).toMatchObject({ acomodacao: 'SUITE', quantidadePessoas: 7 })
  })

  it('no quiosque, gratuidade acrescenta o passo do subtipo — e o indicador cresce', async () => {
    montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    expect(indicador()).toBe('Passo 3 de 5')
    tocar('Gratuidade')
    /* No quiosque, a pergunta é o h2: a página cheia não tem título de seção acima dela. */
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Qual gratuidade?')
    expect(indicador()).toBe('Passo 4 de 6')
  })

  it('no quiosque, a suíte pergunta quantas pessoas, até a lotação, e não o tipo — é sempre inteira', async () => {
    montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Suíte/)
    expect(pergunta()).toBe('Quantas pessoas?')
    expect(screen.queryByRole('button', { name: 'Meia' })).toBeNull()
    expect(screen.getByRole('button', { name: '3 pessoas' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '5 ou mais' })).toBeNull()
  })

  it('no quiosque, a rede inteira vai com o tipo — o quiosque não muda', async () => {
    const { repositorio } = montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')
    expect(screen.getByText('Rede · Inteira · 1 pessoa')).toBeTruthy()
    tocar('Confirmar reserva')
    const codigo = (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
    expect(repositorio.documento(codigo)).toMatchObject({ acomodacao: 'REDE', tipo: 'INTEIRA', quantidadePessoas: 1 })
  })

  it('no quiosque, na lancha, "Veículo" não é um botão desabilitado — não existe', async () => {
    montar({ quiosque: true })
    await escolherSaida('Lancha de demonstração')
    expect(screen.getByRole('button', { name: 'Passageiro' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Veículo' })).toBeNull()
  })

  it('no quiosque, no navio, a classe não é perguntada; a moto vai direto para a cilindrada', async () => {
    montar({ quiosque: true })
    await escolherSaida('Navio de demonstração')
    tocar('Veículo')
    expect(pergunta()).toBe('Que tipo de veículo?')
    /* O navio só leva carro e moto: as outras naturezas nem aparecem. */
    expect(screen.queryByRole('button', { name: 'Rebocado' })).toBeNull()
    tocar('Moto e similares')
    expect(pergunta()).toBe('Qual a cilindrada da moto?')
  })

  /* 2.3 (PO, 2026-10-16): na página, o celular é obrigatório (A), com o WhatsApp no nome (B) e a linha de privacidade (C). */
  it('na página, o celular é obrigatório: sem ele, ou com um fixo, não avança', async () => {
    montar()
    embarcarPassageiros()
    await escolherSaida('Ferry de demonstração')
    expect(screen.getByText(/É pelo WhatsApp deste celular/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Política de privacidade' }).getAttribute('href')).toBe('/privacidade/')
    expect(screen.getByText(/apagamos 14 dias depois da viagem/)).toBeTruthy()

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Nome'), 'Maria')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')
    expect(screen.getByText('Informe um celular com DDD, como (91) 98888-7777.')).toBeTruthy()

    await usuario.type(screen.getByLabelText('Celular com WhatsApp'), '3222-1111')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')

    await usuario.clear(screen.getByLabelText('Celular com WhatsApp'))
    await usuario.type(screen.getByLabelText('Celular com WhatsApp'), '91988887777')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('(91) 98888-7777')).toBeTruthy()
  })

  it('no quiosque, o celular continua opcional, e sem a linha de privacidade', async () => {
    montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    expect(screen.getByText(/O telefone é opcional/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Política de privacidade' })).toBeNull()

    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Nome'), 'Maria')
    await usuario.type(screen.getByLabelText(/Celular com DDD/), '3222-1111')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByText(/Precisa ser um celular com DDD/)).toBeTruthy()

    await usuario.clear(screen.getByLabelText(/Celular com DDD/))
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(pergunta()).toBe('Confira a reserva')
    expect(screen.getByText('Não informado')).toBeTruthy()
  })

  it('o celular ganha a máscara enquanto se digita: só os dígitos viram "(91) 98888-7777"', async () => {
    montar()
    embarcarPassageiros()
    await escolherSaida('Ferry de demonstração')
    const usuario = userEvent.setup()
    const campo = screen.getByLabelText(/^Celular com/) as HTMLInputElement
    await usuario.type(campo, '9198888')
    expect(campo.value).toBe('(91) 9888-8')
    await usuario.type(campo, '7777')
    expect(campo.value).toBe('(91) 98888-7777')
  })

  it('voltar apaga a resposta do passo anterior, e o põe em foco', async () => {
    montar()
    tocar(PASSAGEIROS)
    tocar('2 pessoas')
    expect(pergunta()).toBe('Onde vocês querem viajar?')

    tocar('Voltar')
    expect(pergunta()).toBe('Quantos viajam?')
    /* A escolha de antes foi apagada: nenhum cartão marcado. */
    expect(screen.getByRole('button', { name: '2 pessoas' }).getAttribute('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }))
  })

  it('o passo em foco é anunciado ao leitor de tela: a etapa na página, o número no quiosque', async () => {
    montar()
    tocar(PASSAGEIROS)
    expect(screen.getByText('O que vai embarcar. Quantos viajam?')).toBeTruthy()
    cleanup()
    montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    expect(screen.getByText('Passo 2 de 4. Onde você quer viajar?')).toBeTruthy()
  })
})

/* A 2.2 do roteiro (PO, 2026-10-14): as etapas pelo nome, o quadro da saída com o cais e o aviso de alteração, e o
   recomeçar que pergunta antes. O quiosque não muda, a não ser pelo quadro da saída, que é informação. */
describe('a saída escolhida e as etapas (UI 2.2)', () => {
  const etapas = () => within(screen.getByRole('list', { name: 'Etapas da reserva' }))
  const atual = () => etapas().getByText((_, el) => el?.getAttribute('aria-current') === 'step').textContent

  it('as etapas pelo nome não crescem com as respostas', async () => {
    montar()
    expect(atual()).toBe('O que vai embarcar')
    tocar(PASSAGEIROS)
    tocar('5 ou mais')
    tocar('Continuar')
    expect(pergunta()).toBe('Onde vocês querem viajar?')
    expect(atual()).toBe('O que vai embarcar')
    tocar(/^Rede/)
    expect(atual()).toBe('Dia e saída')
    await escolherSaida('Ferry de demonstração')
    expect(atual()).toBe('Seus dados')
    expect(etapas().getAllByRole('listitem')).toHaveLength(4)
    expect(screen.queryByText(/^Passo \d+ de \d+$/)).toBeNull()
  })

  it('o quadro diz o cais de embarque e o de desembarque, e "Trocar a saída" volta sem perder as respostas', async () => {
    montar()
    embarcarPassageiros()
    await escolherSaida('Ferry de demonstração')
    expect(screen.getByText('Embarque: Porto de demonstração · Cidade Exemplo A/PA')).toBeTruthy()
    expect(screen.getByText(/^Desembarque: Porto de demonstração · Cidade Exemplo B\/PA · Ferry de demonstração/)).toBeTruthy()
    tocar('Trocar a saída')
    expect(pergunta()).toBe('Escolha a saída')
    await escolherSaida('Ferry de demonstração')
    /* As respostas ficaram: o roteiro continua de onde parou. */
    expect(pergunta()).toBe('Em nome de quem fica a reserva?')
  })

  it('recomeçar pergunta antes de apagar', () => {
    montar()
    tocar(PASSAGEIROS)
    tocar('Recomeçar a reserva')
    expect(screen.getByText('Apagar as respostas e começar de novo?')).toBeTruthy()
    tocar('Não, continuar')
    expect(pergunta()).toBe('Quantos viajam?')
    tocar('Recomeçar a reserva')
    tocar('Sim, recomeçar')
    expect(pergunta()).toBe('O que vai embarcar?')
  })

  it('o quiosque não muda: "Passo n de m", o recomeçar de antes, e o quadro sem "Trocar"', async () => {
    montar({ quiosque: true })
    await escolherSaida('Ferry de demonstração')
    expect(screen.getByText(/^Passo \d+ de \d+$/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Recomeçar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Trocar a saída' })).toBeNull()
    expect(screen.getByText('Embarque: Porto de demonstração · Cidade Exemplo A/PA')).toBeTruthy()
  })

  it('a data alterada avisa no quadro e na conferência, com a hora do dia', async () => {
    const ferryDeQuarta = CATALOGO_DE_DEMONSTRACAO.viagens.find((v) => v.id === 'demo-ferry-ida-wednesday')
    if (ferryDeQuarta === undefined) throw new Error('o catálogo de demonstração mudou')
    montar({
      catalogo: {
        ...CATALOGO_DE_DEMONSTRACAO,
        alteracoes: [
          {
            ocorrencia: { viagemId: ferryDeQuarta.id, data: '2026-10-14' as DataCalendario },
            portoEmbarqueId: 'demo-porto-a',
            portoDesembarqueId: 'demo-porto-b',
            horaMin: 19 * 60,
            motivo: 'Cais em obra',
          },
        ],
      },
    })
    embarcarPassageiros()
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    const quarta = saidasListadas().find((li) => li.textContent?.includes('14/10 · 19:00'))
    if (quarta === undefined) throw new Error('a saída alterada não está na lista')
    fireEvent.click(within(quarta).getByRole('button', { name: 'Reservar esta saída' }))
    expect(screen.getByText('Embarque alterado nesta data: Cais em obra')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
    tocar('Continuar')
    expect(pergunta()).toBe('Confira a reserva')
    expect(atual()).toBe('Conferir')
    /* Na conferência, o aviso está no resumo, e o quadro sai: ele repetiria a saída inteira. */
    expect(screen.getAllByText('Embarque alterado nesta data: Cais em obra')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Trocar a saída' })).toBeNull()
    expect(screen.getByText('Quarta-feira, 14/10 · 19:00')).toBeTruthy()
    expect(screen.getByText(/Nada é pago agora. .* A reserva vale até a saída./)).toBeTruthy()
  })
})

describe('o tempo', () => {
  it('a saída que parte com a tela aberta é recusada na conferência, com a saída para outra', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let agora = TERCA_8H
    montar({ relogio: () => agora })
    embarcarPassageiros()
    await escolherSaida('Ferry de demonstração')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } })
    fireEvent.change(screen.getByLabelText(/^Celular com/), { target: { value: '91988887777' } })
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
    expect(saidasListadas()[0]?.textContent).not.toContain('13/10 · 18:00')
  })

  it('no quiosque, a pergunta do passo é h2 — não há título de seção acima dela, e pular um nível desorienta o leitor de tela', async () => {
    montar({ quiosque: true })
    await screen.findAllByRole('button', { name: 'Reservar esta saída' })
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Escolha a saída')
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
  })

  it('no quiosque, parado tempo demais, o totem zera — o dado do próximo não nasce com o do anterior', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    montar({ inatividadeMs: 90_000, quiosque: true })
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

  it('no quiosque, tocar na tela adia o zerar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    montar({ inatividadeMs: 90_000, quiosque: true })
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
    embarcarPassageiros()
    await escolherSaida('Ferry de demonstração')
    await usuario.type(screen.getByLabelText('Nome'), 'Maria Souza')
    await usuario.type(screen.getByLabelText(/^Celular com/), '91988887777')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    return (await screen.findByText(/^NVG-[0-9A-Z]{6}$/)).textContent as string
  }

  it('com o número do atendimento, a conclusão abre a conversa já com a reserva escrita', async () => {
    montar({ demonstracao: null, atendimento: '(91) 98888-7777' })
    const codigo = await reservarRede(userEvent.setup())

    /* Na página, o WhatsApp é o passo que falta, logo abaixo do código (2.4, E). */
    expect(screen.getByText(/^Falta um passo: envie a reserva ao atendimento/)).toBeTruthy()
    expect(screen.getByText('Se não abrir, fale com o atendimento pelo (91) 98888-7777, com o código.')).toBeTruthy()
    const botao = screen.getByRole('link', { name: 'Enviar pelo WhatsApp' })
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

    expect(screen.queryByRole('link', { name: 'Enviar pelo WhatsApp' })).toBeNull()
    expect(screen.getByText('Fale com o atendimento pelo WhatsApp, com o código.')).toBeTruthy()
  })

  it('na demonstração, o botão não aparece — a reserva não foi enviada a ninguém', async () => {
    montar({ demonstracao: 'SAIDAS_E_ENVIO', atendimento: '(91) 98888-7777' })
    await reservarRede(userEvent.setup())

    expect(screen.queryByRole('link', { name: 'Enviar pelo WhatsApp' })).toBeNull()
    expect(screen.getByText(/Nesta demonstração a reserva não é enviada/)).toBeTruthy()
  })

  it('na página, a conclusão traz a reserva em blocos, sem o "Mudar", e o "Copiar" ao lado do código', async () => {
    montar({ demonstracao: null, atendimento: '(91) 98888-7777' })
    await reservarRede(userEvent.setup())
    const blocos = screen.getAllByRole('region').map((bloco) => bloco.getAttribute('aria-label'))
    expect(blocos).toEqual(['O que vai', 'A viagem', 'Em nome de'])
    expect(screen.queryByRole('button', { name: /^Mudar/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeTruthy()
    expect(screen.queryByText('Reserva registrada. Guarde este código:')).toBeNull()
  })

  it('no quiosque, a conclusão não muda: "Enviar ao atendimento" e as linhas', async () => {
    montar({ quiosque: true, demonstracao: null, atendimento: '(91) 98888-7777' })
    await escolherSaida('Ferry de demonstração')
    tocar('Passageiro')
    tocar(/^Rede/)
    tocar('Inteira')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } })
    tocar('Continuar')
    tocar('Confirmar reserva')
    await screen.findByText(/^NVG-[0-9A-Z]{6}$/)
    expect(screen.getByRole('link', { name: 'Enviar ao atendimento' })).toBeTruthy()
    expect(screen.getByText('Reserva registrada. Guarde este código:')).toBeTruthy()
    expect(screen.queryAllByRole('region')).toHaveLength(0)
  })
})
